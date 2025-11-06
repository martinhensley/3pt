/**
 * Backfill script to generate slugs for existing sets
 *
 * Run with: npx tsx backfill_set_slugs.ts
 */

import { PrismaClient, SetType } from '@prisma/client';
import { generateSetSlug } from './lib/slugGenerator';

const prisma = new PrismaClient();

async function backfillSetSlugs() {
  console.log('Starting set slug backfill...\n');

  try {
    // Fetch all sets with their release information
    const sets = await prisma.set.findMany({
      include: {
        release: true,
      },
    });

    console.log(`Found ${sets.length} sets to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const set of sets) {
      try {
        // Skip if slug already exists and is not null
        if (set.slug && set.slug.trim() !== '') {
          console.log(`⏭️  Skipping "${set.name}" - slug already exists: ${set.slug}`);
          skippedCount++;
          continue;
        }

        // Generate slug
        const slug = generateSetSlug(
          set.release.year || '',
          set.release.name,
          set.name,
          set.type
        );

        // Update the set with the generated slug
        await prisma.set.update({
          where: { id: set.id },
          data: { slug },
        });

        console.log(`✅ Updated "${set.name}" with slug: ${slug}`);
        updatedCount++;
      } catch (error) {
        const errorMsg = `❌ Error processing set "${set.name}": ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('Backfill complete!');
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach(err => console.log(err));
    }
  } catch (error) {
    console.error('Fatal error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillSetSlugs()
  .then(() => {
    console.log('\n✨ Backfill script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Backfill script failed:', error);
    process.exit(1);
  });
