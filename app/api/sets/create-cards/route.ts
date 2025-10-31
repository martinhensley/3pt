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

// Helper function to generate numbered display string
function generateNumberedString(serialNumber: string | null, printRun: number | null): string | null {
  if (printRun === 1) {
    return '1 of 1';
  }
  if (serialNumber) {
    return serialNumber;
  }
  if (printRun) {
    return `/${printRun}`;
  }
  return null;
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
          // For slug generation:
          // - If parallels array is provided, use the parallel name
          // - Otherwise, use set name for base cards
          const slugVariant = parallels && parallels.length > 0 ? parallels[0] : set.name;

          const slug = generateCardSlug(
            set.release.manufacturer.name,
            set.release.name,
            set.release.year || '',
            set.name,
            cardData.cardNumber,
            cardData.playerName,
            slugVariant,
            cardData.printRun
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
          // If parallels array is empty, this is a base card (parallelType: null)
          // Otherwise, use the first parallel in the array (for variable parallel checklists)
          const parallelType = parallels && parallels.length > 0 ? parallels[0] : null;

          const serialNumber = cardData.serialNumber || null;
          const printRun = cardData.printRun || null;
          const numbered = generateNumberedString(serialNumber, printRun);

          const card = await prisma.card.create({
            data: {
              slug,
              playerName: cardData.playerName,
              team: cardData.team || null,
              cardNumber: cardData.cardNumber,
              variant: cardData.variant || null,
              parallelType: parallelType,
              serialNumber: serialNumber,
              printRun: printRun,
              isNumbered: printRun ? true : false,
              numbered: numbered,
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
        // Determine if this is a variable parallel (has "or fewer" in name)
        const isVariableParallel = parallelType.toLowerCase().includes('or fewer');

        // Extract print run from parallel name for standard parallels
        let parallelPrintRun: number | null = null;
        let parallelSerialNumber: string | null = null;

        if (!isVariableParallel) {
          // Try to extract print run from parallel name
          // Match patterns like "/99", "/1", "1 of 1"
          const printRunMatch = parallelType.match(/\/(\d+)(?:\s|$)/);
          const oneOfOneMatch = parallelType.match(/1\s+of\s+1/i);

          if (oneOfOneMatch) {
            parallelPrintRun = 1;
            parallelSerialNumber = '/1';
          } else if (printRunMatch) {
            parallelPrintRun = parseInt(printRunMatch[1], 10);
            parallelSerialNumber = `/${parallelPrintRun}`;
          }
        }

        for (const cardData of cards) {
          try {
            // For variable parallels, try to extract serial number from player name
            // Format: "Player Name, Team /XX"
            let cardSerialNumber = parallelSerialNumber;
            let cardPrintRun = parallelPrintRun;
            let cleanPlayerName = cardData.playerName;

            if (isVariableParallel && cardData.playerName) {
              const serialMatch = cardData.playerName.match(/\/(\d+)\s*$/);
              if (serialMatch) {
                cardPrintRun = parseInt(serialMatch[1], 10);
                cardSerialNumber = `/${cardPrintRun}`;
                // Remove the serial number from player name
                cleanPlayerName = cardData.playerName.replace(/\s*\/\d+\s*$/, '').trim();
              }
            }

            // Generate slug for this card
            const slug = generateCardSlug(
              set.release.manufacturer.name,
              set.release.name,
              set.release.year || '',
              set.name,
              cardData.cardNumber,
              cleanPlayerName,
              parallelType,
              cardPrintRun
            );

            // Check if card already exists
            const existingCard = await prisma.card.findUnique({
              where: { slug },
            });

            if (existingCard) {
              console.log(`Card already exists: ${slug}`);
              continue; // Skip if card already exists
            }

            // Use extracted serial number for variable parallels, or parallel's fixed value
            const serialNumber = cardSerialNumber;
            const printRun = cardPrintRun;
            const numbered = generateNumberedString(serialNumber, printRun);

            // Create the card
            const card = await prisma.card.create({
              data: {
                slug,
                playerName: cleanPlayerName,
                team: cardData.team || null,
                cardNumber: cardData.cardNumber,
                variant: cardData.variant || null,
                parallelType: parallelType,
                serialNumber: serialNumber,
                printRun: printRun,
                isNumbered: printRun ? true : false,
                numbered: numbered,
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
