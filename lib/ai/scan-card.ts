/**
 * AI Card Scanning Library
 *
 * Uses Claude Sonnet 4 to extract card information from images.
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ScanContext {
  release: {
    name: string;
    year: string;
    manufacturer: string;
  };
  set: {
    name: string;
    totalCards?: string;
  };
  parallel?: {
    name: string;
    characteristics?: string;
  };
}

export interface ScanResult {
  playerName: string;
  cardNumber: string;
  team?: string;
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  isNumbered: boolean;
  serialNumber?: string;
  printRun?: number;
  confidence: number;
}

/**
 * Scan a trading card image using Claude AI
 *
 * @param frontImage - Base64 data URI of the front image
 * @param backImage - Base64 data URI of the back image (optional)
 * @param context - Context about the release, set, and parallel
 * @returns Extracted card information
 */
export async function scanCardImage(
  frontImage: string,
  backImage: string | undefined,
  context: ScanContext
): Promise<ScanResult> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Extract base64 data from data URIs
  const frontBase64 = extractBase64(frontImage);
  const backBase64 = backImage ? extractBase64(backImage) : null;

  // Build the prompt
  const prompt = buildScanPrompt(context);

  try {
    // Build message content
    const messageContent: any[] = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: frontBase64,
        },
      },
    ];

    if (backBase64) {
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: backBase64,
        },
      });
    }

    messageContent.push({
      type: 'text',
      text: prompt,
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const responseText = textBlock.text;

    // Parse JSON response
    const result = parseAIResponse(responseText);

    console.log('AI Scan Result:', result);

    return result;
  } catch (error) {
    console.error('AI scan error:', error);
    throw new Error(`Failed to scan card: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract base64 data from a data URI
 */
function extractBase64(dataUri: string): string {
  if (!dataUri.startsWith('data:')) {
    throw new Error('Invalid data URI format');
  }

  const parts = dataUri.split(',');
  if (parts.length !== 2) {
    throw new Error('Invalid data URI structure');
  }

  return parts[1];
}

/**
 * Build the AI prompt for card scanning
 */
function buildScanPrompt(context: ScanContext): string {
  const { release, set, parallel } = context;

  let prompt = `You are analyzing a soccer trading card image.

CONTEXT:
- Release: ${release.year} ${release.manufacturer} ${release.name}
- Set: ${set.name}`;

  if (set.totalCards) {
    prompt += `\n- Total Cards in Set: ${set.totalCards}`;
  }

  if (parallel) {
    prompt += `\n- Parallel/Variation: ${parallel.name}`;
    if (parallel.characteristics) {
      prompt += `\n- Characteristics: ${parallel.characteristics}`;
    }
  }

  prompt += `

IMAGES PROVIDED:
- Front image: [attached]`;

  if (context) {
    prompt += `\n- Back image: [attached]`;
  }

  prompt += `

Extract the following information:

1. PLAYER NAME: The player's full name as shown on the card
2. CARD NUMBER: Just the number (e.g., "15" not "#15")
3. TEAM/CLUB: The team/club name if visible
4. AUTOGRAPH: true/false - Does the card have an autograph signature?
5. MEMORABILIA: true/false - Does the card have a memorabilia piece (jersey swatch, patch)?
6. NUMBERED: true/false - Is the card serially numbered?
7. SERIAL NUMBER: If numbered, the serial (e.g., "15/99", "1/1")

IMPORTANT NOTES:`;

  if (parallel) {
    prompt += `\n- This is a ${parallel.name} parallel/variation`;
  }

  prompt += `
- Look for visual characteristics: foil patterns, colors, textures
- Serial numbers often appear in corners or on the back
- Autographs are typically signed on the card surface
- Memorabilia is usually a piece of fabric embedded in the card
- Be very careful to extract the correct card number (not jersey number or other numbers)

Return ONLY valid JSON with no additional text:
{
  "playerName": "string",
  "cardNumber": "string",
  "team": "string or null",
  "hasAutograph": boolean,
  "hasMemorabilia": boolean,
  "isNumbered": boolean,
  "serialNumber": "string or null",
  "confidence": number (0-100, your confidence in the accuracy of this extraction)
}`;

  return prompt;
}

/**
 * Parse the AI response and extract structured data
 */
function parseAIResponse(responseText: string): ScanResult {
  try {
    // Try to find JSON in the response
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Extract print run from serial number if present
    let printRun: number | undefined;
    if (parsed.serialNumber) {
      printRun = extractPrintRun(parsed.serialNumber);
    }

    return {
      playerName: parsed.playerName || '',
      cardNumber: parsed.cardNumber || '',
      team: parsed.team || undefined,
      hasAutograph: parsed.hasAutograph || false,
      hasMemorabilia: parsed.hasMemorabilia || false,
      isNumbered: parsed.isNumbered || false,
      serialNumber: parsed.serialNumber || undefined,
      printRun,
      confidence: parsed.confidence || 0,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract print run from serial number
 * Examples: "15/99" -> 99, "1/1" -> 1, "25/299" -> 299
 */
function extractPrintRun(serialNumber: string): number | undefined {
  const match = serialNumber.match(/\d+\/(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return undefined;
}

/**
 * Validate scan result confidence
 */
export function isHighConfidence(result: ScanResult): boolean {
  return result.confidence >= 70;
}

/**
 * Get confidence level description
 */
export function getConfidenceLevel(confidence: number): string {
  if (confidence >= 90) return 'Very High';
  if (confidence >= 70) return 'High';
  if (confidence >= 50) return 'Medium';
  return 'Low';
}
