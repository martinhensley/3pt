import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sets = await prisma.set.findMany({
    where: {
      OR: [
        { name: { contains: 'Obsidian', mode: 'insensitive' } },
        {
          parentSet: {
            name: { contains: 'Obsidian', mode: 'insensitive' }
          }
        }
      ]
    },
    include: {
      release: true,
      parentSet: true,
      parallelSets: {
        orderBy: { name: 'asc' }
      },
      _count: {
        select: { cards: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('\n=== Obsidian Sets ===\n');

  for (const set of sets) {
    console.log(`\nSet: ${set.name}`);
    console.log(`  ID: ${set.id}`);
    console.log(`  Slug: ${set.slug}`);
    console.log(`  Print Run: ${set.printRun}`);
    console.log(`  Parent Set ID: ${set.parentSetId}`);
    console.log(`  Card Count: ${set._count.cards}`);

    if (set.parentSet) {
      console.log(`  Parent Set: ${set.parentSet.name}`);
    }

    if (set.parallelSets && set.parallelSets.length > 0) {
      console.log(`  Parallel Sets (${set.parallelSets.length}):`);
      for (const ps of set.parallelSets) {
        console.log(`    - ${ps.name} (/${ps.printRun || '∞'}) - slug: ${ps.slug}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
