/**
 * Image Compression Utility
 *
 * Reduces image file sizes for efficient storage while maintaining acceptable quality.
 */

import sharp from 'sharp';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mode?: 'standard' | 'bulk';
}

const COMPRESSION_PRESETS = {
  standard: {
    maxWidth: 800,
    maxHeight: 1200,
    quality: 70,
  },
  bulk: {
    maxWidth: 600,
    maxHeight: 900,
    quality: 50,
  },
};

/**
 * Compress an image data URI for storage
 *
 * @param dataUri - Base64 data URI of the image
 * @param options - Compression options
 * @returns Compressed base64 data URI
 */
export async function compressImage(
  dataUri: string,
  options: CompressionOptions = {}
): Promise<string> {
  const mode = options.mode || 'standard';
  const preset = COMPRESSION_PRESETS[mode];
  const opts = {
    maxWidth: options.maxWidth || preset.maxWidth,
    maxHeight: options.maxHeight || preset.maxHeight,
    quality: options.quality || preset.quality,
  };

  try {
    // Validate data URI
    if (!dataUri.startsWith('data:image/')) {
      throw new Error('Invalid data URI format');
    }

    const base64Data = dataUri.split(',')[1];
    if (!base64Data) {
      throw new Error('No base64 data found in URI');
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Get original metadata
    const originalMetadata = await sharp(buffer).metadata();
    const originalSize = buffer.length;

    // Process with Sharp
    let image = sharp(buffer);

    // Calculate resize dimensions
    if (originalMetadata.width && originalMetadata.height) {
      const { width, height } = calculateDimensions(
        originalMetadata.width,
        originalMetadata.height,
        opts.maxWidth,
        opts.maxHeight
      );

      if (width < originalMetadata.width || height < originalMetadata.height) {
        image = image.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
    }

    // Compress to JPEG
    const compressedBuffer = await image
      .jpeg({ quality: opts.quality, mozjpeg: true })
      .toBuffer();

    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

    console.log(`Image compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${compressionRatio}% reduction)`);

    // Convert to base64 data URI
    const base64 = compressedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Image compression error:', error);
    // On error, return original image
    console.warn('Falling back to original image due to compression error');
    return dataUri;
  }
}

/**
 * Compress multiple images in parallel
 *
 * @param dataUris - Array of base64 data URIs
 * @param options - Compression options
 * @returns Array of compressed base64 data URIs
 */
export async function compressImages(
  dataUris: string[],
  options: CompressionOptions = {}
): Promise<string[]> {
  return Promise.all(
    dataUris.map((dataUri) => compressImage(dataUri, options))
  );
}

/**
 * Compress a card's front and back images
 *
 * @param frontImage - Front image data URI
 * @param backImage - Back image data URI (optional)
 * @param options - Compression options
 * @returns Object with compressed front and back images
 */
export async function compressCardImages(
  frontImage: string,
  backImage?: string,
  options: CompressionOptions = {}
): Promise<{ front: string; back?: string }> {
  const compressed: { front: string; back?: string } = {
    front: await compressImage(frontImage, options),
  };

  if (backImage) {
    compressed.back = await compressImage(backImage, options);
  }

  return compressed;
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
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Get compressed image size in bytes
 */
export function getImageSize(dataUri: string): number {
  const base64Data = dataUri.split(',')[1];
  if (!base64Data) return 0;

  // Base64 is roughly 4/3 the size of the original
  return Math.round((base64Data.length * 3) / 4);
}

/**
 * Estimate storage savings from compression
 */
export async function estimateCompressionSavings(
  dataUri: string,
  options: CompressionOptions = {}
): Promise<{
  originalSize: number;
  compressedSize: number;
  savings: number;
  savingsPercent: number;
}> {
  const originalSize = getImageSize(dataUri);
  const compressed = await compressImage(dataUri, options);
  const compressedSize = getImageSize(compressed);
  const savings = originalSize - compressedSize;
  const savingsPercent = (savings / originalSize) * 100;

  return {
    originalSize,
    compressedSize,
    savings,
    savingsPercent,
  };
}
