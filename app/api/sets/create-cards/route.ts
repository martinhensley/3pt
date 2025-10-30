import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCardSlug } from "@/lib/slugGenerator";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CardData {
  playerName: string;
  team?: string;
  cardNumber: string;
  variant?: string;
  serialNumber?: string;
  printRun?: number;
}

// POST - Create cards for a set (for all parallels or with individual serial numbers)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { setId, cards, parallels, manualSerialMode } = body as {
      setId: string;
      cards: CardData[];
      parallels: string[];
      manualSerialMode?: boolean;
    };

    if (!setId || !cards || cards.length === 0) {
      return NextResponse.json(
        { error: "setId and cards are required" },
        { status: 400 }
      );
    }

    // Fetch the set with its release information
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
      return NextResponse.json({ error: "Set not found" }, { status: 404 });
    }

    const createdCards = [];
    const errors = [];

    // Manual Serial Mode: Create cards with individual serial numbers (no parallel duplication)
    if (manualSerialMode) {
      console.log(`Creating ${cards.length} cards with individual serial numbers for set "${set.name}"`);

      for (const cardData of cards) {
        try {
          // Use set name as the parallel type for slug generation
          const slug = generateCardSlug(
            set.release.manufacturer.name,
            set.release.name,
            set.release.year || '',
            set.name,
            cardData.cardNumber,
            cardData.playerName,
            set.name  // Use set name as the variant/parallel
          );

          // Check if card already exists
          const existingCard = await prisma.card.findUnique({
            where: { slug },
          });

          if (existingCard) {
            console.log(`Card already exists: ${slug}`);
            continue; // Skip if card already exists
          }

          // Create the card with serial number and print run
          const card = await prisma.card.create({
            data: {
              slug,
              playerName: cardData.playerName,
              team: cardData.team || null,
              cardNumber: cardData.cardNumber,
              variant: cardData.variant || null,
              parallelType: set.name,  // Store set name as parallel type
              serialNumber: cardData.serialNumber || null,
              printRun: cardData.printRun || null,
              isNumbered: cardData.printRun ? true : false,
              setId: setId,
            },
          });

          createdCards.push(card);
        } catch (error) {
          console.error(`Error creating card ${cardData.cardNumber} - ${cardData.playerName}:`, error);
          errors.push({
            card: `${cardData.cardNumber} - ${cardData.playerName}`,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } else {
      // Standard Mode: Create cards across all parallels
      let parallelTypes: string[] = [];

      if (parallels && parallels.length > 0) {
        // Use provided parallels
        parallelTypes = parallels;
      } else if (set.parallels && Array.isArray(set.parallels)) {
        // Use set's parallels from database
        parallelTypes = set.parallels.filter((p): p is string => typeof p === 'string');
      }

      // If no parallels specified, create base cards only
      if (parallelTypes.length === 0) {
        // Determine base parallel type based on set name
        const isOpticSet = set.name.toLowerCase().includes('optic');
        parallelTypes = [isOpticSet ? 'Optic' : 'Base'];
      }

      console.log(`Creating cards for set "${set.name}" with ${parallelTypes.length} parallel types and ${cards.length} base cards`);

      // Create cards for each parallel type
      for (const parallelType of parallelTypes) {
        for (const cardData of cards) {
          try {
            // Generate slug for this card
            const slug = generateCardSlug(
              set.release.manufacturer.name,
              set.release.name,
              set.release.year || '',
              set.name,
              cardData.cardNumber,
              cardData.playerName,
              parallelType
            );

            // Check if card already exists
            const existingCard = await prisma.card.findUnique({
              where: { slug },
            });

            if (existingCard) {
              console.log(`Card already exists: ${slug}`);
              continue; // Skip if card already exists
            }

            // Create the card
            const card = await prisma.card.create({
              data: {
                slug,
                playerName: cardData.playerName,
                team: cardData.team || null,
                cardNumber: cardData.cardNumber,
                variant: cardData.variant || null,
                parallelType: parallelType,
                setId: setId,
              },
            });

            createdCards.push(card);
          } catch (error) {
            console.error(`Error creating card ${cardData.cardNumber} - ${cardData.playerName} (${parallelType}):`, error);
            errors.push({
              card: `${cardData.cardNumber} - ${cardData.playerName}`,
              parallel: parallelType,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
    }

    console.log(`Created ${createdCards.length} cards`);
    if (errors.length > 0) {
      console.log(`Encountered ${errors.length} errors`);
    }

    if (manualSerialMode) {
      return NextResponse.json({
        success: true,
        created: createdCards.length,
        skipped: cards.length - createdCards.length - errors.length,
        errors: errors.length,
        errorDetails: errors.length > 0 ? errors.slice(0, 10) : [],
      });
    } else {
      // Calculate parallelsProcessed from the standard mode logic
      let parallelTypes: string[] = [];
      if (parallels && parallels.length > 0) {
        parallelTypes = parallels;
      } else if (set.parallels && Array.isArray(set.parallels)) {
        parallelTypes = set.parallels.filter((p): p is string => typeof p === 'string');
      }
      if (parallelTypes.length === 0) {
        const isOpticSet = set.name.toLowerCase().includes('optic');
        parallelTypes = [isOpticSet ? 'Optic' : 'Base'];
      }

      return NextResponse.json({
        success: true,
        created: createdCards.length,
        skipped: (cards.length * parallelTypes.length) - createdCards.length - errors.length,
        errors: errors.length,
        errorDetails: errors.length > 0 ? errors.slice(0, 10) : [],
        parallelsProcessed: parallelTypes.length,
        cardsPerParallel: cards.length,
      });
    }
  } catch (error) {
    console.error("Create cards error:", error);
    return NextResponse.json(
      { error: "Failed to create cards", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
