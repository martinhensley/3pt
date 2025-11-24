import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySeasonDraftTicketCards() {
  console.log('=== Verifying Season Draft Ticket Cards ===\n');

  const set = await prisma.set.findUnique({
    where: { slug: '2016-contenders-draft-picks-season-ticket-draft-ticket-parallel-99' },
    include: {
      cards: {
        take: 5,
        orderBy: { cardNumber: 'asc' }
      }
    }
  });

  if (!set) {
    throw new Error('Set not found');
  }

  console.log('Set:', set.name);
  console.log('Slug:', set.slug);
  console.log('Print Run:', set.printRun);
  console.log('Total Cards:', await prisma.card.count({ where: { setId: set.id } }));
  console.log('\nSample cards (first 5):\n');

  for (const card of set.cards) {
    console.log(`Card #${card.cardNumber}: ${card.playerName}`);
    console.log(`  Slug: ${card.slug || 'NULL - NEEDS REGENERATION'}`);
    console.log(`  Print Run: ${card.printRun}`);
    console.log(`  Numbered: ${card.numbered || 'NULL'}`);
    console.log('');
  }

  // Check for cards with null slugs
  const nullSlugs = await prisma.card.count({
    where: {
      setId: set.id,
      slug: null
    }
  });

  if (nullSlugs > 0) {
    console.log(`⚠️  WARNING: ${nullSlugs} cards have null slugs and need regeneration`);
  } else {
    console.log('✓ All cards have valid slugs');
  }

  await prisma.$disconnect();
}

verifySeasonDraftTicketCards()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
