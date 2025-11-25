import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SetInfo {
  name: string;
  slug: string;
  cardCount: number;
  cardNumbers: string[];
  baseSetSlug: string | null;
  isParallel: boolean;
  type: string;
}

async function diagnoseCollegeTicket() {
  console.log('='.repeat(80));
  console.log('COLLEGE TICKET DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log();

  // Query all sets that contain "College" and "Ticket" in their name
  const collegeTicketSets = await prisma.set.findMany({
    where: {
      name: {
        contains: 'College Ticket',
      },
    },
    include: {
      cards: {
        select: {
          cardNumber: true,
        },
        orderBy: {
          cardNumber: 'asc',
        },
      },
      release: {
        select: {
          name: true,
          year: true,
        },
      },
    },
    orderBy: [
      { name: 'asc' },
    ],
  });

  console.log(`Found ${collegeTicketSets.length} sets with "College Ticket" in the name\n`);

  // Analyze each set
  const setInfoList: SetInfo[] = [];

  for (const set of collegeTicketSets) {
    const cardNumbers = set.cards
      .map(c => c.cardNumber)
      .filter((num): num is string => num !== null)
      .sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return numA - numB;
      });

    const info: SetInfo = {
      name: set.name,
      slug: set.slug,
      cardCount: set.cards.length,
      cardNumbers,
      baseSetSlug: set.baseSetSlug,
      isParallel: set.isParallel,
      type: set.type,
    };

    setInfoList.push(info);
  }

  // Group by card count to identify families
  const familyBy74 = setInfoList.filter(s => s.cardCount === 74);
  const familyBy46 = setInfoList.filter(s => s.cardCount === 46);
  const others = setInfoList.filter(s => s.cardCount !== 74 && s.cardCount !== 46);

  console.log('FAMILY ANALYSIS:');
  console.log('-'.repeat(80));
  console.log();

  console.log(`Family 1 (74-card sets): ${familyBy74.length} sets found`);
  if (familyBy74.length > 0) {
    console.log('  Expected: 11 sets (1 base + 10 parallels)');
    console.log();
    for (const set of familyBy74) {
      const cardRange = set.cardNumbers.length > 0
        ? `${set.cardNumbers[0]}-${set.cardNumbers[set.cardNumbers.length - 1]}`
        : 'No cards';
      console.log(`  ✓ ${set.name}`);
      console.log(`    Slug: ${set.slug}`);
      console.log(`    Cards: ${set.cardCount}`);
      console.log(`    Range: ${cardRange}`);
      console.log(`    Base Set: ${set.baseSetSlug || 'N/A (is base)'}`);
      console.log(`    Is Parallel: ${set.isParallel}`);
      console.log();
    }
  } else {
    console.log('  ⚠️  WARNING: No 74-card College Ticket sets found!');
    console.log('  Expected: College Ticket Autographs with 74 cards (102-184)');
    console.log();
  }

  console.log(`Family 2 (46-card sets): ${familyBy46.length} sets found`);
  if (familyBy46.length > 0) {
    console.log('  Expected: 11 sets (1 base + 10 parallels)');
    console.log();
    for (const set of familyBy46) {
      const cardRange = set.cardNumbers.length > 0
        ? `${set.cardNumbers[0]}-${set.cardNumbers[set.cardNumbers.length - 1]}`
        : 'No cards';
      console.log(`  ✓ ${set.name}`);
      console.log(`    Slug: ${set.slug}`);
      console.log(`    Cards: ${set.cardCount}`);
      console.log(`    Range: ${cardRange}`);
      console.log(`    Base Set: ${set.baseSetSlug || 'N/A (is base)'}`);
      console.log(`    Is Parallel: ${set.isParallel}`);
      console.log();
    }
  } else {
    console.log('  ⚠️  WARNING: No 46-card College Ticket sets found!');
    console.log();
  }

  if (others.length > 0) {
    console.log(`Other card counts: ${others.length} sets`);
    console.log();
    for (const set of others) {
      console.log(`  ? ${set.name}`);
      console.log(`    Cards: ${set.cardCount}`);
      console.log();
    }
  }

  // Check for orphaned cards
  console.log('ORPHANED CARD CHECK:');
  console.log('-'.repeat(80));
  console.log();

  // Find cards in 102-184 range that belong to sets NOT in our list
  const allCollegeTicketCardNumbers = await prisma.card.findMany({
    where: {
      cardNumber: {
        gte: '102',
        lte: '184',
      },
      set: {
        release: {
          slug: '2024-panini-donruss-soccer',
        },
      },
    },
    select: {
      id: true,
      cardNumber: true,
      playerName: true,
      set: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      cardNumber: 'asc',
    },
  });

  // Filter to only cards that belong to sets with "College Ticket" in name
  const collegeTicketCards = allCollegeTicketCardNumbers.filter(c =>
    c.set.name.includes('College Ticket')
  );

  console.log(`Total cards in 102-184 range with "College Ticket" in set name: ${collegeTicketCards.length}`);
  console.log();

  // Group by card number to see which numbers exist
  const cardNumberCounts = new Map<string, number>();
  for (const card of collegeTicketCards) {
    const count = cardNumberCounts.get(card.cardNumber) || 0;
    cardNumberCounts.set(card.cardNumber, count + 1);
  }

  console.log('Card number distribution:');
  const sortedNumbers = Array.from(cardNumberCounts.entries()).sort((a, b) =>
    parseInt(a[0]) - parseInt(b[0])
  );

  for (const [cardNum, count] of sortedNumbers) {
    console.log(`  Card ${cardNum}: ${count} instances`);
  }
  console.log();

  // RECOMMENDATIONS
  console.log('RECOMMENDATIONS:');
  console.log('-'.repeat(80));
  console.log();

  if (familyBy74.length === 0) {
    console.log('⚠️  CRITICAL: College Ticket (non-variation) family is MISSING');
    console.log('    Required: 11 sets with 74 cards each (102-184, gaps at 126, 145, 147, 155, 170, 174, 175, 177)');
    console.log('    Action: Need to restore from source data or recreate');
    console.log();
  } else if (familyBy74.length < 11) {
    console.log(`⚠️  WARNING: College Ticket (non-variation) family is INCOMPLETE`);
    console.log(`    Found: ${familyBy74.length} sets`);
    console.log(`    Expected: 11 sets`);
    console.log(`    Missing: ${11 - familyBy74.length} sets`);
    console.log();
  } else {
    console.log('✓ College Ticket (non-variation) family complete: 11 sets');
    console.log();
  }

  if (familyBy46.length === 0) {
    console.log('⚠️  WARNING: College Ticket Variation family is MISSING');
    console.log('    Required: 11 sets with 46 cards each (102-150, gaps at 126, 145, 147)');
    console.log();
  } else if (familyBy46.length < 11) {
    console.log(`⚠️  WARNING: College Ticket Variation family is INCOMPLETE`);
    console.log(`    Found: ${familyBy46.length} sets`);
    console.log(`    Expected: 11 sets`);
    console.log(`    Missing: ${11 - familyBy46.length} sets`);
    console.log();
  } else {
    console.log('✓ College Ticket Variation family complete: 11 sets');
    console.log();
  }

  console.log('='.repeat(80));
}

diagnoseCollegeTicket()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
