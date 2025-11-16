import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSignatureSeries() {
  const release = await prisma.release.findUnique({
    where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
    include: {
      sets: {
        where: {
          name: {
            contains: 'Signature Series'
          }
        },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { cards: true }
          }
        }
      }
    }
  });

  if (!release) {
    console.log('Release not found');
    return;
  }

  console.log('Signature Series Sets:\n');
  release.sets.forEach(set => {
    const printRunStr = set.printRun ? `/${set.printRun}` : 'null';
    console.log(`${set.name}`);
    console.log(`  Type: ${set.type}`);
    console.log(`  Print Run: ${printRunStr}`);
    console.log(`  Cards: ${set._count.cards}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkSignatureSeries();
