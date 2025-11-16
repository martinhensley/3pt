import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixKitKingsPrintRuns() {
  try {
    console.log('Fixing Kit Kings print runs...\n');

    const release = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        sets: {
          where: {
            name: {
              contains: 'Kit Kings'
            }
          }
        }
      }
    });

    if (!release) {
      console.log('Release not found');
      return;
    }

    let updatedCount = 0;

    // Update Kit Kings Prime to /10 (most common print run)
    const primeSet = release.sets.find(s => s.name === 'Kit Kings Prime');
    if (primeSet && primeSet.printRun !== 10) {
      console.log('Updating Kit Kings Prime:');
      console.log('  Current: ' + (primeSet.printRun || 'null'));
      console.log('  New: /10 (variable /3 to /10)');

      await prisma.set.update({
        where: { id: primeSet.id },
        data: { 
          printRun: 10,
          description: 'Variable print runs ranging from /3 to /10 per player'
        }
      });

      updatedCount++;
    }

    // Update Kit Kings Super Prime to 1/1
    const superPrimeSet = release.sets.find(s => s.name === 'Kit Kings Super Prime');
    if (superPrimeSet && superPrimeSet.printRun !== 1) {
      console.log('\nUpdating Kit Kings Super Prime:');
      console.log('  Current: ' + (superPrimeSet.printRun || 'null'));
      console.log('  New: 1/1');

      await prisma.set.update({
        where: { id: superPrimeSet.id },
        data: { printRun: 1 }
      });

      // Update all cards in Super Prime to 1/1
      const cardsUpdated = await prisma.card.updateMany({
        where: { setId: superPrimeSet.id },
        data: {
          printRun: 1,
          isNumbered: true,
          numbered: '1 of 1',
          rarity: 'one_of_one'
        }
      });

      console.log('  Updated ' + cardsUpdated.count + ' cards');
      updatedCount++;
    }

    console.log('\n' + '='.repeat(70));
    console.log('Successfully updated ' + updatedCount + ' sets');
    console.log('='.repeat(70));

    // Verify
    const verifiedSets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        name: {
          contains: 'Kit Kings'
        }
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { cards: true }
        }
      }
    });

    console.log('\nVERIFICATION:\n');
    verifiedSets.forEach(set => {
      const printRunStr = set.printRun ? '/' + set.printRun : '—';
      console.log(set.name + ' ' + printRunStr + ' (' + set._count.cards + ' cards)');
      if (set.description) {
        console.log('  Note: ' + set.description);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixKitKingsPrintRuns();
