/**
 * Tests for Image Compression utility
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks
const { mockSharp, mockMetadata, mockResize, mockJpeg, mockToBuffer } = vi.hoisted(() => ({
  mockToBuffer: vi.fn(),
  mockJpeg: vi.fn(),
  mockResize: vi.fn(),
  mockMetadata: vi.fn(),
  mockSharp: vi.fn(),
}));

// Chain setup - each method returns an object with the next methods
const createSharpChain = () => {
  const chain = {
    metadata: mockMetadata,
    resize: mockResize,
    jpeg: mockJpeg,
    toBuffer: mockToBuffer,
  };

  mockResize.mockReturnValue(chain);
  mockJpeg.mockReturnValue(chain);

  return chain;
};

vi.mock('sharp', () => ({
  default: (buffer: Buffer) => {
    mockSharp(buffer);
    return createSharpChain();
  },
}));

// Import after mocking
import {
  compressImage,
  compressImages,
  compressCardImages,
  getImageSize,
  estimateCompressionSavings,
} from '../image-compression';

describe('image-compression', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    mockMetadata.mockResolvedValue({
      width: 1000,
      height: 1500,
      format: 'jpeg',
    });

    mockToBuffer.mockResolvedValue(Buffer.from('compressed-image-data'));
  });

  // Create a valid test data URI
  const createTestDataUri = (content = 'test-image-content') => {
    const base64 = Buffer.from(content).toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  };

  describe('compressImage', () => {
    it('compresses image with default settings', async () => {
      const dataUri = createTestDataUri();

      const result = await compressImage(dataUri);

      expect(result).toContain('data:image/jpeg;base64,');
      expect(mockSharp).toHaveBeenCalled();
      expect(mockJpeg).toHaveBeenCalledWith(expect.objectContaining({
        quality: 70, // Default standard quality
        mozjpeg: true,
      }));
    });

    it('uses standard mode by default', async () => {
      const dataUri = createTestDataUri();

      await compressImage(dataUri);

      expect(mockResize).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({
          fit: 'inside',
          withoutEnlargement: true,
        })
      );
    });

    it('uses bulk mode when specified', async () => {
      const dataUri = createTestDataUri();

      await compressImage(dataUri, { mode: 'bulk' });

      expect(mockJpeg).toHaveBeenCalledWith(expect.objectContaining({
        quality: 50, // Bulk quality
      }));
    });

    it('respects custom quality setting', async () => {
      const dataUri = createTestDataUri();

      await compressImage(dataUri, { quality: 90 });

      expect(mockJpeg).toHaveBeenCalledWith(expect.objectContaining({
        quality: 90,
      }));
    });

    it('resizes image when larger than max dimensions', async () => {
      mockMetadata.mockResolvedValue({
        width: 2000,
        height: 3000,
        format: 'jpeg',
      });

      const dataUri = createTestDataUri();

      await compressImage(dataUri);

      expect(mockResize).toHaveBeenCalled();
    });

    it('does not resize when image is smaller than max dimensions', async () => {
      mockMetadata.mockResolvedValue({
        width: 400,
        height: 600,
        format: 'jpeg',
      });

      const dataUri = createTestDataUri();

      await compressImage(dataUri);

      // Resize should not be called when image is already smaller
      expect(mockResize).not.toHaveBeenCalled();
    });

    it('throws error for invalid data URI format', async () => {
      const invalidUri = 'not-a-data-uri';

      // Should return original on error (fallback behavior)
      const result = await compressImage(invalidUri);
      expect(result).toBe(invalidUri);
    });

    it('throws error when no base64 data in URI', async () => {
      const emptyUri = 'data:image/jpeg;base64,';

      // Should return original on error (fallback behavior)
      const result = await compressImage(emptyUri);
      expect(result).toBe(emptyUri);
    });

    it('returns original image on compression error', async () => {
      mockToBuffer.mockRejectedValue(new Error('Compression failed'));

      const dataUri = createTestDataUri();
      const result = await compressImage(dataUri);

      // Should fall back to original
      expect(result).toBe(dataUri);
    });

    it('respects custom maxWidth setting', async () => {
      mockMetadata.mockResolvedValue({
        width: 2000,
        height: 1000,
        format: 'jpeg',
      });

      const dataUri = createTestDataUri();

      await compressImage(dataUri, { maxWidth: 500 });

      expect(mockResize).toHaveBeenCalledWith(
        500,
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('respects custom maxHeight setting', async () => {
      mockMetadata.mockResolvedValue({
        width: 1000,
        height: 2000,
        format: 'jpeg',
      });

      const dataUri = createTestDataUri();

      await compressImage(dataUri, { maxHeight: 500 });

      expect(mockResize).toHaveBeenCalledWith(
        expect.any(Number),
        500,
        expect.any(Object)
      );
    });
  });

  describe('compressImages', () => {
    it('compresses multiple images in parallel', async () => {
      const dataUris = [
        createTestDataUri('image1'),
        createTestDataUri('image2'),
        createTestDataUri('image3'),
      ];

      const results = await compressImages(dataUris);

      expect(results).toHaveLength(3);
      // Sharp is called twice per image (metadata + processing)
      expect(mockSharp).toHaveBeenCalledTimes(6);
    });

    it('returns empty array for empty input', async () => {
      const results = await compressImages([]);

      expect(results).toEqual([]);
    });

    it('applies same options to all images', async () => {
      const dataUris = [
        createTestDataUri('image1'),
        createTestDataUri('image2'),
      ];

      await compressImages(dataUris, { quality: 80 });

      // Each image should be processed with same options
      expect(mockJpeg).toHaveBeenCalledTimes(2);
      expect(mockJpeg).toHaveBeenCalledWith(expect.objectContaining({
        quality: 80,
      }));
    });
  });

  describe('compressCardImages', () => {
    it('compresses front image only when back not provided', async () => {
      const frontImage = createTestDataUri('front');

      const result = await compressCardImages(frontImage);

      expect(result.front).toBeDefined();
      expect(result.back).toBeUndefined();
      // Sharp is called twice per image (metadata + processing)
      expect(mockSharp).toHaveBeenCalledTimes(2);
    });

    it('compresses both front and back images', async () => {
      const frontImage = createTestDataUri('front');
      const backImage = createTestDataUri('back');

      const result = await compressCardImages(frontImage, backImage);

      expect(result.front).toBeDefined();
      expect(result.back).toBeDefined();
      // Sharp is called twice per image (metadata + processing) = 4 calls
      expect(mockSharp).toHaveBeenCalledTimes(4);
    });

    it('applies options to both images', async () => {
      const frontImage = createTestDataUri('front');
      const backImage = createTestDataUri('back');

      await compressCardImages(frontImage, backImage, { mode: 'bulk' });

      expect(mockJpeg).toHaveBeenCalledTimes(2);
      expect(mockJpeg).toHaveBeenCalledWith(expect.objectContaining({
        quality: 50,
      }));
    });
  });

  describe('getImageSize', () => {
    it('calculates size from base64 data', () => {
      // Create a data URI with known content
      const content = 'test-content-for-size';
      const base64 = Buffer.from(content).toString('base64');
      const dataUri = `data:image/jpeg;base64,${base64}`;

      const size = getImageSize(dataUri);

      // Base64 inflates size by ~4/3, so getImageSize reverses this
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(content.length * 2); // Rough approximation
    });

    it('returns 0 for invalid data URI', () => {
      const size = getImageSize('invalid-data-uri');
      expect(size).toBe(0);
    });

    it('returns 0 for empty base64 data', () => {
      const size = getImageSize('data:image/jpeg;base64,');
      expect(size).toBe(0);
    });
  });

  describe('estimateCompressionSavings', () => {
    it('calculates compression savings', async () => {
      // Mock different sizes for original vs compressed
      const originalContent = 'original-large-image-content-that-is-bigger';
      const compressedContent = 'compressed';

      mockToBuffer.mockResolvedValue(Buffer.from(compressedContent));

      const dataUri = createTestDataUri(originalContent);
      const result = await estimateCompressionSavings(dataUri);

      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
      expect(result.savings).toBeDefined();
      expect(result.savingsPercent).toBeDefined();
    });

    it('returns positive savings when compression is effective', async () => {
      mockToBuffer.mockResolvedValue(Buffer.from('small'));

      const largeContent = 'a'.repeat(1000);
      const dataUri = createTestDataUri(largeContent);

      const result = await estimateCompressionSavings(dataUri);

      expect(result.savings).toBeGreaterThan(0);
      expect(result.savingsPercent).toBeGreaterThan(0);
    });
  });

  describe('dimension calculations', () => {
    it('maintains aspect ratio when resizing', async () => {
      // 2:3 aspect ratio image
      mockMetadata.mockResolvedValue({
        width: 2000,
        height: 3000,
        format: 'jpeg',
      });

      const dataUri = createTestDataUri();
      await compressImage(dataUri, { maxWidth: 800, maxHeight: 1200 });

      // Should resize to max dimensions while maintaining ratio
      expect(mockResize).toHaveBeenCalled();
      const [width, height] = mockResize.mock.calls[0];

      // Aspect ratio should be preserved (width/height should equal original ratio)
      const originalRatio = 2000 / 3000;
      const newRatio = width / height;
      expect(Math.abs(originalRatio - newRatio)).toBeLessThan(0.01);
    });

    it('constrains by width when width is limiting factor', async () => {
      // Wide image
      mockMetadata.mockResolvedValue({
        width: 2000,
        height: 500,
        format: 'jpeg',
      });

      const dataUri = createTestDataUri();
      await compressImage(dataUri, { maxWidth: 800, maxHeight: 1200 });

      expect(mockResize).toHaveBeenCalled();
      const [width] = mockResize.mock.calls[0];
      expect(width).toBe(800);
    });

    it('constrains by height when height is limiting factor', async () => {
      // Tall image that exceeds height limit
      mockMetadata.mockResolvedValue({
        width: 500,
        height: 2000,
        format: 'jpeg',
      });

      const dataUri = createTestDataUri();
      await compressImage(dataUri, { maxWidth: 800, maxHeight: 1200 });

      expect(mockResize).toHaveBeenCalled();
      const [, height] = mockResize.mock.calls[0];
      expect(height).toBe(1200);
    });
  });
});
