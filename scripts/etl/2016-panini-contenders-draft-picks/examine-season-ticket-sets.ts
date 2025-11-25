import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function examineSeasonTicketSets() {
  const release = await prisma.release.findUnique({
    where: { slug: '2016-panini-contenders-draft-picks-basketball' },
    include: {
      sets: {
        where: {
          OR: [
            { name: { contains: 'Season' } },
            { slug: { contains: 'season' } }
          ]
        },
        orderBy: { name: 'asc' }
      }
    }
  });

  if (!release) {
    console.log('Release not found');
    return;
  }

  console.log('=== Season Ticket Related Sets ===\n');
  console.log(`Found ${release.sets.length} sets\n`);

  for (const set of release.sets) {
    console.log('Name:', set.name);
    console.log('Slug:', set.slug);
    console.log('Type:', set.type);
    console.log('isParallel:', set.isParallel);
    console.log('baseSetSlug:', set.baseSetSlug || 'null');
    console.log('printRun:', set.printRun || 'null');

    // Count cards in this set
    const cardCount = await prisma.card.count({
      where: { setId: set.id }
    });
    console.log('Card Count:', cardCount);
    console.log('---\n');
  }

  await prisma.$disconnect();
}

examineSeasonTicketSets()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
