import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking all parallel set slugs across releases...\n');

  // Find all parallel sets (sets with parentSetId)
  const parallelSets = await prisma.set.findMany({
    where: {
      parentSetId: { not: null },
    },
    include: {
      release: true,
      parentSet: true,
    },
    orderBy: [
      { release: { year: 'desc' } },
      { release: { name: 'asc' } },
      { name: 'asc' },
    ],
  });

  if (parallelSets.length === 0) {
    console.log('ℹ️  No parallel sets found');
    return;
  }

  console.log(`Found ${parallelSets.length} parallel sets\n`);

  // Group by release
  const byRelease = new Map<string, typeof parallelSets>();
  for (const set of parallelSets) {
    const key = `${set.release.year} ${set.release.name}`;
    if (!byRelease.has(key)) {
      byRelease.set(key, []);
    }
    byRelease.get(key)!.push(set);
  }

  for (const [releaseName, sets] of byRelease) {
    console.log(`\n📦 ${releaseName} (${sets.length} parallels)`);
    console.log('─'.repeat(60));

    for (const set of sets.slice(0, 3)) {
      console.log(`  ${set.name}`);
      console.log(`    Slug: ${set.slug}`);
      console.log(`    Parent: ${set.parentSet?.name}`);
      console.log(`    Type: ${set.type}`);
    }

    if (sets.length > 3) {
      console.log(`  ... and ${sets.length - 3} more`);
    }
  }

  console.log('\n✅ All parallel sets listed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
