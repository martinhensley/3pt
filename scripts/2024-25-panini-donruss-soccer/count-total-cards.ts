import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countCards() {
  try {
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
      include: {
        sets: {
          include: {
            _count: {
              select: { cards: true },
            },
          },
        },
      },
    });

    if (!release) {
      throw new Error('Release not found');
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Release: ${release.name}`);
    console.log(`${'='.repeat(80)}\n`);

    let totalCards = 0;
    let totalSets = 0;
    let parentSets = 0;
    let parallelSets = 0;

    const setsByType = new Map<string, { count: number; cards: number }>();

    for (const set of release.sets) {
      totalSets++;
      const cardCount = set._count.cards;
      totalCards += cardCount;

      if (set.parentSetId) {
        parallelSets++;
      } else {
        parentSets++;
      }

      const type = set.type || 'Other';
      if (!setsByType.has(type)) {
        setsByType.set(type, { count: 0, cards: 0 });
      }
      const typeStats = setsByType.get(type)!;
      typeStats.count++;
      typeStats.cards += cardCount;
    }

    console.log('Sets by Type:');
    console.log('-'.repeat(80));
    for (const [type, stats] of Array.from(setsByType.entries()).sort()) {
      console.log(`  ${type.padEnd(15)} ${String(stats.count).padStart(3)} sets    ${String(stats.cards).padStart(6)} cards`);
    }
    console.log('-'.repeat(80));

    console.log(`\nSummary:`);
    console.log(`  Total Sets:       ${totalSets}`);
    console.log(`  Parent Sets:      ${parentSets}`);
    console.log(`  Parallel Sets:    ${parallelSets}`);
    console.log(`\n  Total Cards:      ${totalCards.toLocaleString()}`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countCards();
