/**
 * Fix College Ticket Variation card counts
 *
 * Problem:
 * - College Ticket Variation base set has 74 cards (102-184)
 * - Should only have 46 cards (102-150 with gaps at 126, 145, 147)
 * - Cards 151-184 need to be removed
 * - All Printing Plate parallels should also have only 46 cards
 *
 * Correct checklist:
 * 102-150 excluding 126, 145, 147 = 46 cards
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Official College Ticket Variation card numbers
const OFFICIAL_CARD_NUMBERS = [
  102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
  121, 122, 123, 124, 125, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140,
  141, 142, 143, 144, 146, 148, 149, 150
];

async function main() {
  console.log('=== Fixing College Ticket Variation Card Counts ===\n');

  const release = await prisma.release.findUnique({
    where: { slug: '2016-panini-contenders-draft-picks-basketball' }
  });

  if (!release) {
    throw new Error('Release not found');
  }

  // Find all College Ticket Variation sets (base + printing plates)
  const sets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      OR: [
        { slug: '2016-contenders-draft-picks-college-ticket-variation' },
        { slug: { contains: 'college-ticket-printing-plate' } }
      ]
    },
    include: {
      cards: {
        orderBy: { cardNumber: 'asc' }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log(`Found ${sets.length} sets to fix:\n`);

  for (const set of sets) {
    console.log(`\n${set.name}`);
    console.log(`  Current cards: ${set.cards.length}`);

    // Find cards that should be removed (151-184 and missing numbers 126, 145, 147)
    const cardsToRemove = set.cards.filter(card =>
      !OFFICIAL_CARD_NUMBERS.includes(card.cardNumber)
    );

    const cards102_150 = set.cards.filter(c => c.cardNumber >= 102 && c.cardNumber <= 150);
    const cards151_184 = set.cards.filter(c => c.cardNumber >= 151 && c.cardNumber <= 184);

    console.log(`  Cards 102-150: ${cards102_150.length}`);
    console.log(`  Cards 151-184: ${cards151_184.length}`);
    console.log(`  Cards to remove: ${cardsToRemove.length}`);

    if (cardsToRemove.length > 0) {
      console.log(`\n  Removing ${cardsToRemove.length} cards...`);

      // Show sample of cards being removed
      const sample = cardsToRemove.slice(0, 5);
      console.log('  Sample cards being removed:');
      sample.forEach(card => {
        console.log(`    #${card.cardNumber}: ${card.playerName}`);
      });
      if (cardsToRemove.length > 5) {
        console.log(`    ... and ${cardsToRemove.length - 5} more`);
      }

      // Delete the cards
      const result = await prisma.card.deleteMany({
        where: {
          id: {
            in: cardsToRemove.map(c => c.id)
          }
        }
      });

      console.log(`  ✓ Deleted ${result.count} cards`);
    } else {
      console.log('  ✓ No cards to remove');
    }

    // Verify final count
    const finalCount = await prisma.card.count({
      where: { setId: set.id }
    });

    console.log(`  Final card count: ${finalCount}`);

    if (finalCount === 46) {
      console.log('  ✓ Correct count!');
    } else {
      console.log(`  ✗ Expected 46 cards, got ${finalCount}`);
    }
  }

  // Final verification
  console.log('\n=== Final Verification ===\n');

  for (const set of sets) {
    const cards = await prisma.card.findMany({
      where: { setId: set.id },
      orderBy: { cardNumber: 'asc' }
    });

    const minCard = cards.length > 0 ? Math.min(...cards.map(c => c.cardNumber)) : 0;
    const maxCard = cards.length > 0 ? Math.max(...cards.map(c => c.cardNumber)) : 0;

    console.log(`${set.name}: ${cards.length} cards (${minCard}-${maxCard})`);

    // Verify no cards > 150
    const cardsAbove150 = cards.filter(c => c.cardNumber > 150);
    if (cardsAbove150.length > 0) {
      console.log(`  ✗ WARNING: ${cardsAbove150.length} cards numbered > 150`);
    } else {
      console.log('  ✓ No cards > 150');
    }
  }

  console.log('\n✓ Fix complete!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
