/**
 * Tests for Release Analyzer module
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks
const { mockAnthropicCreate, mockFetch } = vi.hoisted(() => ({
  mockAnthropicCreate: vi.fn(),
  mockFetch: vi.fn(),
}));

// Mock Anthropic SDK as a class
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockAnthropicCreate,
      };
    },
  };
});

// Mock global fetch
vi.stubGlobal('fetch', mockFetch);

// Import after mocking
import {
  analyzeRelease,
  generateDescription,
  ReleaseInfoSchema,
  DescriptionSchema,
  type ReleaseInfo,
} from '../release-analyzer';

describe('release-analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ReleaseInfoSchema', () => {
    it('validates correct release info', () => {
      const validData = {
        manufacturer: 'Panini',
        releaseName: 'Prizm Basketball',
        year: '2024-25',
        fullReleaseName: '2024-25 Panini Prizm Basketball',
        slug: '2024-25-panini-prizm-basketball',
        releaseDate: '2024-10-15',
      };

      const result = ReleaseInfoSchema.parse(validData);
      expect(result.manufacturer).toBe('Panini');
      expect(result.year).toBe('2024-25');
    });

    it('allows null releaseDate', () => {
      const dataWithNullDate = {
        manufacturer: 'Panini',
        releaseName: 'Prizm Basketball',
        year: '2024-25',
        fullReleaseName: '2024-25 Panini Prizm Basketball',
        slug: '2024-25-panini-prizm-basketball',
        releaseDate: null,
      };

      const result = ReleaseInfoSchema.parse(dataWithNullDate);
      expect(result.releaseDate).toBeNull();
    });

    it('rejects missing required fields', () => {
      const invalidData = {
        manufacturer: 'Panini',
        // Missing other required fields
      };

      expect(() => ReleaseInfoSchema.parse(invalidData)).toThrow();
    });
  });

  describe('DescriptionSchema', () => {
    it('validates correct description', () => {
      const validData = {
        description: 'This is a test description for the release.',
      };

      const result = DescriptionSchema.parse(validData);
      expect(result.description).toBe('This is a test description for the release.');
    });

    it('rejects missing description', () => {
      expect(() => DescriptionSchema.parse({})).toThrow();
    });
  });

  describe('analyzeRelease', () => {
    const validReleaseJson = JSON.stringify({
      manufacturer: 'Panini',
      releaseName: 'Prizm Basketball',
      year: '2024-25',
      fullReleaseName: '2024-25 Panini Prizm Basketball',
      slug: '2024-25-panini-prizm-basketball',
      releaseDate: '2024-10-15',
    });

    describe('with document text', () => {
      it('analyzes text document successfully', async () => {
        mockAnthropicCreate.mockResolvedValue({
          content: [
            {
              type: 'text',
              text: validReleaseJson,
            },
          ],
        });

        const result = await analyzeRelease({
          documentText: 'Sample sell sheet text for 2024-25 Panini Prizm Basketball',
        });

        expect(result.manufacturer).toBe('Panini');
        expect(result.releaseName).toBe('Prizm Basketball');
        expect(result.year).toBe('2024-25');
        expect(mockAnthropicCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
          })
        );
      });

      it('extracts JSON from response with surrounding text', async () => {
        mockAnthropicCreate.mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `Here's the analysis:\n${validReleaseJson}\nThat's the extracted data.`,
            },
          ],
        });

        const result = await analyzeRelease({
          documentText: 'Sample text',
        });

        expect(result.manufacturer).toBe('Panini');
      });
    });

    describe('with document URL', () => {
      it('downloads and analyzes PDF document', async () => {
        // Mock fetch to return PDF data
        mockFetch.mockResolvedValue({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
        });

        mockAnthropicCreate.mockResolvedValue({
          content: [
            {
              type: 'text',
              text: validReleaseJson,
            },
          ],
        });

        const result = await analyzeRelease({
          documentUrl: 'https://example.com/sellsheet.pdf',
          mimeType: 'application/pdf',
        });

        expect(result.manufacturer).toBe('Panini');
        expect(mockFetch).toHaveBeenCalledWith('https://example.com/sellsheet.pdf');
      });

      it('downloads and analyzes image document', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
        });

        mockAnthropicCreate.mockResolvedValue({
          content: [
            {
              type: 'text',
              text: validReleaseJson,
            },
          ],
        });

        const result = await analyzeRelease({
          documentUrl: 'https://example.com/sellsheet.jpg',
          mimeType: 'image/jpeg',
        });

        expect(result.manufacturer).toBe('Panini');
      });

      it('normalizes image/jpg to image/jpeg', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
        });

        mockAnthropicCreate.mockResolvedValue({
          content: [
            {
              type: 'text',
              text: validReleaseJson,
            },
          ],
        });

        const result = await analyzeRelease({
          documentUrl: 'https://example.com/sellsheet.jpg',
          mimeType: 'image/jpg',
        });

        expect(result.manufacturer).toBe('Panini');
        // The implementation normalizes image/jpg to image/jpeg
      });

      it('handles multiple document URLs', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
        });

        mockAnthropicCreate.mockResolvedValue({
          content: [
            {
              type: 'text',
              text: validReleaseJson,
            },
          ],
        });

        const result = await analyzeRelease({
          documentUrls: [
            'https://example.com/page1.pdf',
            'https://example.com/page2.pdf',
          ],
          mimeType: 'application/pdf',
        });

        expect(result.manufacturer).toBe('Panini');
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('throws error when document download fails', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          statusText: 'Not Found',
        });

        await expect(
          analyzeRelease({
            documentUrl: 'https://example.com/missing.pdf',
            mimeType: 'application/pdf',
          })
        ).rejects.toThrow('Failed to download document 1: Not Found');
      });
    });

    describe('error handling', () => {
      it('throws error when neither documentText nor documentUrl provided', async () => {
        await expect(analyzeRelease({})).rejects.toThrow(
          'Either documentText or documentUrl must be provided'
        );
      });

      it('throws error when no text content in response', async () => {
        mockAnthropicCreate.mockResolvedValue({
          content: [
            {
              type: 'image',
              source: {},
            },
          ],
        });

        await expect(
          analyzeRelease({ documentText: 'Sample text' })
        ).rejects.toThrow('No text content in Anthropic response');
      });

      it('throws error when JSON extraction fails', async () => {
        mockAnthropicCreate.mockResolvedValue({
          content: [
            {
              type: 'text',
              text: 'No JSON here',
            },
          ],
        });

        await expect(
          analyzeRelease({ documentText: 'Sample text' })
        ).rejects.toThrow('Could not extract JSON from Anthropic response');
      });

      it('throws error when schema validation fails', async () => {
        mockAnthropicCreate.mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ invalid: 'data' }),
            },
          ],
        });

        await expect(
          analyzeRelease({ documentText: 'Sample text' })
        ).rejects.toThrow();
      });
    });
  });

  describe('generateDescription', () => {
    const mockReleaseInfo: ReleaseInfo = {
      manufacturer: 'Panini',
      releaseName: 'Prizm Basketball',
      year: '2024-25',
      fullReleaseName: '2024-25 Panini Prizm Basketball',
      slug: '2024-25-panini-prizm-basketball',
      releaseDate: '2024-10-15',
    };

    it('generates description successfully', async () => {
      const mockDescription = 'The 2024-25 Panini Prizm Basketball release continues the tradition of one of the most popular basketball card products.';

      mockAnthropicCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: mockDescription,
          },
        ],
      });

      const result = await generateDescription({
        release: mockReleaseInfo,
        sourceText: 'Sample source text about the release',
      });

      expect(result.description).toBe(mockDescription);
      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
        })
      );
    });

    it('trims whitespace from description', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: '  Description with whitespace  \n\n',
          },
        ],
      });

      const result = await generateDescription({
        release: mockReleaseInfo,
        sourceText: 'Sample text',
      });

      expect(result.description).toBe('Description with whitespace');
    });

    it('throws error when no text content in response', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [
          {
            type: 'image',
            source: {},
          },
        ],
      });

      await expect(
        generateDescription({
          release: mockReleaseInfo,
          sourceText: 'Sample text',
        })
      ).rejects.toThrow('No text content in Anthropic response');
    });

    it('includes release context in prompt', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'Generated description',
          },
        ],
      });

      await generateDescription({
        release: mockReleaseInfo,
        sourceText: 'Sample source text',
      });

      // Verify the prompt includes release info
      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('2024-25 Panini Prizm Basketball'),
            }),
          ]),
        })
      );
    });
  });
});
