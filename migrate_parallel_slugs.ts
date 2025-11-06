import { PrismaClient } from '@prisma/client';
import { generateSetSlug } from './lib/slugGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating parallel set slugs to include print runs...\n');

  // Find all parallel sets (sets with parentSetId)
  const parallelSets = await prisma.set.findMany({
    where: {
      parentSetId: { not: null },
    },
    include: {
      release: {
        include: {
          manufacturer: true,
        },
      },
      parentSet: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${parallelSets.length} parallel sets to update\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const set of parallelSets) {
    if (!set.parentSet) {
      console.log(`⚠️  Skipping ${set.name}: No parent set found`);
      skippedCount++;
      continue;
    }

    // Strip year from release name
    const cleanReleaseName = set.release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

    // Build parallel name with print run
    const parallelNameWithPrintRun = set.printRun
      ? `${set.name} /${set.printRun}`
      : set.name;

    // Generate new slug
    const newSlug = generateSetSlug(
      set.release.year || '',
      cleanReleaseName,
      set.parentSet.name,
      set.type,
      parallelNameWithPrintRun
    );

    // Check if slug changed
    if (newSlug === set.slug) {
      console.log(`✓ ${set.name} (/${set.printRun || '∞'}): Already has correct slug`);
      skippedCount++;
      continue;
    }

    console.log(`🔄 Updating ${set.name} (/${set.printRun || '∞'}):`);
    console.log(`   Old: ${set.slug}`);
    console.log(`   New: ${newSlug}`);

    try {
      await prisma.set.update({
        where: { id: set.id },
        data: { slug: newSlug },
      });
      console.log(`   ✅ Updated successfully\n`);
      updatedCount++;
    } catch (error) {
      console.error(`   ❌ Failed to update:`, error);
      console.log();
    }
  }

  console.log('─'.repeat(60));
  console.log(`\n✨ Migration complete!`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total:   ${parallelSets.length}\n`);
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
