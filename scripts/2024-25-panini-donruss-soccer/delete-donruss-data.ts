import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding Donruss Soccer release...');

  const release = await prisma.release.findFirst({
    where: { slug: '2024-25-panini-donruss-soccer' },
    include: {
      sets: {
        include: {
          cards: true,
        },
      },
    },
  });

  if (!release) {
    console.log('Release not found. Nothing to delete.');
    return;
  }

  console.log(`Found release: ${release.name}`);
  console.log(`  Sets: ${release.sets.length}`);

  const totalCards = release.sets.reduce((sum, set) => sum + set.cards.length, 0);
  console.log(`  Cards: ${totalCards}`);

  // Delete all cards first (cascade should handle this, but being explicit)
  console.log('\nDeleting cards...');
  const deletedCards = await prisma.card.deleteMany({
    where: {
      set: {
        releaseId: release.id,
      },
    },
  });
  console.log(`  Deleted ${deletedCards.count} cards`);

  // Delete all sets
  console.log('\nDeleting sets...');
  const deletedSets = await prisma.set.deleteMany({
    where: {
      releaseId: release.id,
    },
  });
  console.log(`  Deleted ${deletedSets.count} sets`);

  console.log('\n✓ Donruss Soccer data deleted successfully!');
  console.log('Note: The release itself was kept, only sets and cards were deleted.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
