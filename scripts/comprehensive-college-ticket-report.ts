import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function comprehensiveReport() {
  console.log('='.repeat(100));
  console.log('COMPREHENSIVE COLLEGE TICKET DIAGNOSTIC REPORT');
  console.log('='.repeat(100));
  console.log();

  // Get all sets with College Ticket in name or slug
  const sets = await prisma.set.findMany({
    where: {
      OR: [
        { name: { contains: 'College', mode: 'insensitive' } },
      ],
      AND: [
        { name: { contains: 'Ticket', mode: 'insensitive' } },
      ],
      release: {
        slug: '2016-panini-contenders-draft-picks-basketball',
      },
    },
    include: {
      _count: {
        select: {
          cards: true,
        },
      },
      cards: {
        select: {
          cardNumber: true,
        },
        orderBy: {
          cardNumber: 'asc',
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`Total sets found: ${sets.length}`);
  console.log();

  // Categorize sets
  const variation46 = sets.filter(s => s.name.includes('Variation') && s._count.cards === 46);
  const nonVariation74Plus = sets.filter(s => !s.name.includes('Variation') && s._count.cards >= 74);
  const other = sets.filter(s => !variation46.includes(s) && !nonVariation74Plus.includes(s));

  // Expected sets for non-variation (74 cards each)
  const expectedNonVariation = [
    'College Ticket Autographs',
    'College Ticket Autographs Draft Blue Foil',
    'College Ticket Autographs Draft Red Foil',
    'College Ticket Autographs Draft /99',
    'College Ticket Autographs Cracked Ice /23',
    'College Ticket Autographs Playoff /15',
    'College Ticket Autographs Championship 1/1',
    'College Ticket Autographs Printing Plate Black 1/1',
    'College Ticket Autographs Printing Plate Cyan 1/1',
    'College Ticket Autographs Printing Plate Magenta 1/1',
    'College Ticket Autographs Printing Plate Yellow 1/1',
  ];

  // Expected sets for variation (46 cards each)
  const expectedVariation = [
    'College Ticket Variation',
    'College Ticket Variation Draft Blue Foil',
    'College Ticket Variation Draft Red Foil',
    'College Ticket Variation Draft /99',
    'College Ticket Variation Cracked Ice /23',
    'College Ticket Variation Playoff /15',
    'College Ticket Variation Championship 1/1',
    'College Ticket Variation Printing Plate Black 1/1',
    'College Ticket Variation Printing Plate Cyan 1/1',
    'College Ticket Variation Printing Plate Magenta 1/1',
    'College Ticket Variation Printing Plate Yellow 1/1',
  ];

  console.log('═'.repeat(100));
  console.log('FAMILY 1: NON-VARIATION (Expected: 11 sets with ~74 cards each, range 102-184)');
  console.log('═'.repeat(100));
  console.log();
  console.log(`Found: ${nonVariation74Plus.length} sets`);
  console.log();

  if (nonVariation74Plus.length > 0) {
    for (const set of nonVariation74Plus) {
      const cardNumbers = set.cards
        .map(c => c.cardNumber)
        .filter((n): n is string => n !== null)
        .sort((a, b) => parseInt(a) - parseInt(b));
      const range = cardNumbers.length > 0
        ? `${cardNumbers[0]}-${cardNumbers[cardNumbers.length - 1]}`
        : 'No cards';

      console.log(`✓ ${set.name}`);
      console.log(`  Slug: ${set.slug}`);
      console.log(`  Cards: ${set._count.cards}`);
      console.log(`  Range: ${range}`);
      console.log(`  Base Set: ${set.baseSetSlug || 'N/A (is base)'}`);
      console.log();
    }
  }

  console.log('MISSING NON-VARIATION SETS:');
  console.log('-'.repeat(100));
  // Try to match existing sets to expected names
  const foundNames = nonVariation74Plus.map(s => s.name.toLowerCase());
  const missing: string[] = [];

  // Check for base set
  if (!foundNames.some(n => n.includes('college') && n.includes('ticket') && !n.includes('variation') && !n.includes('foil') && !n.includes('cracked') && !n.includes('playoff') && !n.includes('championship') && !n.includes('plate') && !n.includes('draft'))) {
    missing.push('College Ticket Autographs (base set)');
  }

  // Check for Draft /99
  if (!foundNames.some(n => n.includes('draft') && n.includes('ticket') && !n.includes('foil') && !n.includes('variation'))) {
    missing.push('College Ticket Autographs Draft /99');
  }

  // Check for Cracked Ice
  if (!foundNames.some(n => n.includes('cracked') && n.includes('ice') && !n.includes('variation'))) {
    missing.push('College Ticket Autographs Cracked Ice /23');
  }

  // Check for Playoff
  if (!foundNames.some(n => n.includes('playoff') && !n.includes('variation'))) {
    missing.push('College Ticket Autographs Playoff /15');
  }

  // Check for Championship
  if (!foundNames.some(n => n.includes('championship') && !n.includes('variation'))) {
    missing.push('College Ticket Autographs Championship 1/1');
  }

  // Check for Printing Plates
  if (!foundNames.some(n => n.includes('plate') && n.includes('black') && !n.includes('variation'))) {
    missing.push('College Ticket Autographs Printing Plate Black 1/1');
  }
  if (!foundNames.some(n => n.includes('plate') && n.includes('cyan') && !n.includes('variation'))) {
    missing.push('College Ticket Autographs Printing Plate Cyan 1/1');
  }
  if (!foundNames.some(n => n.includes('plate') && n.includes('magenta') && !n.includes('variation'))) {
    missing.push('College Ticket Autographs Printing Plate Magenta 1/1');
  }
  if (!foundNames.some(n => n.includes('plate') && n.includes('yellow') && !n.includes('variation'))) {
    missing.push('College Ticket Autographs Printing Plate Yellow 1/1');
  }

  for (const name of missing) {
    console.log(`  ⚠️  ${name}`);
  }
  console.log();

  console.log('═'.repeat(100));
  console.log('FAMILY 2: VARIATION (Expected: 11 sets with 46 cards each, range 102-150)');
  console.log('═'.repeat(100));
  console.log();
  console.log(`Found: ${variation46.length} sets`);
  console.log();

  if (variation46.length > 0) {
    for (const set of variation46) {
      const cardNumbers = set.cards
        .map(c => c.cardNumber)
        .filter((n): n is string => n !== null)
        .sort((a, b) => parseInt(a) - parseInt(b));
      const range = cardNumbers.length > 0
        ? `${cardNumbers[0]}-${cardNumbers[cardNumbers.length - 1]}`
        : 'No cards';

      console.log(`✓ ${set.name}`);
      console.log(`  Slug: ${set.slug}`);
      console.log(`  Cards: ${set._count.cards}`);
      console.log(`  Range: ${range}`);
      console.log(`  Base Set: ${set.baseSetSlug || 'N/A (is base)'}`);
      console.log();
    }
  }

  console.log('MISSING VARIATION SETS:');
  console.log('-'.repeat(100));
  const foundVariationNames = variation46.map(s => s.name.toLowerCase());
  const missingVariation: string[] = [];

  // Check for base variation (already exists based on earlier output)
  // Check for Draft /99
  if (!foundVariationNames.some(n => n.includes('draft') && n.includes('ticket') && n.includes('variation') && !n.includes('foil'))) {
    missingVariation.push('College Ticket Variation Draft /99');
  }

  for (const name of missingVariation) {
    console.log(`  ⚠️  ${name}`);
  }
  if (missingVariation.length === 0) {
    console.log('  (All expected variation sets found)');
  }
  console.log();

  if (other.length > 0) {
    console.log('═'.repeat(100));
    console.log('OTHER SETS (unexpected card counts):');
    console.log('═'.repeat(100));
    console.log();
    for (const set of other) {
      console.log(`? ${set.name}`);
      console.log(`  Cards: ${set._count.cards}`);
      console.log(`  Slug: ${set.slug}`);
      console.log();
    }
  }

  console.log('═'.repeat(100));
  console.log('SUMMARY');
  console.log('═'.repeat(100));
  console.log();
  console.log(`Non-Variation Family: ${nonVariation74Plus.length}/11 sets (${missing.length} missing)`);
  console.log(`Variation Family: ${variation46.length}/11 sets (${missingVariation.length} missing)`);
  console.log();
  console.log('CRITICAL ISSUES:');
  if (missing.length > 0) {
    console.log(`  ⚠️  ${missing.length} non-variation sets are MISSING`);
    console.log(`      Most critical: College Ticket Autographs base set`);
  }
  if (missingVariation.length > 0) {
    console.log(`  ⚠️  ${missingVariation.length} variation sets are MISSING`);
  }
  if (missing.length === 0 && missingVariation.length === 0) {
    console.log('  ✓ All expected sets are present');
  }
  console.log();
  console.log('═'.repeat(100));
}

comprehensiveReport()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
