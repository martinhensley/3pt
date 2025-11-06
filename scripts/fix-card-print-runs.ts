import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding all cards with print run issues...');

  // Get all cards
  const cards = await prisma.card.findMany({
    select: {
      id: true,
      team: true,
      parallelType: true,
      printRun: true,
      playerName: true,
      cardNumber: true,
    },
  });

  console.log(`Found ${cards.length} cards to process`);

  let updatedCount = 0;
  let teamCleanedCount = 0;
  let printRunExtractedCount = 0;

  for (const card of cards) {
    const updates: { team?: string; printRun?: number } = {};

    // Extract print run from parallelType if it exists and printRun is null
    if (card.parallelType && !card.printRun) {
      const printRunMatch = card.parallelType.match(/\/(\d+)\s*$/);
      if (printRunMatch) {
        const printRun = parseInt(printRunMatch[1]);
        updates.printRun = printRun;
        printRunExtractedCount++;
      }
    }

    // Clean team field: remove print run if it exists
    if (card.team) {
      const teamClean = card.team.replace(/\s*\/\s*\d+\s*$/, '').trim();
      if (teamClean !== card.team) {
        updates.team = teamClean;
        teamCleanedCount++;
      }
    }

    // Update card if there are changes
    if (Object.keys(updates).length > 0) {
      await prisma.card.update({
        where: { id: card.id },
        data: updates,
      });
      updatedCount++;

      if (updatedCount <= 10) {
        console.log(`\nUpdated card: ${card.playerName} #${card.cardNumber}`);
        if (updates.team) {
          console.log(`  Team: "${card.team}" → "${updates.team}"`);
        }
        if (updates.printRun) {
          console.log(`  Print run: ${card.printRun} → ${updates.printRun}`);
        }
      }
    }
  }

  console.log(`\n✓ Done!`);
  console.log(`  Total cards updated: ${updatedCount}`);
  console.log(`  Teams cleaned: ${teamCleanedCount}`);
  console.log(`  Print runs extracted: ${printRunExtractedCount}`);
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
