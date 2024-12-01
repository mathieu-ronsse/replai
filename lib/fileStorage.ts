import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

const OUTPUTS_DIR = path.join(process.cwd(), 'public', 'outputs');

export async function ensureOutputsDirectory() {
  await fs.ensureDir(OUTPUTS_DIR);
}

export async function saveOutputLocally(imageUrl: string, predictionId: string): Promise<string> {
  try {
    await ensureOutputsDirectory();
    
    console.log('Downloading image from:', imageUrl);
    
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });
    
    const fileName = `${predictionId}.png`;
    const filePath = path.join(OUTPUTS_DIR, fileName);
    
    await fs.writeFile(filePath, response.data);
    console.log('File saved locally at:', filePath);
    
    // Return the public URL path
    return `/outputs/${fileName}`;
  } catch (error) {
    console.error('Error saving file locally:', error);
    throw new Error(`Failed to save file locally: ${error.message}`);
  }
}