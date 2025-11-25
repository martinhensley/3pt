import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix all Championship Ticket sets that have incorrect print run
 *
 * These sets should all be 1/1 (printRun: 1, numbered: "1 of 1")
 * but currently have printRun: 299 in the Set record
 */
async function fixAllChampionshipTickets() {
  console.log('=== Fixing All Championship Ticket Sets ===\n');

  // Find all Championship Ticket sets with printRun 299
  const sets = await prisma.set.findMany({
    where: {
      release: {
        slug: '2016-panini-contenders-draft-picks-basketball'
      },
      name: {
        contains: 'Championship Ticket'
      },
      printRun: 299
    },
    include: {
      _count: {
        select: { cards: true }
      }
    }
  });

  console.log(`Found ${sets.length} Championship Ticket sets with printRun: 299\n`);

  if (sets.length === 0) {
    console.log('No sets need fixing!');
    await prisma.$disconnect();
    return;
  }

  for (const set of sets) {
    console.log(`Processing: ${set.name}`);
    console.log(`  Current slug: ${set.slug}`);
    console.log(`  Card count: ${set._count.cards}`);

    if (set._count.cards === 0) {
      console.log('  Skipping - no cards in set\n');
      continue;
    }

    // Update set
    const newSlug = set.slug.replace(/-299$/, '-1');
    console.log(`  New slug: ${newSlug}`);

    await prisma.set.update({
      where: { id: set.id },
      data: {
        printRun: 1,
        slug: newSlug
      }
    });

    console.log('  ✓ Set updated');

    // Update all cards in this set
    const cardUpdateResult = await prisma.card.updateMany({
      where: {
        setId: set.id,
        numbered: '/1'
      },
      data: {
        numbered: '1 of 1'
      }
    });

    console.log(`  ✓ Updated ${cardUpdateResult.count} cards to "1 of 1"\n`);
  }

  // Final verification
  console.log('=== Final Verification ===\n');

  const verifySet = await prisma.set.findMany({
    where: {
      release: {
        slug: '2016-panini-contenders-draft-picks-basketball'
      },
      name: {
        contains: 'Championship Ticket'
      }
    },
    include: {
      cards: {
        take: 2,
        orderBy: { cardNumber: 'asc' }
      },
      _count: {
        select: { cards: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  for (const set of verifySet) {
    const status = set.printRun === 1 ? '✓' : '✗';
    console.log(`${status} ${set.name}`);
    console.log(`   Print Run: ${set.printRun}`);
    console.log(`   Slug: ${set.slug}`);
    console.log(`   Cards: ${set._count.cards}`);

    if (set.cards.length > 0) {
      const sample = set.cards[0];
      console.log(`   Sample: #${sample.cardNumber} ${sample.playerName} - "${sample.numbered}"`);
    }
    console.log('');
  }

  console.log('=== Complete ===');

  await prisma.$disconnect();
}

fixAllChampionshipTickets()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  });
