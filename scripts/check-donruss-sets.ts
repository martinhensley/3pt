import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSets() {
  const release = await prisma.release.findUnique({
    where: { slug: '2024-25-panini-donruss-soccer' },
  });

  if (!release) {
    console.log('Release not found');
    await prisma.$disconnect();
    return;
  }

  const sets = await prisma.set.findMany({
    where: { releaseId: release.id },
    include: {
      _count: {
        select: { cards: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`Total sets: ${sets.length}\n`);

  // Group by type
  const byType = new Map<string, typeof sets>();
  sets.forEach(set => {
    const type = set.type || 'Unknown';
    if (!byType.has(type)) {
      byType.set(type, []);
    }
    byType.get(type)!.push(set);
  });

  for (const [type, typeSets] of byType) {
    console.log(`\n${type} Sets (${typeSets.length}):`);
    typeSets.forEach(set => {
      console.log(`  - ${set.name} (${set._count.cards} cards)`);
    });
  }

  await prisma.$disconnect();
}

checkSets();
