import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadCardFrontBack } from '@/lib/utils/blob-upload';
import { compressCardImages } from '@/lib/utils/image-compression';

export const runtime = 'nodejs';
export const maxDuration = 300; // Allow up to 5 minutes for bulk operations

interface CardData {
  setId: string;
  cardId?: string; // Optional: ID of existing card to update
  parallelType?: string; // Parallel type name (e.g., "Gold", "Diamond")
  playerName: string;
  cardNumber: string;
  team?: string;
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  isNumbered: boolean;
  serialNumber?: string;
  printRun?: number;
  frontImage: string; // Base64 data URI
  backImage?: string; // Base64 data URI (optional)
}

interface BulkSaveRequest {
  cards: CardData[];
}

interface SaveResult {
  success: boolean;
  cardNumber: string;
  playerName: string;
  cardId?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  error?: string;
}

/**
 * POST /api/admin/bulk-save-cards
 *
 * Save multiple cards in bulk with their images.
 * This endpoint:
 * 1. Compresses images for storage
 * 2. Uploads images to Vercel Blob
 * 3. Updates existing cards with images OR creates new cards if they don't exist
 * 4. Returns success/failure for each card
 *
 * Mode:
 * - If cardId is provided: UPDATE existing card with images
 * - If cardId is not provided: CREATE new card (legacy behavior)
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
    const body: BulkSaveRequest = await request.json();
    const { cards } = body;

    // Validate request
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: 'Cards array is required' },
        { status: 400 }
      );
    }

    console.log(`Processing bulk save for ${cards.length} cards...`);

    const results: SaveResult[] = [];

    // Process each card
    for (const cardData of cards) {
      try {
        // Validate required fields
        if (!cardData.setId || !cardData.playerName || !cardData.cardNumber || !cardData.frontImage) {
          results.push({
            success: false,
            cardNumber: cardData.cardNumber || 'unknown',
            playerName: cardData.playerName || 'unknown',
            error: 'Missing required fields (setId, playerName, cardNumber, frontImage)',
          });
          continue;
        }

        // Determine if this is an UPDATE or CREATE operation
        let existingCard = null;

        if (cardData.cardId) {
          // UPDATE mode: Find card by ID
          existingCard = await prisma.card.findUnique({
            where: { id: cardData.cardId },
          });

          if (!existingCard) {
            results.push({
              success: false,
              cardNumber: cardData.cardNumber,
              playerName: cardData.playerName,
              error: `Card with ID ${cardData.cardId} not found`,
            });
            continue;
          }
        } else {
          // CREATE mode: Check if card already exists to prevent duplicates
          existingCard = await prisma.card.findFirst({
            where: {
              setId: cardData.setId,
              cardNumber: cardData.cardNumber,
              parallelType: cardData.parallelType || null,
            },
          });

          if (existingCard) {
            results.push({
              success: false,
              cardNumber: cardData.cardNumber,
              playerName: cardData.playerName,
              error: 'Card already exists in database (use cardId to update existing card)',
            });
            continue;
          }
        }

        // Compress images
        console.log(`Compressing images for card ${cardData.cardNumber}...`);
        const compressed = await compressCardImages(
          cardData.frontImage,
          cardData.backImage,
          { mode: 'bulk' } // Use bulk compression preset
        );

        // Upload images to Vercel Blob
        console.log(`Uploading images for card ${cardData.cardNumber}...`);
        const cardId = `${cardData.setId}-${cardData.cardNumber}-${cardData.parallelType || 'base'}`.toLowerCase();
        const imageUrls = await uploadCardFrontBack(
          cardId,
          compressed.front,
          compressed.back
        );

        // Save or update card in database
        let savedCard;

        if (cardData.cardId && existingCard) {
          // UPDATE mode: Update existing card with images
          console.log(`Updating existing card ${cardData.cardNumber} with images...`);
          savedCard = await prisma.card.update({
            where: { id: cardData.cardId },
            data: {
              imageFront: imageUrls.front,
              imageBack: imageUrls.back || null,
              // Optionally update other fields if they've changed
              ...(cardData.team && { team: cardData.team }),
              ...(cardData.hasAutograph && { hasAutograph: cardData.hasAutograph }),
              ...(cardData.hasMemorabilia && { hasMemorabilia: cardData.hasMemorabilia }),
              ...(cardData.isNumbered && { isNumbered: cardData.isNumbered }),
              ...(cardData.serialNumber && { serialNumber: cardData.serialNumber }),
              ...(cardData.printRun && { printRun: cardData.printRun }),
            },
          });
        } else {
          // CREATE mode: Create new card
          console.log(`Creating new card ${cardData.cardNumber}...`);
          savedCard = await prisma.card.create({
            data: {
              setId: cardData.setId,
              playerName: cardData.playerName,
              cardNumber: cardData.cardNumber,
              team: cardData.team || null,
              hasAutograph: cardData.hasAutograph,
              hasMemorabilia: cardData.hasMemorabilia,
              isNumbered: cardData.isNumbered,
              serialNumber: cardData.serialNumber || null,
              printRun: cardData.printRun || null,
              imageFront: imageUrls.front,
              imageBack: imageUrls.back || null,
              parallelType: cardData.parallelType || null,
            },
          });
        }

        results.push({
          success: true,
          cardNumber: cardData.cardNumber,
          playerName: cardData.playerName,
          cardId: savedCard.id,
          frontImageUrl: imageUrls.front,
          backImageUrl: imageUrls.back,
        });

        console.log(`✓ Card ${cardData.cardNumber} saved successfully`);
      } catch (error) {
        console.error(`Error saving card ${cardData.cardNumber}:`, error);
        results.push({
          success: false,
          cardNumber: cardData.cardNumber,
          playerName: cardData.playerName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Calculate statistics
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(`Bulk save complete: ${successCount} succeeded, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      total: cards.length,
      succeeded: successCount,
      failed: failureCount,
      results,
    });
  } catch (error) {
    console.error('Bulk save API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to save cards',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
