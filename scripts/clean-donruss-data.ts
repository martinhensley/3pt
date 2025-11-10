import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanData() {
  const release = await prisma.release.findUnique({
    where: { slug: '2024-25-panini-donruss-soccer' },
  });

  if (!release) {
    console.log('Release not found');
    await prisma.$disconnect();
    return;
  }

  // Delete the Base Optic set and all its cards
  const baseOpticSet = await prisma.set.findUnique({
    where: { slug: 'panini-donruss-soccer-2024-25' },
    include: {
      _count: {
        select: { cards: true }
      }
    }
  });

  if (baseOpticSet) {
    console.log(`Found Base Optic set with ${baseOpticSet._count.cards} cards`);
    console.log('Deleting Base Optic set and all its cards...');

    await prisma.set.delete({
      where: { id: baseOpticSet.id }
    });

    console.log('✅ Deleted Base Optic set and all its cards');
  } else {
    console.log('Base Optic set not found');
  }

  // Check remaining sets
  const remainingSets = await prisma.set.findMany({
    where: { releaseId: release.id },
    include: {
      _count: {
        select: { cards: true }
      }
    }
  });

  console.log(`\nRemaining sets: ${remainingSets.length}`);
  remainingSets.forEach(set => {
    console.log(`  - ${set.name} (${set._count.cards} cards, slug: ${set.slug})`);
  });

  await prisma.$disconnect();
}

cleanData();
