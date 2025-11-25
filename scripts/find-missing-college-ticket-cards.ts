import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findMissingCards() {
  console.log('='.repeat(80));
  console.log('SEARCHING FOR COLLEGE TICKET CARDS IN 2016 CONTENDERS DRAFT PICKS');
  console.log('='.repeat(80));
  console.log();

  // Get the release
  const release = await prisma.release.findUnique({
    where: { slug: '2016-panini-contenders-draft-picks-basketball' },
    include: {
      sets: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
        },
      },
    },
  });

  if (!release) {
    console.log('ERROR: Could not find 2016 Contenders Draft Picks Basketball release');
    return;
  }

  console.log(`Release: ${release.name} (${release.year})`);
  console.log(`Total sets in release: ${release.sets.length}`);
  console.log();

  // Find all cards in the 102-184 range
  const cardsInRange = await prisma.card.findMany({
    where: {
      set: {
        releaseId: release.id,
      },
      cardNumber: {
        in: Array.from({ length: 83 }, (_, i) => String(102 + i)), // 102-184
      },
    },
    select: {
      id: true,
      cardNumber: true,
      playerName: true,
      variant: true,
      set: {
        select: {
          name: true,
          slug: true,
          type: true,
        },
      },
    },
    orderBy: [
      { cardNumber: 'asc' },
      { set: { name: 'asc' } },
    ],
  });

  console.log(`Cards found in 102-184 range: ${cardsInRange.length}`);
  console.log();

  // Group by set name
  const cardsBySet = new Map<string, typeof cardsInRange>();
  for (const card of cardsInRange) {
    const existing = cardsBySet.get(card.set.name) || [];
    existing.push(card);
    cardsBySet.set(card.set.name, existing);
  }

  console.log('Cards grouped by set:');
  console.log('-'.repeat(80));
  for (const [setName, cards] of cardsBySet.entries()) {
    const cardNumbers = cards.map(c => c.cardNumber).sort((a, b) => {
      return parseInt(a) - parseInt(b);
    });
    const uniqueNumbers = [...new Set(cardNumbers)];
    const range = uniqueNumbers.length > 0
      ? `${uniqueNumbers[0]}-${uniqueNumbers[uniqueNumbers.length - 1]}`
      : 'None';

    console.log();
    console.log(`Set: ${setName}`);
    console.log(`  Cards: ${cards.length}`);
    console.log(`  Unique card numbers: ${uniqueNumbers.length}`);
    console.log(`  Range: ${range}`);
    console.log(`  Card numbers: ${uniqueNumbers.join(', ')}`);
  }
  console.log();
  console.log('='.repeat(80));

  // Check for sets with "Ticket" in the name
  console.log();
  console.log('SETS WITH "TICKET" IN NAME:');
  console.log('-'.repeat(80));
  const ticketSets = release.sets.filter(s => s.name.toLowerCase().includes('ticket'));
  for (const set of ticketSets) {
    console.log(`  ${set.name} (${set.type})`);
    console.log(`    Slug: ${set.slug}`);
  }
  console.log();
  console.log('='.repeat(80));
}

findMissingCards()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
