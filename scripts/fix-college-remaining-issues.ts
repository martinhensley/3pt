import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRemainingIssues() {
  console.log('=== Fixing Remaining College Ticket Issues ===\n');

  try {
    // Get the release
    const release = await prisma.release.findUnique({
      where: { slug: '2016-panini-contenders-draft-picks-basketball' },
      include: { sets: true }
    });

    if (!release) {
      throw new Error('Release not found');
    }

    // ISSUE 1: Move cards 151-184 from "College Ticket" to "College Ticket Variation"
    console.log('1. Moving cards 151-184 from College Ticket to College Ticket Variation...');

    const collegeTicket = release.sets.find(s => s.name === 'College Ticket');
    const collegeTicketVariation = release.sets.find(s => s.name === 'College Ticket Variation');

    if (collegeTicket && collegeTicketVariation) {
      const cardsToMove = await prisma.card.findMany({
        where: {
          setId: collegeTicket.id,
          cardNumber: { gte: '151' }
        }
      });

      console.log(`   Found ${cardsToMove.length} cards to move (151+)`);

      for (const card of cardsToMove) {
        await prisma.card.update({
          where: { id: card.id },
          data: { setId: collegeTicketVariation.id }
        });
      }

      console.log(`   ✅ Moved ${cardsToMove.length} cards`);

      // Now check for any duplicates and remove them from College Ticket
      const remainingCards = await prisma.card.findMany({
        where: { setId: collegeTicket.id }
      });

      console.log(`   College Ticket now has ${remainingCards.length} cards remaining`);

      if (remainingCards.length > 0) {
        console.log(`   ⚠️  College Ticket still has ${remainingCards.length} cards (duplicates?)`);
        console.log(`   These cards should be deleted as they're duplicates in Variation set`);

        // Delete the duplicate cards from College Ticket
        await prisma.card.deleteMany({
          where: { setId: collegeTicket.id }
        });

        console.log(`   ✅ Deleted ${remainingCards.length} duplicate cards from College Ticket`);
      }
    } else {
      console.log('   ⚠️  Could not find College Ticket or College Ticket Variation sets');
    }

    // ISSUE 2: Check Printing Plate Magenta and Yellow
    console.log('\n2. Checking Printing Plate Magenta and Yellow...');

    const printingPlates = [
      { name: 'College Ticket Printing Plate Magenta', expected: 'College Ticket Printing Plate - Magenta' },
      { name: 'College Ticket Printing Plate Yellow', expected: 'College Ticket Printing Plate - Yellow' }
    ];

    for (const plate of printingPlates) {
      const emptySet = release.sets.find(s => s.name === plate.name);
      const fullSet = release.sets.find(s => s.name === plate.expected);

      if (emptySet) {
        const cardCount = await prisma.card.count({ where: { setId: emptySet.id } });
        console.log(`   ${plate.name}: ${cardCount} cards`);

        if (cardCount === 0 && fullSet) {
          const fullSetCount = await prisma.card.count({ where: { setId: fullSet.id } });
          console.log(`   ${plate.expected}: ${fullSetCount} cards`);
          console.log(`   ✅ Empty set exists alongside correct set (will delete empty set later)`);
        }
      }
    }

    // ISSUE 3: Verify all empty "Variation" sets that should be deleted
    console.log('\n3. Identifying empty sets that should be deleted...');

    const emptySets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        name: { startsWith: 'College' },
        cards: { none: {} }
      },
      include: {
        _count: { select: { cards: true } }
      }
    });

    console.log(`   Found ${emptySets.length} empty College sets:`);
    emptySets.forEach(set => {
      console.log(`   - ${set.name}`);
    });

    // Delete empty sets
    if (emptySets.length > 0) {
      for (const set of emptySets) {
        await prisma.set.delete({ where: { id: set.id } });
      }
      console.log(`   ✅ Deleted ${emptySets.length} empty sets`);
    }

    // Final verification
    console.log('\n=== Final Verification ===');

    const finalSets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        name: { startsWith: 'College' }
      },
      include: {
        _count: { select: { cards: true } }
      },
      orderBy: { name: 'asc' }
    });

    console.log('\nAll College sets after fix:');
    finalSets.forEach(set => {
      const status = set._count.cards === 0 ? 'EMPTY ❌' :
                     set._count.cards === 75 ? '✅' :
                     set._count.cards === 74 ? '(74 with gaps) ✅' : '⚠️';
      console.log(`${set._count.cards} cards - ${set.name} ${status}`);
    });

    console.log('\n✅ All fixes completed!');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixRemainingIssues();
