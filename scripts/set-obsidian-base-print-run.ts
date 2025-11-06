import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Setting Obsidian Base card print runs to /145...\n');

  // Find Obsidian Base set (parent set with name "Obsidian Base")
  const baseSet = await prisma.set.findFirst({
    where: {
      name: 'Obsidian Base',
      type: 'Base',
      parentSetId: null,
      release: {
        name: { contains: 'Obsidian' },
        year: '2024-25',
      },
    },
    include: {
      release: true,
    },
  });

  if (!baseSet) {
    console.error('❌ Obsidian Base set not found');
    return;
  }

  console.log(`✅ Found: ${baseSet.name}`);
  console.log(`   Release: ${baseSet.release.year} ${baseSet.release.name}\n`);

  // Update all cards in this set to have printRun = 145
  const result = await prisma.card.updateMany({
    where: {
      setId: baseSet.id,
      printRun: null, // Only update cards that don't already have a print run
    },
    data: {
      printRun: 145,
    },
  });

  console.log(`✅ Updated ${result.count} cards to printRun = 145\n`);

  // Verify
  const sampleCards = await prisma.card.findMany({
    where: { setId: baseSet.id },
    take: 3,
    orderBy: { cardNumber: 'asc' },
  });

  console.log('Sample cards after update:');
  for (const card of sampleCards) {
    console.log(`  #${card.cardNumber} ${card.playerName} - printRun: ${card.printRun}`);
  }

  console.log('\n✨ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
