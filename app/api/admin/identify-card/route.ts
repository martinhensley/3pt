import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface IdentifyRequest {
  frontImage: string; // Base64 data URI
  backImage?: string; // Base64 data URI
  releaseId: string; // Known release context
}

interface IdentificationResult {
  setName: string;
  parallelName: string | null;
  confidence: number;
  matchedSetId?: string;
  matchedParallelId?: string;
  suggestedSetNames?: string[];
}

/**
 * POST /api/admin/identify-card
 *
 * Use AI to identify which set and parallel a card belongs to based on images.
 * This helps automate the card creation process.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: IdentifyRequest = await request.json();
    const { frontImage, backImage, releaseId } = body;

    // Validate required fields
    if (!frontImage || !releaseId) {
      return NextResponse.json(
        { error: 'Front image and release ID are required' },
        { status: 400 }
      );
    }

    // Get release and its sets from database
    const release = await prisma.release.findUnique({
      where: { id: releaseId },
      include: {
        manufacturer: true,
        sets: true,
      },
    });

    if (!release) {
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      );
    }

    console.log(`Identifying card for release: ${release.name}`);

    // Call AI to identify set and parallel
    const result = await identifyCardSet(
      frontImage,
      backImage,
      release
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Identify card API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to identify card',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Use Claude AI to identify which set and parallel the card belongs to
 */
async function identifyCardSet(
  frontImage: string,
  backImage: string | undefined,
  release: {
    id: string;
    name: string;
    year: string | null;
    manufacturer: { name: string };
    sets: Array<{ id: string; name: string; parallels: unknown }>;
  }
): Promise<IdentificationResult> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Extract base64 data from data URIs
  const frontBase64 = extractBase64(frontImage);
  const backBase64 = backImage ? extractBase64(backImage) : null;

  // Build list of sets and parallels for context
  const setList = release.sets
    .map((set) => {
      const parallels = set.parallels as Array<{ name: string }> | null;
      const parallelNames = parallels && Array.isArray(parallels)
        ? parallels.map((p) => p.name).join(', ')
        : '';
      return `- ${set.name}${parallelNames ? ` (Parallels: ${parallelNames})` : ''}`;
    })
    .join('\n');

  // Build the prompt
  const prompt = `You are analyzing a soccer trading card to identify which set and parallel/variation it belongs to.

RELEASE CONTEXT:
- Release: ${release.year || ''} ${release.manufacturer.name} ${release.name}

AVAILABLE SETS IN THIS RELEASE:
${setList}

TASK:
Analyze the card images to determine:
1. Which SET does this card belong to? (e.g., "Base Set", "Autographs", "Kaboom!", "Road to World Cup")
2. Which PARALLEL/VARIATION is this? (e.g., "Base", "Gold", "Diamond", "Cubic", "Black", "Red", "1/1")

IDENTIFICATION CLUES:
- Set name may appear on card or be inferred from design/type
- Parallel/variation often indicated by:
  - Foil patterns, colors, textures
  - Border colors
  - Background patterns
  - Specific design elements
  - Serial numbering
- Common parallels: Base, Gold, Silver, Bronze, Red, Blue, Green, Black, Diamond, Cubic, Prizm, Rated Rookie
- Special sets: Autographs, Memorabilia, Kaboom!, Rated Rookie, Inserts

IMPORTANT:
- If this is a BASE card with no special parallel, return "Base" for parallel
- If this is an AUTOGRAPH, the set might be "Autographs" or similar
- If this is MEMORABILIA (jersey/patch), the set might be "Memorabilia" or similar
- Look for visual cues that distinguish different parallels (foil, color, pattern)

Return ONLY valid JSON with no additional text:
{
  "setName": "string (the set name from the list above, or your best guess)",
  "parallelName": "string or null (the parallel/variation name, or null if base)",
  "confidence": number (0-100, your confidence in this identification)
}`;

  try {
    // Build message content using proper Anthropic types
    const messageContent: Array<
      | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }
      | { type: 'text'; text: string }
    > = [
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
    const parsed = parseAIResponse(responseText);

    // Try to match against existing sets and parallels
    const matchedSet = release.sets.find(
      (set) =>
        set.name.toLowerCase() === parsed.setName.toLowerCase() ||
        set.name.toLowerCase().includes(parsed.setName.toLowerCase()) ||
        parsed.setName.toLowerCase().includes(set.name.toLowerCase())
    );

    let matchedParallelType = null;
    if (matchedSet && parsed.parallelName) {
      const parallels = matchedSet.parallels as Array<{ name: string }> | null;
      if (parallels && Array.isArray(parallels)) {
        const foundParallel = parallels.find(
          (parallel) =>
            parallel.name.toLowerCase() === parsed.parallelName?.toLowerCase() ||
            parallel.name.toLowerCase().includes(parsed.parallelName?.toLowerCase() || '') ||
            parsed.parallelName?.toLowerCase().includes(parallel.name.toLowerCase())
        );
        matchedParallelType = foundParallel?.name || null;
      }
    }

    const result: IdentificationResult = {
      setName: parsed.setName,
      parallelName: matchedParallelType || parsed.parallelName,
      confidence: parsed.confidence,
      matchedSetId: matchedSet?.id,
      matchedParallelId: undefined, // No longer used - we use parallelType string instead
      suggestedSetNames: release.sets.map((s) => s.name),
    };

    console.log('AI Identification Result:', result);

    return result;
  } catch (error) {
    console.error('AI identification error:', error);
    throw new Error(`Failed to identify card: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * Parse the AI response
 */
function parseAIResponse(responseText: string): {
  setName: string;
  parallelName: string | null;
  confidence: number;
} {
  try {
    // Try to find JSON in the response
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    return {
      setName: parsed.setName || '',
      parallelName: parsed.parallelName || null,
      confidence: parsed.confidence || 0,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
