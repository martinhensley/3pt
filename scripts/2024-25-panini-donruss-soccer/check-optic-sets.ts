import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOpticSets() {
  try {
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
      include: {
        sets: {
          where: {
            name: { startsWith: 'Optic' },
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
        },
      },
    });

    if (!release) {
      throw new Error('Release not found');
    }

    console.log('\nOptic Sets:');
    console.log('='.repeat(100));

    let parentSets = 0;
    let childSets = 0;

    for (const set of release.sets) {
      const isParent = !set.parentSetId;
      if (isParent) {
        parentSets++;
        console.log(`\n[PARENT] ${set.name}`);
      } else {
        childSets++;
        console.log(`\n[CHILD]  ${set.name}`);
      }
      console.log(`  Slug:       ${set.slug}`);
      console.log(`  Type:       ${set.type}`);
      console.log(`  Parent ID:  ${set.parentSetId || 'None'}`);
      console.log(`  Print Run:  ${set.printRun || 'None'}`);
      console.log(`  Cards:      ${set._count.cards}`);
    }

    console.log('\n' + '='.repeat(100));
    console.log(`Total Optic sets: ${release.sets.length}`);
    console.log(`  Parent sets: ${parentSets}`);
    console.log(`  Child sets:  ${childSets}`);
    console.log('='.repeat(100) + '\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOpticSets();
