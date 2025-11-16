import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRoadToQatarOpticParallels() {
  try {
    console.log('Fixing Road to Qatar Optic parallel print runs...\n');

    // Define the correct print runs for Optic parallels based on official specs
    const correctPrintRuns: Record<string, number | null> = {
      'Optic': null, // Base Optic - unnumbered
      'Optic Holo': null, // Unnumbered
      'Optic Blue Velocity': null, // Unnumbered
      'Optic Green Velocity': null, // Unnumbered
      'Optic Red Velocity': null, // Unnumbered
      'Optic Red': 149,
      'Optic Blue': 99,
      'Optic Purple Velocity': 99,
      'Optic Orange Velocity': 49,
      'Optic Black Velocity': 25,
      'Optic Pink Velocity': 25,
      'Optic Gold': 10,
      'Optic Red and Gold Velocity': 8,
      'Optic Gold Vinyl': 1
    };

    // Get the Road to Qatar release
    const release = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        sets: {
          where: {
            name: {
              startsWith: 'Optic'
            }
          }
        }
      }
    });

    if (!release) {
      console.log('❌ Road to Qatar release not found');
      return;
    }

    console.log(`Found ${release.sets.length} Optic sets\n`);

    let updatedCount = 0;

    for (const set of release.sets) {
      const correctPrintRun = correctPrintRuns[set.name];

      if (correctPrintRun === undefined) {
        console.log(`⚠️  Unknown Optic set: ${set.name} - skipping`);
        continue;
      }

      if (set.printRun !== correctPrintRun) {
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
        releaseId: release.id,
        name: {
          startsWith: 'Optic'
        }
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

    // Check for sets not in the official specs
    console.log('\n' + '='.repeat(70));
    console.log('SETS NOT IN OFFICIAL SPECS:');
    console.log('='.repeat(70));

    const unknownSets = verifyOpticSets.filter(set => correctPrintRuns[set.name] === undefined);
    if (unknownSets.length === 0) {
      console.log('None - all sets match official specs ✓');
    } else {
      unknownSets.forEach(set => {
        console.log(`❌ ${set.name} (${set._count.cards} cards) - should this be removed?`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoadToQatarOpticParallels();
