import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBeautifulGameSlugs() {
  const release = await prisma.release.findUnique({
    where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
    include: {
      sets: {
        where: {
          name: {
            contains: 'Beautiful Game Autographs'
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

  console.log('Beautiful Game Autographs Sets:\n');
  release.sets.forEach(set => {
    console.log(`Name: ${set.name}`);
    console.log(`Slug: ${set.slug}`);
    console.log(`Type: ${set.type}`);
    console.log(`isParallel: ${set.isParallel}`);
    console.log(`baseSetSlug: ${set.baseSetSlug}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkBeautifulGameSlugs();
