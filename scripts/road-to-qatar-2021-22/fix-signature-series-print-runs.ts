import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSignatureSeriesPrintRuns() {
  try {
    console.log('Fixing Signature Series print runs...\n');

    const release = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        sets: {
          where: {
            name: {
              contains: 'Signature Series'
            }
          }
        }
      }
    });

    if (!release) {
      console.log('Release not found');
      return;
    }

    // Update Signature Series Black to 1/1
    const blackSet = release.sets.find(s => s.name === 'Signature Series Black');

    if (blackSet && blackSet.printRun !== 1) {
      console.log('Updating Signature Series Black:');
      console.log('  Current print run: ' + (blackSet.printRun || 'null'));
      console.log('  New print run: 1');

      await prisma.set.update({
        where: { id: blackSet.id },
        data: { printRun: 1 }
      });

      // Also update all cards in this set
      const cardsUpdated = await prisma.card.updateMany({
        where: { setId: blackSet.id },
        data: {
          printRun: 1,
          isNumbered: true,
          numbered: '1 of 1',
          rarity: 'one_of_one'
        }
      });

      console.log('  Updated ' + cardsUpdated.count + ' cards\n');
      console.log('Successfully updated Signature Series Black');
    } else if (blackSet) {
      console.log('Signature Series Black already has correct print run');
    } else {
      console.log('Signature Series Black not found');
    }

    // Verify
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION:');
    console.log('='.repeat(70));

    const verifiedSets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        name: {
          contains: 'Signature Series'
        }
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { cards: true }
        }
      }
    });

    verifiedSets.forEach(set => {
      const printRunStr = set.printRun ? '/' + set.printRun : '—';
      console.log(set.name + ' ' + printRunStr + ' (' + set._count.cards + ' cards)');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSignatureSeriesPrintRuns();
