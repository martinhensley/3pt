import { prisma } from './lib/prisma';

async function updateBaseSets() {
  // Mark sets with "Base" or "Optic" in the name as base sets
  const result = await prisma.set.updateMany({
    where: {
      OR: [
        { name: { contains: 'Base', mode: 'insensitive' } },
        { name: { contains: 'Optic', mode: 'insensitive' } },
        { name: { equals: 'Base' } },
      ]
    },
    data: {
      isBaseSet: true
    }
  });

  console.log(`Updated ${result.count} sets to be marked as base sets`);

  // Show all sets and their isBaseSet status
  const allSets = await prisma.set.findMany({
    select: {
      name: true,
      isBaseSet: true,
      release: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log('\nAll sets:');
  allSets.forEach(set => {
    console.log(`${set.isBaseSet ? '✓' : ' '} ${set.release.name} - ${set.name}`);
  });

  await prisma.$disconnect();
}

updateBaseSets().catch(console.error);
