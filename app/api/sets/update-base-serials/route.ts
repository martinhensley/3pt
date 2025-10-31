import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CardData {
  playerName: string;
  cardNumber: string;
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

// POST - Update existing base cards with serial numbers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { setId, cards } = body as {
      setId: string;
      cards: CardData[];
    };

    if (!setId || !cards || cards.length === 0) {
      return NextResponse.json(
        { error: "setId and cards are required" },
        { status: 400 }
      );
    }

    console.log(`Updating ${cards.length} base cards for set ${setId}`);

    let updated = 0;
    let notFound = 0;
    const errors = [];

    for (const cardData of cards) {
      try {
        // Find the existing base card by setId, cardNumber, playerName
        // Support both null and "Base" parallelType for backward compatibility
        const existingCard = await prisma.card.findFirst({
          where: {
            setId: setId,
            cardNumber: cardData.cardNumber,
            playerName: cardData.playerName,
            OR: [
              { parallelType: null }, // New base cards
              { parallelType: 'Base' }, // Legacy base cards
            ],
          },
        });

        if (!existingCard) {
          console.log(`Base card not found: #${cardData.cardNumber} ${cardData.playerName}`);
          notFound++;
          continue;
        }

        // Update the card with serial number, print run, and numbered
        const serialNumber = cardData.serialNumber || null;
        const printRun = cardData.printRun || null;
        const numbered = generateNumberedString(serialNumber, printRun);

        await prisma.card.update({
          where: { id: existingCard.id },
          data: {
            serialNumber: serialNumber,
            printRun: printRun,
            isNumbered: printRun ? true : false,
            numbered: numbered,
          },
        });

        updated++;
        console.log(`✓ Updated: #${cardData.cardNumber} ${cardData.playerName} ${cardData.serialNumber || '(no serial)'}`);
      } catch (error) {
        console.error(`Error updating card ${cardData.cardNumber} - ${cardData.playerName}:`, error);
        errors.push({
          card: `${cardData.cardNumber} - ${cardData.playerName}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`Updated ${updated} base cards, ${notFound} not found, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      updated,
      notFound,
      errors: errors.length,
      errorDetails: errors.length > 0 ? errors.slice(0, 10) : [],
    });
  } catch (error) {
    console.error("Update base serials error:", error);
    return NextResponse.json(
      { error: "Failed to update base serials", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
