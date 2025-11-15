import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkKaboom() {
  try {
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
    });

    if (!release) {
      throw new Error('Release not found');
      }

    const kaboomSets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        name: { contains: 'Kaboom', mode: 'insensitive' },
      },
      include: {
        _count: {
          select: { cards: true },
        },
      },
      orderBy: [
        { parentSetId: 'asc' },
        { printRun: 'desc' },
      ],
    });

    console.log('\nKaboom Sets:');
    console.log('='.repeat(100));

    for (const set of kaboomSets) {
      console.log(`\nName: ${set.name}`);
      console.log(`Slug: ${set.slug}`);
      console.log(`Type: ${set.type}`);
      console.log(`Parent Set ID: ${set.parentSetId || 'None (this is a parent)'}`);
      console.log(`Print Run: ${set.printRun || 'None'}`);
      console.log(`Total Cards: ${set.totalCards}`);
      console.log(`Cards in DB: ${set._count.cards}`);
    }

    console.log('\n' + '='.repeat(100));
    console.log(`Total Kaboom sets found: ${kaboomSets.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKaboom();
