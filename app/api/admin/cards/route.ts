import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadCardFrontBack } from '@/lib/utils/blob-upload';
import { compressCardImages } from '@/lib/utils/image-compression';
import { generateCardSlug } from '@/lib/slugGenerator';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/admin/cards
 * Create a new card with optional image uploads
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

    const body = await request.json();
    const { setId } = body;

    // Validate required fields
    if (!setId) {
      return NextResponse.json(
        { error: 'setId is required' },
        { status: 400 }
      );
    }

    // Fetch set with release info to generate slug
    const set = await prisma.set.findUnique({
      where: { id: setId },
      include: {
        release: {
          include: {
            manufacturer: true,
          },
        },
      },
    });

    if (!set) {
      return NextResponse.json(
        { error: 'Set not found' },
        { status: 404 }
      );
    }

    // Generate slug
    const slug = generateCardSlug(
      set.release.manufacturer.name,
      set.release.name,
      set.release.year || '',
      set.name,
      body.cardNumber || '',
      body.playerName || '',
      body.variant || null,
      body.printRun || null,
      set.type
    );

    // Prepare card data
    const cardData: {
      slug: string;
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
      setId: string;
    } = {
      slug,
      setId,
    };

    // Add all editable fields if provided
    if (body.playerName !== undefined) cardData.playerName = body.playerName || null;
    if (body.team !== undefined) cardData.team = body.team || null;
    if (body.cardNumber !== undefined) cardData.cardNumber = body.cardNumber || null;
    if (body.variant !== undefined) cardData.variant = body.variant || null;
    if (body.parallelType !== undefined) cardData.parallelType = body.parallelType || null;
    if (body.serialNumber !== undefined) cardData.serialNumber = body.serialNumber || null;
    if (body.isNumbered !== undefined) cardData.isNumbered = Boolean(body.isNumbered);
    if (body.printRun !== undefined) cardData.printRun = body.printRun || null;
    if (body.numbered !== undefined) cardData.numbered = body.numbered || null;
    if (body.rarity !== undefined) cardData.rarity = body.rarity || null;
    if (body.finish !== undefined) cardData.finish = body.finish || null;
    if (body.hasAutograph !== undefined) cardData.hasAutograph = Boolean(body.hasAutograph);
    if (body.hasMemorabilia !== undefined) cardData.hasMemorabilia = Boolean(body.hasMemorabilia);
    if (body.colorVariant !== undefined) cardData.colorVariant = body.colorVariant || null;
    if (body.footyNotes !== undefined) cardData.footyNotes = body.footyNotes || null;

    // Create card first to get the ID
    const newCard = await prisma.card.create({
      data: cardData,
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

    // Handle image uploads if provided
    if (body.imageFront || body.imageBack) {
      console.log('Processing images for new card:', newCard.id);

      let imageFront = newCard.imageFront;
      let imageBack = newCard.imageBack;

      // Compress and upload images
      if (body.imageFront && body.imageBack) {
        const compressed = await compressCardImages(
          body.imageFront,
          body.imageBack,
          { mode: 'standard' }
        );
        const imageUrls = await uploadCardFrontBack(
          newCard.id,
          compressed.front,
          compressed.back
        );
        imageFront = imageUrls.front || null;
        imageBack = imageUrls.back || null;
      } else if (body.imageFront) {
        const compressed = await compressCardImages(
          body.imageFront,
          undefined,
          { mode: 'standard' }
        );
        const imageUrls = await uploadCardFrontBack(
          newCard.id,
          compressed.front
        );
        imageFront = imageUrls.front || null;
      } else if (body.imageBack) {
        const compressed = await compressCardImages(
          undefined,
          body.imageBack,
          { mode: 'standard' }
        );
        const imageUrls = await uploadCardFrontBack(
          newCard.id,
          undefined,
          compressed.back
        );
        imageBack = imageUrls.back || null;
      }

      // Update card with image URLs
      const updatedCard = await prisma.card.update({
        where: { id: newCard.id },
        data: {
          imageFront,
          imageBack,
        },
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

      console.log(`Card ${newCard.id} created successfully with images`);

      return NextResponse.json({
        success: true,
        card: updatedCard,
      });
    }

    console.log(`Card ${newCard.id} created successfully`);

    return NextResponse.json({
      success: true,
      card: newCard,
    });
  } catch (error) {
    console.error('Create card error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create card',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
