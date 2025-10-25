import { prisma } from '../lib/prisma';

async function main() {
  // Find the Optic set
  const set = await prisma.set.findFirst({
    where: {
      name: {
        contains: 'Optic',
        mode: 'insensitive'
      },
      release: {
        year: '2024-25',
        name: {
          contains: 'Donruss',
          mode: 'insensitive'
        }
      }
    },
    include: {
      release: true,
      _count: {
        select: { cards: true }
      }
    }
  });

  console.log('Set ID:', set?.id);
  console.log('Set name:', set?.name);
  console.log('Release:', set?.release.name);
  console.log('Total cards in set:', set?._count.cards);

  // Count cards by setId
  const cardCount = await prisma.card.count({
    where: { setId: set?.id }
  });
  
  console.log('Cards with setId:', cardCount);

  // Get all sets in this release
  const allSets = await prisma.set.findMany({
    where: {
      releaseId: set?.release.id
    },
    include: {
      _count: {
        select: { cards: true }
      }
    }
  });

  console.log('\nAll sets in release:');
  allSets.forEach(s => {
    console.log(`  - ${s.name}: ${s._count.cards} cards`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
