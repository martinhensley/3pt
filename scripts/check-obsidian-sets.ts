import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find Obsidian release
  const release = await prisma.release.findFirst({
    where: {
      name: { contains: 'Obsidian' },
      year: '2024-25',
    },
    include: {
      sets: {
        include: {
          parentSet: true,
          parallelSets: {
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!release) {
    console.log('Release not found');
    return;
  }

  console.log(`\nRelease: ${release.year} ${release.name}`);
  console.log(`Slug: ${release.slug}\n`);

  // Group sets by parent/child
  const parentSets = release.sets.filter(s => !s.parentSetId);
  const childSets = release.sets.filter(s => s.parentSetId);

  console.log(`Parent Sets: ${parentSets.length}`);
  console.log(`Child Parallel Sets: ${childSets.length}\n`);

  console.log('=== PARENT SETS ===\n');
  for (const set of parentSets) {
    console.log(`Name: ${set.name}`);
    console.log(`Slug: ${set.slug}`);
    console.log(`Type: ${set.type}`);
    console.log(`Parallels: ${set.parallelSets.length}`);

    if (set.parallelSets.length > 0) {
      console.log('  Child Parallels:');
      for (const parallel of set.parallelSets.slice(0, 3)) {
        console.log(`    - ${parallel.name} (slug: ${parallel.slug}, printRun: ${parallel.printRun})`);
      }
      if (set.parallelSets.length > 3) {
        console.log(`    ... and ${set.parallelSets.length - 3} more`);
      }
    }
    console.log('---\n');
  }

  // Show first few child sets
  console.log('\n=== SAMPLE CHILD PARALLEL SETS ===\n');
  for (const set of childSets.slice(0, 5)) {
    console.log(`Name: ${set.name}`);
    console.log(`Slug: ${set.slug}`);
    console.log(`Type: ${set.type}`);
    console.log(`Print Run: ${set.printRun}`);
    console.log(`Parent: ${set.parentSet?.name}`);
    console.log('---\n');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
