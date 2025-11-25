/**
 * Analyze College Ticket Variation Sets
 * Identify which release and what the current state is
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyze() {
  console.log('='.repeat(80));
  console.log('ANALYZING COLLEGE TICKET VARIATION SETS');
  console.log('='.repeat(80));
  console.log();

  // Find all sets with "college" and "ticket" and "variation" in the slug
  const sets = await prisma.set.findMany({
    where: {
      slug: {
        contains: 'college-ticket'
      }
    },
    include: {
      release: {
        select: {
          name: true,
          slug: true
        }
      },
      _count: {
        select: { cards: true }
      }
    },
    orderBy: {
      slug: 'asc'
    }
  });

  console.log(`Found ${sets.length} College Ticket related sets\n`);

  // Group by release
  const byRelease = new Map<string, typeof sets>();
  sets.forEach(set => {
    const releaseSlug = set.release.slug;
    if (!byRelease.has(releaseSlug)) {
      byRelease.set(releaseSlug, []);
    }
    byRelease.get(releaseSlug)!.push(set);
  });

  for (const [releaseSlug, releaseSets] of byRelease) {
    console.log('='.repeat(80));
    console.log(`Release: ${releaseSets[0].release.name}`);
    console.log(`Slug: ${releaseSlug}`);
    console.log('='.repeat(80));
    console.log();

    for (const set of releaseSets) {
      const isVariation = set.slug.includes('variation');
      const status = set._count.cards === 46 ? '✓' : set._count.cards === 0 ? '○' : '✗';

      console.log(`${status} ${set.name}`);
      console.log(`   Cards: ${set._count.cards}`);
      console.log(`   Slug: ${set.slug}`);
      console.log(`   Type: ${set.type}`);
      console.log(`   Is Parallel: ${set.isParallel}`);
      console.log(`   Base Set Slug: ${set.baseSetSlug || 'N/A'}`);
      console.log();
    }
  }

  // Now get detailed card information for sets with wrong counts
  console.log('='.repeat(80));
  console.log('DETAILED ANALYSIS OF SETS WITH WRONG COUNTS');
  console.log('='.repeat(80));
  console.log();

  const wrongCountSets = sets.filter(s => s._count.cards !== 46 && s._count.cards !== 0);

  for (const set of wrongCountSets) {
    console.log(`Set: ${set.name} (${set._count.cards} cards)`);
    console.log(`Slug: ${set.slug}`);
    console.log();

    // Get all cards in this set
    const cards = await prisma.card.findMany({
      where: { setId: set.id },
      select: {
        cardNumber: true,
        playerName: true
      },
      orderBy: { cardNumber: 'asc' }
    });

    // Analyze card numbers
    const cardNumbers = cards.map(c => c.cardNumber).filter(Boolean);
    const numericCards = cardNumbers.filter(n => !isNaN(parseInt(n!)));

    if (numericCards.length > 0) {
      const min = Math.min(...numericCards.map(n => parseInt(n!)));
      const max = Math.max(...numericCards.map(n => parseInt(n!)));
      console.log(`  Card number range: ${min} - ${max}`);
    }

    // Count cards in different ranges
    const below102 = cardNumbers.filter(n => parseInt(n!) < 102);
    const range102to150 = cardNumbers.filter(n => {
      const num = parseInt(n!);
      return num >= 102 && num <= 150;
    });
    const above150 = cardNumbers.filter(n => parseInt(n!) > 150);

    console.log(`  Cards below 102: ${below102.length}`);
    console.log(`  Cards 102-150: ${range102to150.length}`);
    console.log(`  Cards above 150: ${above150.length}`);

    if (below102.length > 0 && below102.length <= 10) {
      console.log(`  Below 102 numbers: ${below102.join(', ')}`);
    }
    if (above150.length > 0 && above150.length <= 10) {
      console.log(`  Above 150 numbers: ${above150.join(', ')}`);
    }

    console.log();
  }

  await prisma.$disconnect();
}

analyze();
