import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting to fix team fields with print runs...');

    // Find all cards with print run pattern in team field
    const cardsWithPrintRun = await prisma.card.findMany({
      where: {
        team: {
          contains: '/',
        },
      },
    });

    console.log(`Found ${cardsWithPrintRun.length} cards with "/" in team field`);

    let updatedCount = 0;

    for (const card of cardsWithPrintRun) {
      if (!card.team) continue;

      // Check if team contains print run pattern (e.g., "Real Madrid /145")
      const printRunMatch = card.team.match(/(.+?)\s*\/\s*(\d+)$/);

      if (printRunMatch) {
        const cleanTeam = printRunMatch[1].trim();
        const printRun = parseInt(printRunMatch[2], 10);

        console.log(`\nCard #${card.cardNumber} - ${card.playerName}`);
        console.log(`  Old team: ${card.team}`);
        console.log(`  New team: ${cleanTeam}`);
        console.log(`  Print run: ${printRun}`);

        await prisma.card.update({
          where: { id: card.id },
          data: {
            team: cleanTeam,
            printRun: printRun,
            isNumbered: true,
          },
        });

        updatedCount++;
        console.log(`  ✓ Updated`);
      }
    }

    console.log(`\n✅ Fixed ${updatedCount} cards!`);
  } catch (error) {
    console.error('Error fixing team print runs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
