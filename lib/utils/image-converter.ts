/**
 * Image Conversion Utility
 *
 * Converts various image formats (HEIC, HEIF, PNG, WEBP) to standard JPEG
 * for consistent processing and storage.
 */

import sharp from 'sharp';

export interface ConversionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: Required<ConversionOptions> = {
  maxWidth: 1600,
  maxHeight: 2400,
  quality: 85,
};

/**
 * Convert an image file to JPEG format with optional resizing
 *
 * @param file - The input image file
 * @param options - Conversion options (max dimensions, quality)
 * @returns Base64 data URI of the converted JPEG image
 */
export async function convertImageToJpeg(
  file: File,
  options: ConversionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process with Sharp
    let image = sharp(buffer);

    // Get metadata to calculate resize dimensions
    const metadata = await image.metadata();

    if (metadata.width && metadata.height) {
      const { width, height } = calculateDimensions(
        metadata.width,
        metadata.height,
        opts.maxWidth,
        opts.maxHeight
      );

      if (width < metadata.width || height < metadata.height) {
        image = image.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
    }

    // Convert to JPEG
    const jpegBuffer = await image
      .jpeg({ quality: opts.quality })
      .toBuffer();

    // Convert to base64 data URI
    const base64 = jpegBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Image conversion error:', error);
    throw new Error(`Failed to convert image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert a base64 data URI to a different format or resize it
 *
 * @param dataUri - Base64 data URI
 * @param options - Conversion options
 * @returns Converted base64 data URI
 */
export async function convertDataUri(
  dataUri: string,
  options: ConversionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Validate and extract base64 data
    if (!dataUri.startsWith('data:image/')) {
      throw new Error('Invalid data URI format');
    }

    const base64Data = dataUri.split(',')[1];
    if (!base64Data) {
      throw new Error('No base64 data found in URI');
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Process with Sharp
    let image = sharp(buffer);

    // Get metadata
    const metadata = await image.metadata();

    if (metadata.width && metadata.height) {
      const { width, height } = calculateDimensions(
        metadata.width,
        metadata.height,
        opts.maxWidth,
        opts.maxHeight
      );

      if (width < metadata.width || height < metadata.height) {
        image = image.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
    }

    // Convert to JPEG
    const jpegBuffer = await image
      .jpeg({ quality: opts.quality })
      .toBuffer();

    // Convert back to base64 data URI
    const base64 = jpegBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Data URI conversion error:', error);
    throw new Error(`Failed to convert data URI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Check if width exceeds max
  if (width > maxWidth) {
    width = maxWidth;
    height = Math.round(width / aspectRatio);
  }

  // Check if height exceeds max
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }

  return { width, height };
}

/**
 * Rotate an image by specified degrees
 *
 * @param dataUri - Base64 data URI
 * @param degrees - Rotation angle (90, 180, 270)
 * @returns Rotated base64 data URI
 */
export async function rotateImage(
  dataUri: string,
  degrees: 90 | 180 | 270
): Promise<string> {
  try {
    const base64Data = dataUri.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid data URI');
    }

    const buffer = Buffer.from(base64Data, 'base64');

    const rotatedBuffer = await sharp(buffer)
      .rotate(degrees)
      .toBuffer();

    const base64 = rotatedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Image rotation error:', error);
    throw new Error(`Failed to rotate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(dataUri: string) {
  try {
    const base64Data = dataUri.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid data URI');
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
    };
  } catch (error) {
    console.error('Get metadata error:', error);
    throw new Error(`Failed to get image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
