import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SetDiagnostic {
  id: string;
  name: string;
  slug: string;
  isParallel: boolean;
  baseSetSlug: string | null;
  printRun: number | null;
  cardCount: number;
  cardNumbers: number[];
  missingNumbers: number[];
  extraNumbers: number[];
}

// Official checklist card numbers (46 cards)
const OFFICIAL_CARD_NUMBERS = [
  102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
  121, 122, 123, 124, 125, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140,
  141, 142, 143, 144, 146, 148, 149, 150
];

// Expected parallels with their print runs
const EXPECTED_PARALLELS = [
  { name: 'Draft Blue Foil', printRun: null },
  { name: 'Draft Red Foil', printRun: null },
  { name: 'Draft', printRun: 99 },
  { name: 'Cracked Ice Ticket', printRun: 23 },
  { name: 'Playoff Ticket', printRun: 15 },
  { name: 'Championship Ticket', printRun: 1 },
  { name: 'Printing Plates', printRun: 1 }
];

async function diagnoseCollegeTicketVariation() {
  console.log('='.repeat(80));
  console.log('COLLEGE TICKET VARIATION DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log();

  // Get the release
  const release = await prisma.release.findFirst({
    where: {
      slug: '2016-panini-contenders-draft-picks-basketball'
    }
  });

  if (!release) {
    console.error('ERROR: 2016 Panini Contenders Draft Picks Basketball release not found');
    return;
  }

  console.log(`Release: ${release.name} (${release.slug})`);
  console.log();

  // Get all College Ticket Variation sets (base and parallels)
  const sets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      OR: [
        { slug: { contains: 'college-ticket-variation' } },
        { name: { contains: 'College Ticket Variation' } }
      ]
    },
    include: {
      cards: {
        orderBy: { cardNumber: 'asc' }
      }
    },
    orderBy: [
      { isParallel: 'asc' },
      { name: 'asc' }
    ]
  });

  console.log(`Found ${sets.length} sets matching "College Ticket Variation"`);
  console.log();

  // Process each set
  const diagnostics: SetDiagnostic[] = [];

  for (const set of sets) {
    const cardNumbers = set.cards
      .map(c => parseInt(c.cardNumber))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    const uniqueCardNumbers = Array.from(new Set(cardNumbers));

    const missingNumbers = OFFICIAL_CARD_NUMBERS.filter(n => !uniqueCardNumbers.includes(n));
    const extraNumbers = uniqueCardNumbers.filter(n => !OFFICIAL_CARD_NUMBERS.includes(n));

    diagnostics.push({
      id: set.id,
      name: set.name,
      slug: set.slug,
      isParallel: set.isParallel,
      baseSetSlug: set.baseSetSlug,
      printRun: set.printRun,
      cardCount: set.cards.length,
      cardNumbers: uniqueCardNumbers,
      missingNumbers,
      extraNumbers
    });
  }

  // Separate base and parallels
  const baseSet = diagnostics.find(d => !d.isParallel);
  const parallels = diagnostics.filter(d => d.isParallel);

  console.log('─'.repeat(80));
  console.log('BASE SET ANALYSIS');
  console.log('─'.repeat(80));
  console.log();

  if (baseSet) {
    console.log(`Name: ${baseSet.name}`);
    console.log(`Slug: ${baseSet.slug}`);
    console.log(`Card Count: ${baseSet.cardCount} (Expected: 46)`);
    console.log(`isParallel: ${baseSet.isParallel}`);
    console.log(`baseSetSlug: ${baseSet.baseSetSlug || 'null'}`);
    console.log();

    if (baseSet.cardCount === 46) {
      console.log('✓ Card count matches official checklist');
    } else {
      console.log(`✗ Card count mismatch: ${baseSet.cardCount} vs 46 expected`);
    }
    console.log();

    if (baseSet.missingNumbers.length > 0) {
      console.log(`✗ Missing ${baseSet.missingNumbers.length} card numbers:`);
      console.log(`  ${baseSet.missingNumbers.join(', ')}`);
      console.log();
    } else {
      console.log('✓ All expected card numbers present');
      console.log();
    }

    if (baseSet.extraNumbers.length > 0) {
      console.log(`✗ Found ${baseSet.extraNumbers.length} unexpected card numbers:`);
      console.log(`  ${baseSet.extraNumbers.join(', ')}`);
      console.log();
    }

    // Check for duplicates
    const duplicates = baseSet.cardNumbers.filter(
      (n, i, arr) => arr.indexOf(n) !== i
    );
    if (duplicates.length > 0) {
      console.log(`✗ Duplicate card numbers found: ${duplicates.join(', ')}`);
      console.log();
    }
  } else {
    console.log('✗ ERROR: Base set not found!');
    console.log();
  }

  console.log('─'.repeat(80));
  console.log('PARALLEL SETS ANALYSIS');
  console.log('─'.repeat(80));
  console.log();

  if (parallels.length === 0) {
    console.log('✗ ERROR: No parallel sets found!');
    console.log();
  } else {
    console.log(`Found ${parallels.length} parallel sets`);
    console.log();

    for (const parallel of parallels) {
      console.log(`Set: ${parallel.name}`);
      console.log(`  Slug: ${parallel.slug}`);
      console.log(`  Card Count: ${parallel.cardCount}`);
      console.log(`  isParallel: ${parallel.isParallel}`);
      console.log(`  baseSetSlug: ${parallel.baseSetSlug || 'null'}`);
      console.log(`  printRun: ${parallel.printRun || 'null'}`);

      // Check if baseSetSlug is correct
      if (baseSet && parallel.baseSetSlug !== baseSet.slug) {
        console.log(`  ✗ baseSetSlug mismatch: "${parallel.baseSetSlug}" should be "${baseSet.slug}"`);
      } else if (baseSet) {
        console.log(`  ✓ baseSetSlug correct`);
      }

      // Check card count
      if (parallel.cardCount === 0) {
        console.log(`  ✗ WARNING: Set has 0 cards (should have 46)`);
      } else if (parallel.cardCount === 46) {
        console.log(`  ✓ Card count correct`);
      } else {
        console.log(`  ✗ Card count incorrect: ${parallel.cardCount} (should be 46)`);
      }

      // Check for missing/extra cards
      if (parallel.cardCount > 0) {
        if (parallel.missingNumbers.length > 0) {
          console.log(`  ✗ Missing ${parallel.missingNumbers.length} cards: ${parallel.missingNumbers.slice(0, 10).join(', ')}${parallel.missingNumbers.length > 10 ? '...' : ''}`);
        }
        if (parallel.extraNumbers.length > 0) {
          console.log(`  ✗ Extra ${parallel.extraNumbers.length} cards: ${parallel.extraNumbers.slice(0, 10).join(', ')}${parallel.extraNumbers.length > 10 ? '...' : ''}`);
        }
      }

      console.log();
    }
  }

  console.log('─'.repeat(80));
  console.log('EXPECTED PARALLELS CHECK');
  console.log('─'.repeat(80));
  console.log();

  const foundParallelNames = parallels.map(p => p.name);

  for (const expected of EXPECTED_PARALLELS) {
    const found = parallels.find(p => p.name.includes(expected.name));
    if (found) {
      console.log(`✓ Found: ${expected.name}`);
      if (expected.printRun !== null && found.printRun !== expected.printRun) {
        console.log(`  ✗ Print run mismatch: ${found.printRun} vs ${expected.printRun} expected`);
      } else if (expected.printRun !== null) {
        console.log(`  ✓ Print run correct: ${found.printRun}`);
      }
    } else {
      console.log(`✗ Missing: College ${expected.name} Ticket Variation`);
    }
  }
  console.log();

  console.log('─'.repeat(80));
  console.log('SLUG COLLISION CHECK');
  console.log('─'.repeat(80));
  console.log();

  // Check for potential slug collisions
  // Get all College Ticket sets (non-variation) to see if there's overlap
  const nonVariationSets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      name: { contains: 'College' },
      name: { not: { contains: 'Variation' } },
      slug: { contains: 'college' }
    },
    include: {
      cards: {
        where: {
          cardNumber: { in: OFFICIAL_CARD_NUMBERS.map(n => n.toString()) }
        }
      }
    }
  });

  if (nonVariationSets.length > 0) {
    console.log('Checking for cards in non-variation College sets with card numbers 102-150:');
    console.log();

    for (const set of nonVariationSets) {
      if (set.cards.length > 0) {
        const cardNums = set.cards.map(c => parseInt(c.cardNumber)).sort((a, b) => a - b);
        console.log(`✗ POTENTIAL ISSUE: "${set.name}" has ${set.cards.length} cards in range 102-150:`);
        console.log(`  Slug: ${set.slug}`);
        console.log(`  Card numbers: ${cardNums.join(', ')}`);
        console.log();
      }
    }

    if (nonVariationSets.every(s => s.cards.length === 0)) {
      console.log('✓ No card number conflicts with non-variation sets');
      console.log();
    }
  }

  console.log('─'.repeat(80));
  console.log('SUMMARY & RECOMMENDATIONS');
  console.log('─'.repeat(80));
  console.log();

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Base set issues
  if (!baseSet) {
    issues.push('Base set not found');
    recommendations.push('Create the base "College Ticket Variation" set');
  } else {
    if (baseSet.cardCount !== 46) {
      issues.push(`Base set has ${baseSet.cardCount} cards instead of 46`);
    }
    if (baseSet.missingNumbers.length > 0) {
      issues.push(`Base set missing ${baseSet.missingNumbers.length} cards`);
    }
    if (baseSet.extraNumbers.length > 0) {
      issues.push(`Base set has ${baseSet.extraNumbers.length} unexpected cards`);
    }
  }

  // Parallel issues
  const emptyParallels = parallels.filter(p => p.cardCount === 0);
  if (emptyParallels.length > 0) {
    issues.push(`${emptyParallels.length} parallel sets have 0 cards`);
    recommendations.push('These parallels need to be populated with 46 cards each');
  }

  const wrongCountParallels = parallels.filter(p => p.cardCount > 0 && p.cardCount !== 46);
  if (wrongCountParallels.length > 0) {
    issues.push(`${wrongCountParallels.length} parallel sets have incorrect card counts`);
  }

  const wrongBaseSlugParallels = baseSet
    ? parallels.filter(p => p.baseSetSlug !== baseSet.slug)
    : [];
  if (wrongBaseSlugParallels.length > 0) {
    issues.push(`${wrongBaseSlugParallels.length} parallels have incorrect baseSetSlug`);
    recommendations.push('Update baseSetSlug references to point to the variation base set');
  }

  // Missing parallels
  const missingParallels = EXPECTED_PARALLELS.filter(
    exp => !parallels.some(p => p.name.includes(exp.name))
  );
  if (missingParallels.length > 0) {
    issues.push(`${missingParallels.length} expected parallel sets not found`);
    recommendations.push(`Create missing parallels: ${missingParallels.map(p => p.name).join(', ')}`);
  }

  if (issues.length === 0) {
    console.log('✓ No issues found! All sets match the official checklist.');
  } else {
    console.log('ISSUES FOUND:');
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    console.log();

    if (recommendations.length > 0) {
      console.log('RECOMMENDATIONS:');
      recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
      console.log();
    }

    // Provide specific fix approach
    console.log('SUGGESTED FIX APPROACH:');
    console.log();

    if (baseSet && baseSet.cardCount === 46 && emptyParallels.length > 0) {
      console.log('The base set is correct but parallels are empty. This suggests:');
      console.log('  - Original import created base set correctly');
      console.log('  - Parallel creation may have failed or used wrong slugs');
      console.log('  - Need to populate parallels by duplicating base set cards');
      console.log();
      console.log('Recommended fix:');
      console.log('  1. For each empty parallel set:');
      console.log('     - Copy all 46 cards from base set');
      console.log('     - Update card slugs to include parallel name');
      console.log('     - Set proper print runs on cards');
      console.log('     - Link cards to parallel set');
    } else if (baseSet && baseSet.cardCount < 46 && nonVariationSets.some(s => s.cards.length > 0)) {
      console.log('Cards may have been imported into wrong sets. This suggests:');
      console.log('  - Slug collision between variation and non-variation sets');
      console.log('  - Cards went to non-variation sets instead');
      console.log('  - Need to move cards to correct sets');
      console.log();
      console.log('Recommended fix:');
      console.log('  1. Identify all cards with numbers 102-150 in wrong sets');
      console.log('  2. Move them to appropriate variation sets');
      console.log('  3. Update card slugs to reflect variation designation');
    } else if (!baseSet) {
      console.log('Base set is missing entirely:');
      console.log('  - Need to re-import College Ticket Variation from checklist');
      console.log('  - Ensure proper slug generation (should include "variation")');
    }
  }

  console.log();
  console.log('='.repeat(80));
}

diagnoseCollegeTicketVariation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
