import { PrismaClient } from '@prisma/client';
import { generateSetSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting to fix slugs containing "checklist"...');

    // Find all sets with "checklist" in their slug
    const setsWithChecklist = await prisma.set.findMany({
      where: {
        slug: {
          contains: 'checklist',
        },
      },
      include: {
        release: true,
        parentSet: true,
      },
    });

    console.log(`Found ${setsWithChecklist.length} sets with "checklist" in slug`);

    for (const set of setsWithChecklist) {
      console.log(`\nProcessing: ${set.name}`);
      console.log(`  Current slug: ${set.slug}`);

      // Strip year from release name if it exists
      const cleanReleaseName = set.release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

      let newSlug: string;

      if (set.parentSetId && set.parentSet) {
        // This is a parallel set
        // First, strip any existing print run from the name
        const nameWithoutPrintRun = set.name.replace(/\s*\/\s*\d+\s*$/, '').trim();

        // Strip parent set name from parallel name if it's at the beginning
        const parentSetName = set.parentSet.name;
        const parallelNameOnly = nameWithoutPrintRun.startsWith(parentSetName)
          ? nameWithoutPrintRun.substring(parentSetName.length).trim()
          : nameWithoutPrintRun;

        const parallelNameWithPrintRun = set.printRun
          ? `${parallelNameOnly} /${set.printRun}`
          : parallelNameOnly;

        newSlug = generateSetSlug(
          set.release.year || '',
          cleanReleaseName,
          set.parentSet.name,
          set.type,
          parallelNameWithPrintRun
        );
      } else {
        // Regular set (non-parallel)
        newSlug = generateSetSlug(
          set.release.year || '',
          cleanReleaseName,
          set.name,
          set.type
        );
      }

      console.log(`  New slug: ${newSlug}`);

      if (newSlug !== set.slug) {
        await prisma.set.update({
          where: { id: set.id },
          data: { slug: newSlug },
        });
        console.log('  ✓ Updated');
      } else {
        console.log('  - No change needed');
      }
    }

    console.log('\n✅ All slugs have been fixed!');
  } catch (error) {
    console.error('Error fixing slugs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
