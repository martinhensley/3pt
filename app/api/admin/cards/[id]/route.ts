import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadCardFrontBack } from '@/lib/utils/blob-upload';
import { compressCardImages } from '@/lib/utils/image-compression';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * PUT /api/admin/cards/[id]
 * Update a card's details and optionally upload new images
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id: cardId } = await params;

    // Get existing card
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      playerName?: string | null;
      team?: string | null;
      cardNumber?: string | null;
      variant?: string | null;
      parallelType?: string | null;
      serialNumber?: string | null;
      isNumbered?: boolean;
      printRun?: number | null;
      numbered?: string | null;
      rarity?: string | null;
      finish?: string | null;
      hasAutograph?: boolean;
      hasMemorabilia?: boolean;
      colorVariant?: string | null;
      footyNotes?: string | null;
      imageFront?: string;
      imageBack?: string;
    } = {};

    // Update all editable fields if provided
    if (body.playerName !== undefined) updateData.playerName = body.playerName || null;
    if (body.team !== undefined) updateData.team = body.team || null;
    if (body.cardNumber !== undefined) updateData.cardNumber = body.cardNumber || null;
    if (body.variant !== undefined) updateData.variant = body.variant || null;
    if (body.parallelType !== undefined) updateData.parallelType = body.parallelType || null;
    if (body.serialNumber !== undefined) updateData.serialNumber = body.serialNumber || null;
    if (body.isNumbered !== undefined) updateData.isNumbered = Boolean(body.isNumbered);
    if (body.printRun !== undefined) updateData.printRun = body.printRun || null;
    if (body.numbered !== undefined) updateData.numbered = body.numbered || null;
    if (body.rarity !== undefined) updateData.rarity = body.rarity || null;
    if (body.finish !== undefined) updateData.finish = body.finish || null;
    if (body.hasAutograph !== undefined) updateData.hasAutograph = Boolean(body.hasAutograph);
    if (body.hasMemorabilia !== undefined) updateData.hasMemorabilia = Boolean(body.hasMemorabilia);
    if (body.colorVariant !== undefined) updateData.colorVariant = body.colorVariant || null;
    if (body.footyNotes !== undefined) updateData.footyNotes = body.footyNotes || null;

    // Handle image uploads if provided
    if (body.imageFront || body.imageBack) {
      console.log('Processing new images for card:', cardId);

      // Compress only the images that are being updated
      if (body.imageFront && body.imageBack) {
        const compressed = await compressCardImages(
          body.imageFront,
          body.imageBack,
          { mode: 'standard' }
        );
        const imageUrls = await uploadCardFrontBack(
          cardId,
          compressed.front,
          compressed.back
        );
        updateData.imageFront = imageUrls.front;
        updateData.imageBack = imageUrls.back;
      } else if (body.imageFront) {
        const compressed = await compressCardImages(
          body.imageFront,
          undefined,
          { mode: 'standard' }
        );
        const imageUrls = await uploadCardFrontBack(
          cardId,
          compressed.front
        );
        updateData.imageFront = imageUrls.front;
      } else if (body.imageBack) {
        const compressed = await compressCardImages(
          existingCard.imageFront || '',
          body.imageBack,
          { mode: 'standard' }
        );
        const imageUrls = await uploadCardFrontBack(
          cardId,
          existingCard.imageFront || compressed.front,
          compressed.back
        );
        updateData.imageBack = imageUrls.back;
      }
    }

    // Update card in database
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        set: {
          include: {
            release: {
              include: {
                manufacturer: true,
              },
            },
          },
        },
      },
    });

    console.log(`Card ${cardId} updated successfully`);

    return NextResponse.json({
      success: true,
      card: updatedCard,
    });
  } catch (error) {
    console.error('Update card error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update card',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cards/[id]
 * Delete a card
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: cardId } = await params;

    // Delete card
    await prisma.card.delete({
      where: { id: cardId },
    });

    console.log(`Card ${cardId} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'Card deleted successfully',
    });
  } catch (error) {
    console.error('Delete card error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete card',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
