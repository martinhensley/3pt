import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Obsidian card print runs...\n');

  // Find Obsidian release and all its sets
  const release = await prisma.release.findFirst({
    where: {
      name: { contains: 'Obsidian' },
      year: '2024-25',
    },
    include: {
      sets: {
        where: {
          parentSetId: null, // Only parent sets
        },
        include: {
          cards: {
            take: 3,
            orderBy: { cardNumber: 'asc' },
          },
        },
      },
    },
  });

  if (!release) {
    console.log('Release not found');
    return;
  }

  console.log(`Release: ${release.year} ${release.name}\n`);

  for (const set of release.sets) {
    console.log(`\n=== ${set.name} (${set.type}) ===`);
    console.log(`Total Cards: ${set.totalCards}`);
    console.log(`Set Print Run: ${set.printRun}`);

    if (set.cards.length > 0) {
      console.log('\nSample cards:');
      for (const card of set.cards) {
        console.log(`  #${card.cardNumber} ${card.playerName}`);
        console.log(`    Card printRun: ${card.printRun}`);
        console.log(`    variant: ${card.variant}`);
        console.log(`    parallelType: ${card.parallelType}`);
      }
    }

    // Count total cards
    const totalCards = await prisma.card.count({
      where: { setId: set.id },
    });
    console.log(`\nTotal cards in database: ${totalCards}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
