import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Update Season Championship Ticket cards to use "1 of 1" format
 *
 * Current: numbered = "/1"
 * Should be: numbered = "1 of 1" (standard format for 1/1 cards)
 */
async function updateNumberedFormat() {
  console.log('=== Updating Season Championship Ticket Numbered Format ===\n');

  const setSlug = '2016-contenders-draft-picks-season-ticket-championship-ticket-parallel-1';

  // Get all cards in this set
  const cards = await prisma.card.findMany({
    where: {
      set: {
        slug: setSlug
      }
    },
    select: {
      id: true,
      cardNumber: true,
      playerName: true,
      numbered: true
    },
    orderBy: { cardNumber: 'asc' }
  });

  console.log(`Found ${cards.length} cards in Season Championship Ticket set`);
  console.log('');

  // Check current format
  const withSlashOne = cards.filter(c => c.numbered === '/1');
  const withOneOfOne = cards.filter(c => c.numbered === '1 of 1');

  console.log('Current numbered field distribution:');
  console.log(`  "/1": ${withSlashOne.length} cards`);
  console.log(`  "1 of 1": ${withOneOfOne.length} cards`);
  console.log('');

  if (withSlashOne.length === 0) {
    console.log('All cards already use "1 of 1" format. No updates needed.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Updating ${withSlashOne.length} cards from "/1" to "1 of 1"...\n`);

  // Update all cards with "/1" to "1 of 1"
  const result = await prisma.card.updateMany({
    where: {
      set: {
        slug: setSlug
      },
      numbered: '/1'
    },
    data: {
      numbered: '1 of 1'
    }
  });

  console.log(`Updated ${result.count} cards\n`);

  // Verify the update
  console.log('=== Verification ===\n');

  const verifyCards = await prisma.card.findMany({
    where: {
      set: {
        slug: setSlug
      }
    },
    select: {
      cardNumber: true,
      playerName: true,
      numbered: true,
      printRun: true
    },
    orderBy: { cardNumber: 'asc' },
    take: 5
  });

  console.log('Sample cards after update:\n');
  for (const card of verifyCards) {
    console.log(`Card #${card.cardNumber}: ${card.playerName}`);
    console.log(`  numbered: "${card.numbered}"`);
    console.log(`  printRun: ${card.printRun}`);
    console.log('');
  }

  // Check final distribution
  const finalCheck = await prisma.card.findMany({
    where: {
      set: {
        slug: setSlug
      }
    },
    select: { numbered: true }
  });

  const finalFormats = new Map<string, number>();
  for (const card of finalCheck) {
    if (card.numbered) {
      finalFormats.set(card.numbered, (finalFormats.get(card.numbered) || 0) + 1);
    }
  }

  console.log('Final distribution:');
  for (const [format, count] of finalFormats.entries()) {
    console.log(`  "${format}": ${count} cards`);
  }

  console.log('\n=== Update Complete ===');

  await prisma.$disconnect();
}

updateNumberedFormat()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  });
