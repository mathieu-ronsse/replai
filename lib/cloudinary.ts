import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadToCloudinary(imageUrl: string) {
  try {
    console.log('Uploading to Cloudinary:', imageUrl);
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'imaginify_transformed',
      timeout: 60000, // Increase timeout to 60 seconds
    });
    
    console.log('Cloudinary upload result:', result);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload transformed image: ${error.message}`);
  }
}