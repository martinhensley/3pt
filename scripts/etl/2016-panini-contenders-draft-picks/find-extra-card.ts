import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findExtraCard() {
  console.log('Finding the extra card in Blue/Red Foil sets...\n');

  // All numbers from 102-184 = 83 numbers
  // Minus 8 gaps = 75 numbers
  // But we expect 74, so there's one MORE gap we don't know about

  // Let's just get all numbers 102-184 first
  const allNumbers = Array.from({ length: 83 }, (_, i) => 102 + i);
  const knownGaps = [126, 145, 147, 155, 170, 174, 175, 177];

  console.log(`All numbers 102-184: ${allNumbers.length} total`);
  console.log(`Known gaps: ${knownGaps.length}`);
  console.log(`Known gaps: ${knownGaps.join(', ')}`);
  console.log();

  // Get Blue Foil cards
  const blueFoil = await prisma.set.findUnique({
    where: { slug: '2016-contenders-draft-picks-college-draft-ticket-blue-foil-parallel' },
    include: {
      cards: {
        select: {
          cardNumber: true,
          playerName: true,
        },
        orderBy: {
          cardNumber: 'asc',
        },
      },
    },
  });

  if (!blueFoil) {
    console.log('Blue Foil set not found');
    return;
  }

  const blueFoilNumbers = blueFoil.cards
    .map(c => c.cardNumber)
    .filter((n): n is string => n !== null)
    .map(n => parseInt(n))
    .sort((a, b) => a - b);

  console.log(`Blue Foil: ${blueFoilNumbers.length} cards`);
  console.log(`Range: ${blueFoilNumbers[0]}-${blueFoilNumbers[blueFoilNumbers.length - 1]}`);
  console.log();

  // Find which numbers are present vs missing
  const presentNumbers = blueFoilNumbers;
  const missingFromAll = allNumbers.filter(num => !blueFoilNumbers.includes(num));

  if (extraCards.length > 0) {
    console.log('⚠️  EXTRA CARDS found in Blue Foil:');
    for (const num of extraCards) {
      const card = blueFoil.cards.find(c => c.cardNumber === String(num));
      console.log(`  Card ${num}: ${card?.playerName || 'Unknown'}`);
    }
    console.log();
  }

  if (missingCards.length > 0) {
    console.log('⚠️  MISSING CARDS from Blue Foil (expected but not found):');
    for (const num of missingCards) {
      console.log(`  Card ${num}`);
    }
    console.log();
  }

  // Check the gaps to see if any are filled
  const gaps = [126, 145, 147, 155, 170, 174, 175, 177];
  const filledGaps = gaps.filter(num => blueFoilNumbers.includes(num));

  if (filledGaps.length > 0) {
    console.log('Cards found in expected gap positions:');
    for (const num of filledGaps) {
      const card = blueFoil.cards.find(c => c.cardNumber === String(num));
      console.log(`  Card ${num}: ${card?.playerName || 'Unknown'}`);
    }
    console.log();
  }

  // Summary
  console.log('ANALYSIS:');
  console.log('-'.repeat(80));
  console.log(`Expected: 74 cards (102-184 with 8 gaps)`);
  console.log(`Found: ${blueFoilNumbers.length} cards`);
  console.log(`Extra: ${extraCards.length} card(s)`);
  console.log(`Missing: ${missingCards.length} card(s)`);
  console.log();

  if (extraCards.length === 1 && missingCards.length === 0) {
    console.log('✓ Simple case: One extra card needs to be removed');
    console.log(`  Remove card ${extraCards[0]} to get to 74 cards`);
  } else if (extraCards.length === 0 && missingCards.length === 1) {
    console.log('✓ One card is missing from the 74 expected');
    console.log(`  Missing card ${missingCards[0]}`);
  } else {
    console.log('⚠️  Complex case: Multiple discrepancies detected');
  }
}

findExtraCard()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
