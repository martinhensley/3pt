/**
 * Fix College Ticket Variation Parallel Sets - Comprehensive Fix
 *
 * Problem:
 * Four variation parallel sets have 75 cards instead of 46:
 * - College Championship Ticket Variation (75 cards → should be 46)
 * - College Cracked Ice Ticket Variation (75 cards → should be 46)
 * - College Draft Ticket Variation (75 cards → should be 46)
 * - College Playoff Ticket Variation (75 cards → should be 46)
 *
 * They have cards numbered 102-184 but should only have 102-150 (with gaps at 126, 145, 147)
 *
 * Solution: Delete all cards numbered > 150 from these 4 sets
 *
 * Correct card range: 102-150 excluding 126, 145, 147 = 46 cards total
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Valid card numbers for College Ticket Variation sets (46 cards)
const VALID_CARD_NUMBERS = [
  '102', '103', '104', '105', '106', '107', '108', '109', '110',
  '111', '112', '113', '114', '115', '116', '117', '118', '119', '120',
  '121', '122', '123', '124', '125', // Skip 126
  '127', '128', '129', '130',
  '131', '132', '133', '134', '135', '136', '137', '138', '139', '140',
  '141', '142', '143', '144', // Skip 145
  '146', // Skip 147
  '148', '149', '150'
];

// Sets that need to be fixed (currently have 75 cards, should have 46)
const SETS_TO_FIX = [
  '2016-contenders-draft-picks-college-ticket-variation-championship-ticket-parallel-1',
  '2016-contenders-draft-picks-college-ticket-variation-cracked-ice-ticket-parallel-23',
  '2016-contenders-draft-picks-college-ticket-variation-draft-ticket-parallel-99',
  '2016-contenders-draft-picks-college-ticket-variation-playoff-ticket-parallel-15'
];

async function main() {
  console.log('='.repeat(80));
  console.log('FIXING COLLEGE TICKET VARIATION PARALLEL SETS');
  console.log('='.repeat(80));
  console.log();
  console.log('This script will delete cards numbered 151-184 from 4 parallel sets.');
  console.log('These sets should only have cards 102-150 (46 cards total).');
  console.log();

  // Step 1: Analyze current state
  console.log('='.repeat(80));
  console.log('STEP 1: CURRENT STATE ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  let totalToDelete = 0;

  for (const slug of SETS_TO_FIX) {
    const set = await prisma.set.findUnique({
      where: { slug },
      include: {
        cards: {
          select: {
            id: true,
            cardNumber: true,
            playerName: true
          },
          orderBy: { cardNumber: 'asc' }
        }
      }
    });

    if (!set) {
      console.log(`✗ Set not found: ${slug}`);
      console.log();
      continue;
    }

    const cardNumbers = set.cards.map(c => c.cardNumber).filter(Boolean) as string[];
    const validCards = cardNumbers.filter(num => VALID_CARD_NUMBERS.includes(num));
    const invalidCards = cardNumbers.filter(num => !VALID_CARD_NUMBERS.includes(num));

    console.log(`${set.name}`);
    console.log(`  Total cards: ${set.cards.length}`);
    console.log(`  Valid cards (102-150 range): ${validCards.length}`);
    console.log(`  Invalid cards (will delete): ${invalidCards.length}`);

    if (invalidCards.length > 0) {
      totalToDelete += invalidCards.length;

      // Parse and sort numerically
      const sortedInvalid = invalidCards
        .map(n => parseInt(n))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

      if (sortedInvalid.length > 0) {
        console.log(`  Invalid range: ${sortedInvalid[0]}-${sortedInvalid[sortedInvalid.length - 1]}`);
      }

      // Show a few example cards that will be deleted
      const exampleCards = set.cards
        .filter(c => c.cardNumber && invalidCards.includes(c.cardNumber))
        .slice(0, 3);

      console.log(`  Example cards to delete:`);
      exampleCards.forEach(card => {
        console.log(`    - Card #${card.cardNumber}: ${card.playerName}`);
      });
    }
    console.log();
  }

  console.log(`Total cards to delete: ${totalToDelete}`);
  console.log();

  // Step 2: Execute the fix
  console.log('='.repeat(80));
  console.log('STEP 2: EXECUTING FIX');
  console.log('='.repeat(80));
  console.log();

  let totalDeleted = 0;

  for (const slug of SETS_TO_FIX) {
    const set = await prisma.set.findUnique({
      where: { slug },
      include: {
        cards: {
          select: {
            id: true,
            cardNumber: true,
            playerName: true
          }
        }
      }
    });

    if (!set) {
      console.log(`✗ Set not found: ${slug}`);
      console.log();
      continue;
    }

    console.log(`Processing: ${set.name}`);

    // Find cards to delete (not in valid range)
    const cardsToDelete = set.cards.filter(
      card => card.cardNumber && !VALID_CARD_NUMBERS.includes(card.cardNumber)
    );

    if (cardsToDelete.length === 0) {
      console.log(`  ✓ No cards to delete (already correct)`);
      console.log();
      continue;
    }

    console.log(`  Deleting ${cardsToDelete.length} cards...`);

    // Delete the cards
    const cardIds = cardsToDelete.map(c => c.id);
    const deleteResult = await prisma.card.deleteMany({
      where: {
        id: { in: cardIds }
      }
    });

    console.log(`  ✓ Deleted ${deleteResult.count} cards`);
    totalDeleted += deleteResult.count;

    // Verify final count
    const finalCount = await prisma.card.count({
      where: { setId: set.id }
    });

    console.log(`  ✓ Final card count: ${finalCount}`);

    if (finalCount === 46) {
      console.log(`  ✓ SUCCESS: Set now has correct count (46 cards)`);
    } else {
      console.log(`  ✗ WARNING: Set has ${finalCount} cards, expected 46`);
    }
    console.log();
  }

  console.log(`Total cards deleted: ${totalDeleted}`);
  console.log();

  // Step 3: Final verification
  console.log('='.repeat(80));
  console.log('STEP 3: FINAL VERIFICATION');
  console.log('='.repeat(80));
  console.log();

  let allCorrect = true;

  for (const slug of SETS_TO_FIX) {
    const set = await prisma.set.findUnique({
      where: { slug },
      include: {
        cards: {
          select: {
            cardNumber: true
          }
        }
      }
    });

    if (!set) {
      console.log(`✗ Set not found: ${slug}`);
      allCorrect = false;
      continue;
    }

    const cardCount = set.cards.length;
    const cardNumbers = set.cards.map(c => c.cardNumber).filter(Boolean) as string[];

    // Check if all cards are in valid range
    const invalidCards = cardNumbers.filter(num => !VALID_CARD_NUMBERS.includes(num));

    const status = cardCount === 46 && invalidCards.length === 0 ? '✓' : '✗';
    console.log(`${status} ${set.name}`);
    console.log(`   Card count: ${cardCount} ${cardCount === 46 ? '(CORRECT)' : '(EXPECTED 46)'}`);

    if (invalidCards.length > 0) {
      console.log(`   ✗ Still has ${invalidCards.length} invalid cards!`);
      allCorrect = false;
    }

    if (cardNumbers.length > 0) {
      const numericCards = cardNumbers.map(n => parseInt(n)).filter(n => !isNaN(n));
      if (numericCards.length > 0) {
        const min = Math.min(...numericCards);
        const max = Math.max(...numericCards);
        console.log(`   Card range: ${min}-${max} ${min === 102 && max === 150 ? '(CORRECT)' : ''}`);
      }
    }
    console.log();

    if (cardCount !== 46 || invalidCards.length > 0) {
      allCorrect = false;
    }
  }

  // Step 4: Show all College Ticket sets
  console.log('='.repeat(80));
  console.log('STEP 4: ALL COLLEGE TICKET VARIATION SETS');
  console.log('='.repeat(80));
  console.log();

  const allSets = await prisma.set.findMany({
    where: {
      slug: {
        contains: 'college-ticket'
      },
      release: {
        slug: '2016-panini-contenders-draft-picks-basketball'
      }
    },
    include: {
      _count: {
        select: { cards: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  const correctSets = allSets.filter(s => s._count.cards === 46);
  const wrongSets = allSets.filter(s => s._count.cards !== 46);

  console.log(`Total College Ticket sets: ${allSets.length}`);
  console.log(`  ✓ Correct (46 cards): ${correctSets.length}`);
  console.log(`  ✗ Wrong count: ${wrongSets.length}`);
  console.log();

  console.log('All sets:');
  allSets.forEach(s => {
    const status = s._count.cards === 46 ? '✓' : '✗';
    console.log(`  ${status} ${s.name}: ${s._count.cards} cards`);
  });
  console.log();

  console.log('='.repeat(80));
  if (allCorrect && wrongSets.length === 0) {
    console.log('✓ ALL SETS VERIFIED SUCCESSFULLY!');
  } else if (wrongSets.length > 0) {
    console.log('✗ SOME SETS STILL HAVE WRONG COUNTS');
  } else {
    console.log('✗ VERIFICATION FAILED - MANUAL REVIEW NEEDED');
  }
  console.log('='.repeat(80));
  console.log();
  console.log('Script completed at:', new Date().toISOString());
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
