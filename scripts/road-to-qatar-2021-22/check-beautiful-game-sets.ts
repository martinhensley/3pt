import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBeautifulGameSets() {
  const release = await prisma.release.findUnique({
    where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
    include: {
      sets: {
        where: {
          name: {
            contains: 'Beautiful Game'
          }
        },
        include: {
          _count: {
            select: { cards: true }
          }
        },
        orderBy: { name: 'asc' }
      }
    }
  });

  if (!release) {
    console.log('Release not found');
    return;
  }

  console.log('Current Beautiful Game Sets:\n');
  release.sets.forEach(set => {
    const padding = ' '.repeat(Math.max(0, 45 - set.name.length));
    console.log(`${set.name}${padding}${set._count.cards} cards`);
  });

  await prisma.$disconnect();
}

checkBeautifulGameSets();
