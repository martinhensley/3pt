/**
 * Enhanced Card Analysis with Parallel/Variation Detection
 * Inspired by QB1's enhanced-scan-card-image implementation
 * Focus: Basketball trading card parallel and variation detection
 */

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

//==============================================================================
// Type Definitions
//==============================================================================

export interface EnhancedCardAnalysisInput {
  frontImageUrl: string;
  backImageUrl?: string;
  setContext?: string;  // e.g., "Panini Prizm 2023"
  releaseContext?: string;  // e.g., "Panini FIFA World Cup 2022"
}

export interface ParallelDetection {
  parallelType: string | null;  // e.g., "Silver Prizm", "Gold Laser", "Red Wave"
  colorVariant: string | null;  // e.g., "gold", "silver", "red", "blue"
  serialNumber: string | null;  // e.g., "123/299"
  isNumbered: boolean;
  printRun: number | null;  // e.g., 299 for /299 cards
  rarity: string;  // base, rare, super_rare, ultra_rare, one_of_one
  finish: string | null;  // refractor, chrome, matte, glossy, holographic, prizm
  confidence: number;  // 0-100
  detectionMethods: string[];  // ["ocr", "visual_pattern", "ai_analysis"]
  detectedText: string[];  // Raw text found on card
}

export interface CardFeatures {
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  isRookie: boolean;
  isInsert: boolean;
  isShortPrint: boolean;
  specialFeatures: string[];
}

export interface EnhancedCardAnalysisResult {
  // Basic card info
  playerName: string | null;
  team: string | null;
  cardNumber: string | null;

  // Parallel/variation detection
  parallelDetection: ParallelDetection;

  // Special features
  features: CardFeatures;

  // Overall confidence and metadata
  overallConfidence: number;  // 0-100
  processingTime: number;  // milliseconds
}

//==============================================================================
// Zod Schemas for Structured AI Output
//==============================================================================

const parallelDetectionSchema = z.object({
  parallelType: z.string().nullable().describe('Specific parallel name (e.g., "Silver Prizm", "Gold Laser", "Mosaic", "Red Wave"). Null if base card.'),
  colorVariant: z.string().nullable().describe('Primary color of the parallel (gold, silver, red, blue, green, orange, purple, black, white, rainbow, multi). Null if not applicable.'),
  serialNumber: z.string().nullable().describe('Serial number if card is numbered (e.g., "45/99", "1/1"). Null if not numbered.'),
  isNumbered: z.boolean().describe('True if card has a serial number.'),
  printRun: z.number().nullable().describe('Total print run number (the denominator in serial numbers). E.g., 99 for /99.'),
  rarity: z.enum(['base', 'rare', 'super_rare', 'ultra_rare', 'one_of_one']).describe('Rarity classification based on print run and parallel type.'),
  finish: z.string().nullable().describe('Card finish/coating type: refractor, chrome, matte, glossy, holographic, prizm, shimmer, metallic. Null if standard.'),
  confidence: z.number().min(0).max(100).describe('Confidence score for parallel detection (0-100).'),
  detectedText: z.array(z.string()).describe('All text strings detected on the card that helped identify the parallel.')
});

const cardFeaturesSchema = z.object({
  hasAutograph: z.boolean().describe('True if card contains an autograph.'),
  hasMemorabilia: z.boolean().describe('True if card contains memorabilia/relic (jersey, patch, etc.).'),
  isRookie: z.boolean().describe('True if this is a rookie card (look for "RC", "Rookie", or rookie designation).'),
  isInsert: z.boolean().describe('True if this is a special insert card (not part of base set).'),
  isShortPrint: z.boolean().describe('True if this is a short print (SP, SSP marks).'),
  specialFeatures: z.array(z.string()).describe('List of special features: rookie, autograph, memorabilia, numbered, insert, short_print, die_cut, etc.')
});

const enhancedCardSchema = z.object({
  playerName: z.string().nullable().describe('Player full name (e.g., "LeBron James", "Stephen Curry"). Null if not identifiable.'),
  team: z.string().nullable().describe('Team name (e.g., "Los Angeles Lakers", "Golden State Warriors"). Null if not identifiable.'),
  cardNumber: z.string().nullable().describe('Card number from the set (e.g., "#23", "1"). Null if not found.'),
  parallelDetection: parallelDetectionSchema,
  features: cardFeaturesSchema,
  overallConfidence: z.number().min(0).max(100).describe('Overall confidence in the analysis (0-100).')
});

//==============================================================================
// Main Analysis Function
//==============================================================================

