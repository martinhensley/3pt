/**
 * Vercel Blob Upload Utility
 *
 * Handles uploading card images to Vercel Blob storage.
 */

import { put, del } from '@vercel/blob';

/**
 * Upload a card image to Vercel Blob storage
 *
 * @param dataUri - Base64 data URI of the image
 * @param filename - Filename for the blob (should be unique)
 * @returns Blob URL
 */
export async function uploadCardImage(
  dataUri: string,
  filename: string
): Promise<string> {
  try {
    // Convert data URI to Blob
    const blob = dataUriToBlob(dataUri);

    // Upload to Vercel Blob
    const { url } = await put(filename, blob, {
      access: 'public',
      addRandomSuffix: true,
    });

    console.log(`Uploaded image: ${filename} -> ${url}`);
    return url;
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple card images in parallel
 *
 * @param images - Array of { dataUri, filename } objects
 * @returns Array of blob URLs
 */
export async function uploadCardImages(
  images: Array<{ dataUri: string; filename: string }>
): Promise<string[]> {
  return Promise.all(
    images.map(({ dataUri, filename }) => uploadCardImage(dataUri, filename))
  );
}

/**
 * Upload front and back images for a card
 *
 * @param cardId - Unique card ID
 * @param frontImage - Front image data URI
 * @param backImage - Back image data URI (optional)
 * @returns Object with front and back blob URLs
 */
export async function uploadCardFrontBack(
  cardId: string,
  frontImage: string,
  backImage?: string
): Promise<{ front: string; back?: string }> {
  const uploads: Array<{ dataUri: string; filename: string }> = [
    { dataUri: frontImage, filename: `cards/${cardId}-front.jpg` },
  ];

  if (backImage) {
    uploads.push({ dataUri: backImage, filename: `cards/${cardId}-back.jpg` });
  }

  const urls = await uploadCardImages(uploads);

  return {
    front: urls[0],
    back: backImage ? urls[1] : undefined,
  };
}

/**
 * Delete a card image from Vercel Blob storage
 *
 * @param blobUrl - URL of the blob to delete
 */
export async function deleteCardImage(blobUrl: string): Promise<void> {
  try {
    await del(blobUrl);
    console.log(`Deleted image: ${blobUrl}`);
  } catch (error) {
    console.error('Blob delete error:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete multiple card images in parallel
 *
 * @param blobUrls - Array of blob URLs to delete
 */
export async function deleteCardImages(blobUrls: string[]): Promise<void> {
  await Promise.all(blobUrls.map((url) => deleteCardImage(url)));
}

/**
 * Convert a data URI to a Blob object
 *
 * @param dataUri - Base64 data URI
 * @returns Blob object
 */
function dataUriToBlob(dataUri: string): Blob {
  // Validate data URI format
  if (!dataUri.startsWith('data:')) {
    throw new Error('Invalid data URI format');
  }

  // Extract MIME type and base64 data
  const [header, base64Data] = dataUri.split(',');
  if (!base64Data) {
    throw new Error('No base64 data found in URI');
  }

  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

/**
 * Get blob URL from a data URI or existing URL
 * (Helper function to normalize image URLs)
 *
 * @param imageSource - Either a data URI or existing blob URL
 * @param filename - Filename to use if upload is needed
 * @returns Blob URL
 */
export async function ensureBlobUrl(
  imageSource: string,
  filename: string
): Promise<string> {
  // If it's already a blob URL, return as-is
  if (imageSource.startsWith('http')) {
    return imageSource;
  }

  // If it's a data URI, upload it
  if (imageSource.startsWith('data:')) {
    return uploadCardImage(imageSource, filename);
  }

  throw new Error('Invalid image source format');
}

/**
 * Generate a unique filename for a card image
 *
 * @param cardId - Card ID
 * @param side - 'front' or 'back'
 * @param timestamp - Optional timestamp (defaults to Date.now())
 * @returns Unique filename
 */
export function generateCardImageFilename(
  cardId: string,
  side: 'front' | 'back',
  timestamp: number = Date.now()
): string {
  return `cards/${cardId}-${side}-${timestamp}.jpg`;
}
