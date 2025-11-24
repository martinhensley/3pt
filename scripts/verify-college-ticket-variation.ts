/**
 * Verify College Ticket Variation card counts match official checklist
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Official checklist - 46 cards (102-150 excluding 126, 145, 147)
const OFFICIAL_CARD_NUMBERS = [
  102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
  121, 122, 123, 124, 125, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140,
  141, 142, 143, 144, 146, 148, 149, 150
];

async function main() {
  console.log('=== College Ticket Variation - Checklist Verification ===\n');

  const variationSet = await prisma.set.findUnique({
    where: { slug: '2016-contenders-draft-picks-college-ticket-variation' },
    include: {
      cards: {
        orderBy: { cardNumber: 'asc' }
      }
    }
  });

  if (!variationSet) {
    throw new Error('Set not found');
  }

  const cardNumbers = variationSet.cards.map(c =>
    typeof c.cardNumber === 'string' ? parseInt(c.cardNumber) : c.cardNumber
  ).sort((a, b) => a - b);

  console.log(`Total cards: ${cardNumbers.length}`);
  console.log(`Expected: 46\n`);

  console.log('Card numbers present:');
  console.log(cardNumbers.join(', '));

  console.log('\n\nOfficial checklist:');
  console.log(OFFICIAL_CARD_NUMBERS.join(', '));

  // Check for differences
  const extra = cardNumbers.filter(n => !OFFICIAL_CARD_NUMBERS.includes(n));
  const missing = OFFICIAL_CARD_NUMBERS.filter(n => !cardNumbers.includes(n));

  console.log('\n\n=== Comparison ===');
  if (extra.length > 0) {
    console.log(`\nExtra cards (not in official checklist): ${extra.join(', ')}`);
  }
  if (missing.length > 0) {
    console.log(`\nMissing cards (in official checklist): ${missing.join(', ')}`);
  }
  if (extra.length === 0 && missing.length === 0) {
    console.log('\n✓ PERFECT MATCH! All card numbers match the official checklist.');
  }

  // Verify printing plate sets
  console.log('\n\n=== Printing Plate Sets Verification ===\n');

  const printingPlateSets = await prisma.set.findMany({
    where: {
      slug: {
        contains: 'college-ticket-printing-plate'
      }
    },
    include: {
      cards: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  for (const set of printingPlateSets) {
    const setCardNumbers = set.cards.map(c =>
      typeof c.cardNumber === 'string' ? parseInt(c.cardNumber) : c.cardNumber
    ).sort((a, b) => a - b);

    const setExtra = setCardNumbers.filter(n => !OFFICIAL_CARD_NUMBERS.includes(n));
    const setMissing = OFFICIAL_CARD_NUMBERS.filter(n => !setCardNumbers.includes(n));

    console.log(`${set.name}: ${set.cards.length} cards`);
    if (setExtra.length === 0 && setMissing.length === 0) {
      console.log('  ✓ Perfect match');
    } else {
      console.log(`  ✗ Extra: ${setExtra.length}, Missing: ${setMissing.length}`);
    }
  }

  console.log('\n✓ Verification complete!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
