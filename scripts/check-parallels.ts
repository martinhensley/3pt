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
        year: '2024-25'
      }
    },
    include: {
      release: true,
      cards: {
        select: {
          parallelType: true
        },
        distinct: ['parallelType']
      }
    }
  });

  console.log('Set:', set?.name);
  console.log('Parallels in set.parallels:', set?.parallels);
  console.log('\nDistinct parallelType values in cards:');
  set?.cards.forEach(c => console.log(' -', c.parallelType));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
