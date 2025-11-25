import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBaseSet() {
  console.log('Checking for potential base set...\n');

  // Check if there's a set with the slug that the parallels reference
  const baseSlug = '2016-contenders-draft-picks-college-draft-ticket';

  const baseSet = await prisma.set.findUnique({
    where: { slug: baseSlug },
    include: {
      _count: {
        select: {
          cards: true,
        },
      },
    },
  });

  if (baseSet) {
    console.log('✓ Found base set referenced by parallels:');
    console.log(`  Name: ${baseSet.name}`);
    console.log(`  Slug: ${baseSet.slug}`);
    console.log(`  Cards: ${baseSet._count.cards}`);
    console.log(`  Is Parallel: ${baseSet.isParallel}`);
    console.log(`  Base Set Slug: ${baseSet.baseSetSlug || 'N/A (is base)'}`);
  } else {
    console.log('⚠️  Base set NOT FOUND');
    console.log(`  Expected slug: ${baseSlug}`);
    console.log('  This is referenced by:');
    console.log('    - College Draft Ticket Blue Foil');
    console.log('    - College Draft Ticket Red Foil');
  }

  console.log();

  // Check all sets that have this as their baseSetSlug
  const parallels = await prisma.set.findMany({
    where: {
      baseSetSlug: baseSlug,
    },
    select: {
      name: true,
      slug: true,
      _count: {
        select: {
          cards: true,
        },
      },
    },
  });

  console.log(`Sets that reference '${baseSlug}' as their base:`);
  for (const parallel of parallels) {
    console.log(`  - ${parallel.name} (${parallel._count.cards} cards)`);
  }
}

checkBaseSet()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
