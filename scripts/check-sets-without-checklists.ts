import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get sets without expectedCardCount (this is what "Sets Without Checklists" actually means)
    const setsWithoutChecklists = await prisma.set.findMany({
      where: {
        expectedCardCount: null
      },
      include: {
        release: true,
        _count: {
          select: { cards: true }
        }
      },
      orderBy: [
        { release: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    console.log(`\nFound ${setsWithoutChecklists.length} sets without expectedCardCount:\n`);

    // Group by release
    const groupedByRelease = setsWithoutChecklists.reduce((acc, set) => {
      const releaseName = set.release.name;
      if (!acc[releaseName]) {
        acc[releaseName] = [];
      }
      acc[releaseName].push(set);
      return acc;
    }, {} as Record<string, typeof setsWithoutChecklists>);

    // Display grouped results
    for (const [releaseName, sets] of Object.entries(groupedByRelease)) {
      console.log(`\n${releaseName} (${sets.length} sets):`);
      sets.forEach(set => {
        const cardCount = set._count.cards;
        console.log(`  - ${set.name} (${cardCount} cards) [${set.slug}]`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
