import { prisma } from '@/lib/prisma';

async function checkParallelSets() {
  try {
    // Find the Obsidian Base set
    const baseSet = await prisma.set.findFirst({
      where: {
        slug: '2024-25-obsidian-soccer-base',
      },
      include: {
        parallelSets: true,
        release: true,
      },
    });

    if (!baseSet) {
      console.log('Base set not found');
      return;
    }

    console.log('\n=== Obsidian Soccer Base Set ===');
    console.log('ID:', baseSet.id);
    console.log('Name:', baseSet.name);
    console.log('Slug:', baseSet.slug);
    console.log('\nParallel Sets in database:');
    console.log('Count:', baseSet.parallelSets.length);

    if (baseSet.parallelSets.length > 0) {
      baseSet.parallelSets.forEach((parallel) => {
        console.log(`  - ${parallel.name} (slug: ${parallel.slug}, printRun: ${parallel.printRun})`);
      });
    } else {
      console.log('  None found - checking card parallels instead...');

      // Get unique parallel types from cards
      const cards = await prisma.card.findMany({
        where: {
          setId: baseSet.id,
          parallelType: {
            not: null,
            notIn: ['Base'],
          },
        },
        select: {
          parallelType: true,
        },
        distinct: ['parallelType'],
      });

      console.log('\nUnique parallel types from cards:');
      console.log('Count:', cards.length);
      cards.forEach((card) => {
        console.log(`  - ${card.parallelType}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkParallelSets();
