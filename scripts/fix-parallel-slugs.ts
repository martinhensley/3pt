import { PrismaClient } from '@prisma/client';
import { generateSetSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding all parallel sets with potential slug issues...');

  // Get all parallel sets (sets with parentSetId)
  const parallelSets = await prisma.set.findMany({
    where: {
      parentSetId: { not: null },
    },
    include: {
      release: true,
      parentSet: true,
    },
  });

  console.log(`Found ${parallelSets.length} parallel sets`);

  for (const set of parallelSets) {
    if (!set.parentSet) {
      console.log(`Skipping set ${set.name} - no parent set found`);
      continue;
    }

    // Strip any existing print run from the name
    const nameWithoutPrintRun = set.name.replace(/\s*\/\s*\d+\s*$/, '').trim();

    // Strip parent set name from parallel name if it's at the beginning
    const parentSetName = set.parentSet.name;
    const parallelNameOnly = nameWithoutPrintRun.startsWith(parentSetName)
      ? nameWithoutPrintRun.substring(parentSetName.length).trim()
      : nameWithoutPrintRun;

    // Add print run back if it exists
    const parallelNameWithPrintRun = set.printRun
      ? `${parallelNameOnly} /${set.printRun}`
      : parallelNameOnly;

    // Strip year from release name if it exists
    const cleanReleaseName = set.release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

    // Generate new slug
    const newSlug = generateSetSlug(
      set.release.year || '',
      cleanReleaseName,
      set.parentSet.name,
      set.type as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
      parallelNameWithPrintRun
    );

    if (newSlug !== set.slug) {
      console.log(`\nUpdating set: ${set.name}`);
      console.log(`  Old slug: ${set.slug}`);
      console.log(`  New slug: ${newSlug}`);

      await prisma.set.update({
        where: { id: set.id },
        data: { slug: newSlug },
      });

      console.log('  ✓ Updated');
    }
  }

  console.log('\n✓ Done!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
