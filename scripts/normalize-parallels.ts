import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function normalizeParallels() {
  console.log('Starting parallel normalization...\n');

  // Get all sets that have parallels
  const sets = await prisma.set.findMany({
    where: {
      parallels: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      parallels: true,
    },
  });

  console.log(`Found ${sets.length} sets with parallels\n`);

  let updatedCount = 0;

  for (const set of sets) {
    if (!Array.isArray(set.parallels)) continue;

    const originalParallels = set.parallels as string[];

    // Normalize /1 to "1 of 1" in each parallel
    const normalizedParallels = originalParallels.map((parallel: string) => {
      const normalized = parallel.replace(/\/1(?=\s+or fewer|$)/g, '1 of 1');
      if (normalized !== parallel) {
        console.log(`  "${parallel}" → "${normalized}"`);
      }
      return normalized;
    });

    // Check if any parallels were changed
    const hasChanges = normalizedParallels.some((p, i) => p !== originalParallels[i]);

    if (hasChanges) {
      console.log(`\nUpdating set: ${set.name}`);

      await prisma.set.update({
        where: { id: set.id },
        data: { parallels: normalizedParallels },
      });

      updatedCount++;
      console.log('✓ Updated\n');
    }
  }

  console.log(`\nNormalization complete!`);
  console.log(`Updated ${updatedCount} set(s)`);
}

normalizeParallels()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
