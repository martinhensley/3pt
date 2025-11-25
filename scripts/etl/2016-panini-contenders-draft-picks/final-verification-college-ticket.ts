import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const expectedCardCount = 75; // 83 possible (102-184) - 8 gaps = 75 cards
const missingNumbers = [126, 145, 147, 155, 170, 174, 175, 177];

async function main() {
  console.log('=== FINAL VERIFICATION: COLLEGE TICKET SETS ===\n');

  const release = await prisma.release.findFirst({
    where: {
      slug: '2016-panini-contenders-draft-picks-basketball'
    }
  });

  if (!release) {
    throw new Error('Release not found');
  }

  // Get all College sets (both variation and non-variation)
  const allSets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      name: {
        contains: 'College',
        mode: 'insensitive'
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

  const variationSets = allSets.filter(s => s.name.includes('Variation'));
  const nonVariationSets = allSets.filter(s => !s.name.includes('Variation'));

  console.log('=== NON-VARIATION SETS (Expected: 75 cards each) ===\n');

  let allNonVariationCorrect = true;
  for (const set of nonVariationSets) {
    const status = set._count.cards === expectedCardCount ? '✓' : '✗';
    const isCorrect = set._count.cards === expectedCardCount;

    if (!isCorrect) {
      allNonVariationCorrect = false;
    }

    console.log(`${status} ${set.name}`);
    console.log(`   Cards: ${set._count.cards} (expected ${expectedCardCount})`);
    console.log(`   isParallel: ${set.isParallel}, printRun: ${set.printRun || 'null'}`);
    console.log('');
  }

  console.log('=== VARIATION SETS (Expected: 46 cards each) ===\n');

  const expectedVariationCount = 46; // Cards 102-150 minus gaps 126, 145, 147
  let allVariationCorrect = true;

  for (const set of variationSets) {
    const status = set._count.cards === expectedVariationCount ? '✓' : '✗';
    const isCorrect = set._count.cards === expectedVariationCount;

    if (!isCorrect) {
      allVariationCorrect = false;
    }

    console.log(`${status} ${set.name}`);
    console.log(`   Cards: ${set._count.cards} (expected ${expectedVariationCount})`);
    console.log(`   isParallel: ${set.isParallel}, printRun: ${set.printRun || 'null'}`);
    console.log('');
  }

  console.log('=== SUMMARY ===\n');
  console.log(`Total College Ticket sets: ${allSets.length}`);
  console.log(`  - Non-variation sets: ${nonVariationSets.length} (expected 11)`);
  console.log(`  - Variation sets: ${variationSets.length} (expected 11)`);
  console.log('');

  // Expected non-variation sets
  const expectedNonVariationSets = [
    'College Ticket',
    'College Championship Ticket',
    'College Cracked Ice Ticket',
    'College Draft Ticket',
    'College Draft Ticket Blue Foil',
    'College Draft Ticket Red Foil',
    'College Playoff Ticket',
    'College Ticket Printing Plate Black',
    'College Ticket Printing Plate Cyan',
    'College Ticket Printing Plate Magenta',
    'College Ticket Printing Plate Yellow'
  ];

  console.log('=== CHECKING FOR MISSING SETS ===\n');

  const nonVariationNames = new Set(nonVariationSets.map(s => s.name));
  let allSetsPresent = true;

  for (const expectedName of expectedNonVariationSets) {
    if (nonVariationNames.has(expectedName)) {
      console.log(`✓ ${expectedName}`);
    } else {
      console.log(`✗ MISSING: ${expectedName}`);
      allSetsPresent = false;
    }
  }

  console.log('\n=== FINAL STATUS ===\n');

  if (allNonVariationCorrect && allVariationCorrect && allSetsPresent &&
      nonVariationSets.length === 11 && variationSets.length === 11) {
    console.log('✓✓✓ ALL CHECKS PASSED ✓✓✓');
    console.log('');
    console.log('College Ticket restoration is COMPLETE:');
    console.log(`  - ${nonVariationSets.length} non-variation sets with ${expectedCardCount} cards each`);
    console.log(`  - ${variationSets.length} variation sets with ${expectedVariationCount} cards each`);
    console.log(`  - All card numbers correct (gaps at: ${missingNumbers.join(', ')})`);
  } else {
    console.log('✗✗✗ SOME CHECKS FAILED ✗✗✗');
    console.log('');
    if (!allNonVariationCorrect) {
      console.log('✗ Some non-variation sets have incorrect card counts');
    }
    if (!allVariationCorrect) {
      console.log('✗ Some variation sets have incorrect card counts');
    }
    if (!allSetsPresent) {
      console.log('✗ Some expected sets are missing');
    }
    if (nonVariationSets.length !== 11) {
      console.log(`✗ Expected 11 non-variation sets, found ${nonVariationSets.length}`);
    }
    if (variationSets.length !== 11) {
      console.log(`✗ Expected 11 variation sets, found ${variationSets.length}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
