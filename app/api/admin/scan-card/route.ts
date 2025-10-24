import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scanCardImage, type ScanContext } from '@/lib/ai/scan-card';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for AI processing

interface ScanCardRequest {
  frontImage: string;
  backImage?: string;
  context: ScanContext;
}

/**
 * POST /api/admin/scan-card
 *
 * Scan a trading card image using Claude AI to extract card information.
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
    const body: ScanCardRequest = await request.json();
    const { frontImage, backImage, context } = body;

    // Validate required fields
    if (!frontImage) {
      return NextResponse.json(
        { error: 'Front image is required' },
        { status: 400 }
      );
    }

    if (!context || !context.release || !context.set) {
      return NextResponse.json(
        { error: 'Context (release and set information) is required' },
        { status: 400 }
      );
    }

    // Validate image format
    if (!frontImage.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Front image must be a valid data URI' },
        { status: 400 }
      );
    }

    if (backImage && !backImage.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Back image must be a valid data URI' },
        { status: 400 }
      );
    }

    console.log('Scanning card...', {
      release: context.release.name,
      set: context.set.name,
      parallel: context.parallel?.name,
      hasBackImage: !!backImage,
    });

    // Scan the card using AI
    const result = await scanCardImage(frontImage, backImage, context);

    console.log('Scan complete:', {
      playerName: result.playerName,
      cardNumber: result.cardNumber,
      confidence: result.confidence,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Scan card API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to scan card',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
