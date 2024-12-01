import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { saveOutputLocally } from '@/lib/fileStorage';

const REPLICATE_MAX_ATTEMPTS = 30;
const REPLICATE_DELAY_MS = 2000;

async function pollReplicateResult(predictionId: string) {
  for (let i = 0; i < REPLICATE_MAX_ATTEMPTS; i++) {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to check prediction status');
    }

    const prediction = await response.json();
    console.log('Prediction status:', prediction.status);
    console.log('Prediction output:', prediction.output);
    
    if (prediction.status === 'succeeded') {
      let transformedImageUrl;
      
      // Handle both single URL and array of image objects
      if (Array.isArray(prediction.output)) {
        // If output is an array of objects with 'image' property
        if (typeof prediction.output[0] === 'object' && prediction.output[0].image) {
          transformedImageUrl = prediction.output[0].image;
        } 
        // If output is an array of URLs
        else {
          transformedImageUrl = prediction.output[0];
        }
      } else {
        transformedImageUrl = prediction.output;
      }

      if (!transformedImageUrl || typeof transformedImageUrl !== 'string') {
        throw new Error('Invalid output format from Replicate');
      }
      
      try {
        const localPath = await saveOutputLocally(transformedImageUrl, predictionId);
        console.log(`Output saved locally at: ${localPath}`);
        
        const cloudinaryUrl = await uploadToCloudinary(transformedImageUrl);
        console.log('Uploaded to Cloudinary:', cloudinaryUrl);
        
        return {
          cloudinaryUrl,
          localPath,
          originalOutput: transformedImageUrl
        };
      } catch (error) {
        console.error('Error processing output:', error);
        throw new Error(`Failed to process output: ${error.message}`);
      }
    } 
    
    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Image transformation failed');
    }

    await new Promise(resolve => setTimeout(resolve, REPLICATE_DELAY_MS));
  }

  throw new Error('Transformation timed out');
}

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    console.log('Processing image:', imageUrl);

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "9451bfbf652b21a9bccc741e5c7046540faa5586cfa3aa45abc7dbb46151a4f7",
        input: {
          image: imageUrl,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start transformation');
    }

    const prediction = await response.json();
    console.log('Started prediction:', prediction.id);
    
    const result = await pollReplicateResult(prediction.id);
    console.log('Transformation complete:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}