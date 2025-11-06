import { PrismaClient } from '@prisma/client';
import { generateSetSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Fixing Obsidian parallel set slugs...\n');

  // Find Obsidian release
  const release = await prisma.release.findFirst({
    where: {
      name: { contains: 'Obsidian' },
      year: '2024-25',
    },
  });

  if (!release) {
    console.error('❌ Obsidian release not found');
    return;
  }

  // Find all parallel sets (sets with parentSetId)
  const parallelSets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      parentSetId: { not: null },
    },
    include: {
      parentSet: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${parallelSets.length} parallel sets to update\n`);

  // Clean release name (strip year)
  const cleanReleaseName = release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

  let updated = 0;
  let skipped = 0;

  for (const set of parallelSets) {
    // Generate new slug with updated logic
    const newSlug = generateSetSlug(
      release.year || '',
      cleanReleaseName,
      set.parentSet!.name,
      set.type as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
      set.name // Full parallel name with print run
    );

    if (set.slug === newSlug) {
      console.log(`⏭️  ${set.name}: Already correct (${set.slug})`);
      skipped++;
      continue;
    }

    console.log(`🔧 ${set.name}`);
    console.log(`   Old: ${set.slug}`);
    console.log(`   New: ${newSlug}`);

    // Update the slug
    await prisma.set.update({
      where: { id: set.id },
      data: { slug: newSlug },
    });

    updated++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped} (already correct)`);
  console.log('\n✨ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