export async function enhancedCardAnalysis(
  input: EnhancedCardAnalysisInput
): Promise<EnhancedCardAnalysisResult> {
  const startTime = Date.now();

  try {
    const { frontImageUrl, backImageUrl, setContext, releaseContext } = input;

    // Prepare context for AI
    const contextPrompt = buildContextPrompt(setContext, releaseContext);

    // Build comprehensive prompt for parallel detection
    const systemPrompt = `You are an expert in basketball trading cards with deep knowledge of:
- Panini products (Prizm, Select, Mosaic, Donruss, Optic, Court Kings, Chronicles, Immaculate, National Treasures, etc.)
- Topps products (Chrome, Finest, Stadium Club - historical)
- Parallel variations and their identifying characteristics
- Serial numbering patterns
- Card finishes and refractor types
- Rookie cards (RC designation) and special inserts

${contextPrompt}

CRITICAL: Pay special attention to parallel/variation detection. Common basketball card parallels include:
- Prizm variations: Base, Silver, Color Prizms (Red, Blue, Gold, Green, Orange, Purple), Hyper, Fast Break, Choice, etc.
- Select variations: Silver, Tri-Color, Tie-Dye, Zebra, Courtside, Premier Level, etc.
- Mosaic variations: Base Mosaic, Silver, Color Mosaic, etc.
- Optic variations: Base, Holo, Purple, Blue, Red, etc.
- Donruss variations: Base, Rated Rookie, Holo, etc.
- Numbered parallels: /299, /199, /99, /49, /25, /10, /5, /1

Look for:
1. Specific text mentioning parallel names
2. Visual patterns (prism effects, refractor patterns, color backgrounds)
3. Serial numbers (format: "XX/YY" where XX is the card number and YY is the print run)
4. Color variations from base cards
5. Special finishes or coatings
6. RC (Rookie Card) designations`;

    // Prepare image content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageContent: any[] = [
      {
        type: 'image',
        image: frontImageUrl,
      }
    ];

    if (backImageUrl) {
      imageContent.push({
        type: 'image',
        image: backImageUrl,
      });
    }

    // Add text prompt
    imageContent.push({
      type: 'text',
      text: `Analyze these basketball trading card images and provide detailed information with SPECIAL FOCUS on parallel/variation detection.

INSTRUCTIONS:
1. Examine the card front and back carefully
2. Identify any text that indicates a parallel (e.g., "SILVER PRIZM", "RED WAVE", "/99")
3. Look for serial numbers in format "XX/YY"
4. Determine the card finish (refractor pattern, holographic effect, etc.)
5. Identify the player, team, and card number
6. Detect special features (rookie, autograph, memorabilia)

Be thorough in detecting parallels - they are CRITICALLY IMPORTANT for card identification.`
    });

    // Call AI with structured output
    const result = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: imageContent,
        },
      ],
      schema: enhancedCardSchema,
      temperature: 0.3, // Lower temperature for more consistent detection
    });

    const cardData = result.object;

    // Post-process detection methods
    const detectionMethods: string[] = ['ai_analysis'];

    // If we found serial numbers or parallel text, we likely used OCR-like detection
    if (cardData.parallelDetection.detectedText.length > 0) {
      detectionMethods.push('ocr');
    }

    // If we identified finish/color, we used visual pattern analysis
    if (cardData.parallelDetection.finish || cardData.parallelDetection.colorVariant) {
      detectionMethods.push('visual_pattern');
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Return enhanced result
    return {
      playerName: cardData.playerName,
      team: cardData.team,
      cardNumber: cardData.cardNumber,
      parallelDetection: {
        ...cardData.parallelDetection,
        detectionMethods,
      },
      features: cardData.features,
      overallConfidence: cardData.overallConfidence,
      processingTime,
    };

  } catch (error) {
    console.error('Enhanced card analysis failed:', error);

    // Return minimal result on failure
    return {
      playerName: null,
      team: null,
      cardNumber: null,
      parallelDetection: {
        parallelType: null,
        colorVariant: null,
        serialNumber: null,
        isNumbered: false,
        printRun: null,
        rarity: 'base',
        finish: null,
        confidence: 0,
        detectionMethods: [],
        detectedText: [],
      },
      features: {
        hasAutograph: false,
        hasMemorabilia: false,
        isRookie: false,
        isInsert: false,
        isShortPrint: false,
        specialFeatures: [],
      },
      overallConfidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

//==============================================================================
// Helper Functions
//==============================================================================

function buildContextPrompt(setContext?: string, releaseContext?: string): string {
  const parts: string[] = [];

  if (releaseContext) {
    parts.push(`This card is from the release: ${releaseContext}`);
  }

  if (setContext) {
    parts.push(`This card is from the set: ${setContext}`);
  }

  if (parts.length > 0) {
    return `CONTEXT:\n${parts.join('\n')}\n\nUse this context to help identify the card and its parallel variation.`;
  }

  return '';
}

/**
 * Extract rarity classification from serial number
 */
export function classifyRarityFromPrintRun(printRun: number | null): string {
  if (!printRun) return 'base';

  if (printRun === 1) return 'one_of_one';
  if (printRun <= 10) return 'ultra_rare';
  if (printRun <= 50) return 'super_rare';
  if (printRun <= 299) return 'rare';

  return 'base';
}

/**
 * Parse serial number string (e.g., "45/99") into components
 */
export function parseSerialNumber(serialNumber: string | null): { cardNum: number | null; printRun: number | null } {
  if (!serialNumber) return { cardNum: null, printRun: null };

  const match = serialNumber.match(/(\d+)\/(\d+)/);
  if (!match) return { cardNum: null, printRun: null };

  return {
    cardNum: parseInt(match[1]),
    printRun: parseInt(match[2]),
  };
}
