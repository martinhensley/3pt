/**
 * Tests for AI Card Scanning module
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks
const { mockAnthropicCreate } = vi.hoisted(() => ({
  mockAnthropicCreate: vi.fn(),
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

// Import after mocking
import {
  scanCardImage,
  isHighConfidence,
  getConfidenceLevel,
  type ScanContext,
  type ScanResult,
} from '../scan-card';

describe('scan-card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isHighConfidence', () => {
    it('returns true for confidence >= 70', () => {
      expect(isHighConfidence({ confidence: 70 } as ScanResult)).toBe(true);
      expect(isHighConfidence({ confidence: 85 } as ScanResult)).toBe(true);
      expect(isHighConfidence({ confidence: 100 } as ScanResult)).toBe(true);
    });

    it('returns false for confidence < 70', () => {
      expect(isHighConfidence({ confidence: 69 } as ScanResult)).toBe(false);
      expect(isHighConfidence({ confidence: 50 } as ScanResult)).toBe(false);
      expect(isHighConfidence({ confidence: 0 } as ScanResult)).toBe(false);
    });
  });

  describe('getConfidenceLevel', () => {
    it('returns "Very High" for confidence >= 90', () => {
      expect(getConfidenceLevel(90)).toBe('Very High');
      expect(getConfidenceLevel(95)).toBe('Very High');
      expect(getConfidenceLevel(100)).toBe('Very High');
    });

    it('returns "High" for confidence >= 70 and < 90', () => {
      expect(getConfidenceLevel(70)).toBe('High');
      expect(getConfidenceLevel(80)).toBe('High');
      expect(getConfidenceLevel(89)).toBe('High');
    });

    it('returns "Medium" for confidence >= 50 and < 70', () => {
      expect(getConfidenceLevel(50)).toBe('Medium');
      expect(getConfidenceLevel(60)).toBe('Medium');
      expect(getConfidenceLevel(69)).toBe('Medium');
    });

    it('returns "Low" for confidence < 50', () => {
      expect(getConfidenceLevel(49)).toBe('Low');
      expect(getConfidenceLevel(25)).toBe('Low');
      expect(getConfidenceLevel(0)).toBe('Low');
    });
  });

  describe('scanCardImage', () => {
    const mockContext: ScanContext = {
      release: {
        name: 'Donruss Soccer',
        year: '2024-25',
        manufacturer: 'Panini',
      },
      set: {
        name: 'Base',
        expectedCardCount: 200,
      },
    };

    const validBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

    it('successfully scans a card with front image only', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              playerName: 'Jude Bellingham',
              cardNumber: '15',
              team: 'Real Madrid',
              hasAutograph: false,
              hasMemorabilia: false,
              isNumbered: false,
              serialNumber: null,
              confidence: 95,
            }),
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await scanCardImage(validBase64Image, undefined, mockContext);

      expect(result.playerName).toBe('Jude Bellingham');
      expect(result.cardNumber).toBe('15');
      expect(result.team).toBe('Real Madrid');
      expect(result.hasAutograph).toBe(false);
      expect(result.hasMemorabilia).toBe(false);
      expect(result.isNumbered).toBe(false);
      expect(result.confidence).toBe(95);
      expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
    });

    it('successfully scans a card with front and back images', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              playerName: 'Erling Haaland',
              cardNumber: '1',
              team: 'Manchester City',
              hasAutograph: true,
              hasMemorabilia: false,
              isNumbered: true,
              serialNumber: '25/99',
              confidence: 90,
            }),
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await scanCardImage(
        validBase64Image,
        validBase64Image,
        mockContext
      );

      expect(result.playerName).toBe('Erling Haaland');
      expect(result.cardNumber).toBe('1');
      expect(result.hasAutograph).toBe(true);
      expect(result.isNumbered).toBe(true);
      expect(result.serialNumber).toBe('25/99');
      expect(result.printRun).toBe(99);
      expect(result.confidence).toBe(90);
    });

    it('extracts print run from serial number', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              playerName: 'Test Player',
              cardNumber: '10',
              hasAutograph: false,
              hasMemorabilia: false,
              isNumbered: true,
              serialNumber: '1/1',
              confidence: 85,
            }),
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await scanCardImage(validBase64Image, undefined, mockContext);

      expect(result.serialNumber).toBe('1/1');
      expect(result.printRun).toBe(1);
    });

    it('handles response with markdown code blocks', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: '```json\n{"playerName": "Test Player", "cardNumber": "5", "hasAutograph": false, "hasMemorabilia": false, "isNumbered": false, "confidence": 80}\n```',
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await scanCardImage(validBase64Image, undefined, mockContext);

      expect(result.playerName).toBe('Test Player');
      expect(result.cardNumber).toBe('5');
    });

    it('handles parallel context in the prompt', async () => {
      const contextWithParallel: ScanContext = {
        ...mockContext,
        parallel: {
          name: 'Gold Vinyl',
          characteristics: 'Gold foil pattern',
        },
      };

      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              playerName: 'Test Player',
              cardNumber: '10',
              hasAutograph: false,
              hasMemorabilia: false,
              isNumbered: true,
              serialNumber: '5/10',
              confidence: 88,
            }),
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await scanCardImage(
        validBase64Image,
        undefined,
        contextWithParallel
      );

      expect(result.printRun).toBe(10);
      expect(mockAnthropicCreate).toHaveBeenCalled();
    });

    it('throws error for invalid data URI format', async () => {
      await expect(
        scanCardImage('invalid-image', undefined, mockContext)
      ).rejects.toThrow('Invalid data URI format');
    });

    it('throws error for invalid data URI structure', async () => {
      await expect(
        scanCardImage('data:image/jpeg', undefined, mockContext)
      ).rejects.toThrow('Invalid data URI structure');
    });

    it('throws error when no text response from Claude', async () => {
      const mockResponse = {
        content: [
          {
            type: 'image',
            source: {},
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      await expect(
        scanCardImage(validBase64Image, undefined, mockContext)
      ).rejects.toThrow('No text response from Claude');
    });

    it('throws error when response is not valid JSON', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'This is not JSON',
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      await expect(
        scanCardImage(validBase64Image, undefined, mockContext)
      ).rejects.toThrow('Failed to parse AI response');
    });

    it('throws error when API call fails', async () => {
      mockAnthropicCreate.mockRejectedValue(new Error('API error'));

      await expect(
        scanCardImage(validBase64Image, undefined, mockContext)
      ).rejects.toThrow('Failed to scan card: API error');
    });

    it('handles missing optional fields in response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              playerName: 'Test Player',
              cardNumber: '1',
              // All other fields missing
            }),
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await scanCardImage(validBase64Image, undefined, mockContext);

      expect(result.playerName).toBe('Test Player');
      expect(result.cardNumber).toBe('1');
      expect(result.team).toBeUndefined();
      expect(result.hasAutograph).toBe(false);
      expect(result.hasMemorabilia).toBe(false);
      expect(result.isNumbered).toBe(false);
      expect(result.serialNumber).toBeUndefined();
      expect(result.printRun).toBeUndefined();
      expect(result.confidence).toBe(0);
    });

    it('handles various serial number formats for print run extraction', async () => {
      // Test format: 25/299
      const mockResponse1 = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              playerName: 'Player 1',
              cardNumber: '1',
              isNumbered: true,
              serialNumber: '25/299',
              confidence: 90,
            }),
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse1);
      let result = await scanCardImage(validBase64Image, undefined, mockContext);
      expect(result.printRun).toBe(299);

      // Test format: 1/1
      const mockResponse2 = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              playerName: 'Player 2',
              cardNumber: '2',
              isNumbered: true,
              serialNumber: '1/1',
              confidence: 90,
            }),
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse2);
      result = await scanCardImage(validBase64Image, undefined, mockContext);
      expect(result.printRun).toBe(1);

      // Test format: 100/100
      const mockResponse3 = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              playerName: 'Player 3',
              cardNumber: '3',
              isNumbered: true,
              serialNumber: '100/100',
              confidence: 90,
            }),
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse3);
      result = await scanCardImage(validBase64Image, undefined, mockContext);
      expect(result.printRun).toBe(100);
    });
  });
});
