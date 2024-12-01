import { handleError } from './utils';

export async function replicateTransform(imageUrl: string) {
  try {
    const response = await fetch('/api/replicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to transform image');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    handleError(error);
    return null;
  }
}