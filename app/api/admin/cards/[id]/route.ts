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
  { params }: { params: { id: string } }
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
    const cardId = params.id;

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
    const updateData: any = {
      playerName: body.playerName || null,
      cardNumber: body.cardNumber || null,
      team: body.team || null,
      parallelType: body.parallelType || null,
      variant: body.variant || null,
      serialNumber: body.serialNumber || null,
      isNumbered: body.isNumbered || false,
      printRun: body.printRun || null,
      hasAutograph: body.hasAutograph || false,
      hasMemorabilia: body.hasMemorabilia || false,
      footyNotes: body.footyNotes || null,
    };

    // Handle image uploads if provided
    if (body.imageFront || body.imageBack) {
      console.log('Processing new images for card:', cardId);

      // Compress images
      const compressed = await compressCardImages(
        body.imageFront || existingCard.imageFront,
        body.imageBack || existingCard.imageBack,
        { mode: 'single' }
      );

      // Upload to blob storage
      const imageUrls = await uploadCardFrontBack(
        cardId,
        body.imageFront ? compressed.front : null,
        body.imageBack ? compressed.back : null
      );

      // Update image URLs
      if (body.imageFront) {
        updateData.imageFront = imageUrls.front;
      }
      if (body.imageBack) {
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
  { params }: { params: { id: string } }
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

    const cardId = params.id;

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
