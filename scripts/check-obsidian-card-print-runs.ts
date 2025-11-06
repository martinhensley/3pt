import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Obsidian card print runs...\n');

  // Find Obsidian Base Set
  const baseSet = await prisma.set.findFirst({
    where: {
      name: 'Base Set',
      release: {
        name: { contains: 'Obsidian' },
        year: '2024-25',
      },
    },
    include: {
      cards: {
        take: 5,
        orderBy: { cardNumber: 'asc' },
      },
      release: true,
    },
  });

  if (!baseSet) {
    console.log('Base Set not found');
    return;
  }

  console.log(`Set: ${baseSet.name}`);
  console.log(`Release: ${baseSet.release.year} ${baseSet.release.name}`);
  console.log(`Total Cards: ${baseSet.totalCards}\n`);

  console.log('Sample cards:');
  for (const card of baseSet.cards) {
    console.log(`  #${card.cardNumber} ${card.playerName}`);
    console.log(`    printRun: ${card.printRun}`);
    console.log(`    variant: ${card.variant}`);
    console.log(`    parallelType: ${card.parallelType}`);
    console.log(`    numbered: ${card.numbered}`);
    console.log('---');
  }

  // Count cards by printRun value
  const printRunCounts = await prisma.card.groupBy({
    by: ['printRun'],
    where: {
      setId: baseSet.id,
    },
    _count: true,
  });

  console.log('\nPrint Run Distribution:');
  for (const group of printRunCounts) {
    console.log(`  ${group.printRun === null ? 'null' : group.printRun}: ${group._count} cards`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
