import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOpticPrintRuns() {
  try {
    console.log('Fixing Optic parallel print runs...\n');

    // Define the correct print runs for Optic parallels
    const correctPrintRuns: Record<string, number | null> = {
      'Optic': null,
      'Optic Argyle': null,
      'Optic Holo': null,
      'Optic Ice': null,
      'Optic Plum Blossom': null,
      'Optic Velocity': null,
      'Optic Red': 299,
      'Optic Blue': 149,
      'Optic Pink Velocity': 99,
      'Optic Teal Mojo': 49,
      'Optic Pink Ice': 25,
      'Optic Purple Mojo': 25,
      'Optic Gold': 10,
      'Optic Dragon Scale': 8,
      'Optic Green': 5,
      'Optic Black': 1,
      'Optic Black Pandora': 1,
      'Optic Gold Power': 1
    };

    // Get all Optic sets
    const opticSets = await prisma.set.findMany({
      where: {
        AND: [
          { slug: { contains: 'optic' } },
          { slug: { contains: '2024-25-donruss-soccer' } }
        ]
      }
    });

    console.log(`Found ${opticSets.length} Optic sets\n`);

    let updatedCount = 0;

    for (const set of opticSets) {
      const correctPrintRun = correctPrintRuns[set.name];

      if (correctPrintRun !== undefined && set.printRun !== correctPrintRun) {
        console.log(`Updating ${set.name}:`);
        console.log(`  Current: ${set.printRun === null ? 'null' : set.printRun}`);
        console.log(`  New: ${correctPrintRun === null ? 'null' : correctPrintRun}`);

        await prisma.set.update({
          where: { id: set.id },
          data: { printRun: correctPrintRun }
        });

        // Also update all cards in this set to have the correct print run
        const cardsUpdated = await prisma.card.updateMany({
          where: { setId: set.id },
          data: {
            printRun: correctPrintRun,
            isNumbered: correctPrintRun !== null,
            numbered: correctPrintRun === null ? null :
                     correctPrintRun === 1 ? '1 of 1' : `/${correctPrintRun}`,
            rarity: correctPrintRun === 1 ? 'one_of_one' :
                   correctPrintRun && correctPrintRun <= 10 ? 'ultra_rare' :
                   correctPrintRun && correctPrintRun <= 50 ? 'super_rare' :
                   correctPrintRun && correctPrintRun <= 199 ? 'rare' : 'base'
          }
        });

        console.log(`  Updated ${cardsUpdated.count} cards\n`);
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      console.log('✅ All Optic parallel print runs are already correct!');
    } else {
      console.log(`✅ Successfully updated ${updatedCount} Optic sets and their cards`);
    }

    // Verify the changes
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION - Current Print Runs:');
    console.log('='.repeat(70));

    const verifyOpticSets = await prisma.set.findMany({
      where: {
        AND: [
          { slug: { contains: 'optic' } },
          { slug: { contains: '2024-25-donruss-soccer' } }
        ]
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { cards: true }
        }
      }
    });

    verifyOpticSets.forEach(set => {
      const correctPR = correctPrintRuns[set.name];
      const currentPR = set.printRun;
      const match = currentPR === correctPR ? '✓' : '✗';
      const prDisplay = currentPR === null ? 'null' : `/${currentPR}`;
      console.log(`${set.name.padEnd(40)} ${prDisplay.padEnd(10)} ${match} (${set._count.cards} cards)`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOpticPrintRuns();