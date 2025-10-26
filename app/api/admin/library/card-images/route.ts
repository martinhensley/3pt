import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET - List all card images with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause - only images associated with cards
    const where: Record<string, unknown> = {
      cardId: { not: null },
    };

    // Add search filter - search by card name, card number, or caption
    if (search) {
      where.OR = [
        { caption: { contains: search, mode: 'insensitive' } },
        {
          card: {
            OR: [
              { playerName: { contains: search, mode: 'insensitive' } },
              { cardNumber: { contains: search, mode: 'insensitive' } },
              { variant: { contains: search, mode: 'insensitive' } },
            ]
          }
        },
      ];
    }

    // Get total count for pagination
    const total = await prisma.image.count({ where });

    // Get card images with card, set, and release information
    const images = await prisma.image.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        card: {
          include: {
            set: {
              include: {
                release: true,
              },
            },
          },
        },
      },
    });

    // Transform to match UI interface
    const transformedImages = images.map((image) => {
      const card = image.card;
      if (!card) return null;

      const set = card.set;
      const release = set.release;

      // Build card display name
      const cardDisplayName = [
        card.playerName,
        card.cardNumber && `#${card.cardNumber}`,
        card.variant,
      ].filter(Boolean).join(' ');

      return {
        id: image.id,
        url: image.url,
        caption: image.caption,
        order: image.order,
        createdAt: image.createdAt.toISOString(),
        card: {
          id: card.id,
          displayName: cardDisplayName || 'Untitled Card',
          playerName: card.playerName,
          cardNumber: card.cardNumber,
          variant: card.variant,
          set: {
            id: set.id,
            name: set.name,
            release: {
              id: release.id,
              name: release.name,
              year: release.year,
            },
          },
        },
      };
    }).filter(Boolean);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      images: transformedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Card images library error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card images' },
      { status: 500 }
    );
  }
}
