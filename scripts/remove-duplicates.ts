import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicates() {
  console.log('Finding duplicate cards...\n');

  // Find all cards grouped by potential duplicates
  const allCards = await prisma.card.findMany({
    include: {
      set: {
        include: {
          release: {
            include: {
              manufacturer: true
            }
          }
        }
      }
    },
    orderBy: [
      { createdAt: 'asc' } // Keep oldest card
    ]
  });

  // Group by setId + cardNumber + parallelType + variant
  const groups = new Map<string, typeof allCards>();
  allCards.forEach(card => {
    const key = `${card.setId}-${card.cardNumber || 'none'}-${card.parallelType || 'base'}-${card.variant || 'none'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(card);
  });

  // Find groups with duplicates
  let totalDuplicates = 0;
  const toDelete: string[] = [];

  groups.forEach((group, key) => {
    if (group.length > 1) {
      const [keep, ...duplicates] = group;
      console.log(`\nDUPLICATE GROUP (${group.length} cards):`);
      console.log(`  Set: ${keep.set.release.year} ${keep.set.release.name} - ${keep.set.name}`);
      console.log(`  Card: #${keep.cardNumber} ${keep.playerName}`);
      console.log(`  Parallel: ${keep.parallelType || 'Base'}`);
      console.log(`  Keeping: ${keep.id} (created ${keep.createdAt})`);
      console.log(`  Deleting ${duplicates.length} duplicates:`);

      duplicates.forEach(dup => {
        console.log(`    - ${dup.id} (created ${dup.createdAt})`);
        toDelete.push(dup.id);
        totalDuplicates++;
      });
    }
  });

  if (toDelete.length === 0) {
    console.log('\nNo duplicates found!');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n\nTotal duplicates to delete: ${totalDuplicates}`);
  console.log('\nDeleting duplicates...\n');

  // Delete in batches
  const batchSize = 100;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    const result = await prisma.card.deleteMany({
      where: {
        id: {
          in: batch
        }
      }
    });
    console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}: ${result.count} cards`);
  }

  console.log(`\n✅ Successfully deleted ${totalDuplicates} duplicate cards!`);

  await prisma.$disconnect();
}

removeDuplicates().catch(console.error);
