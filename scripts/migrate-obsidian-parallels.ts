import { PrismaClient } from '@prisma/client';
import { generateSetSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating Obsidian parallels from JSON array to parent-child sets...\n');

  // Find Obsidian Base Set
  const baseSet = await prisma.set.findFirst({
    where: {
      name: 'Base Set',
      release: {
        name: { contains: 'Obsidian' },
        year: '2024-25',
      },
    },
    include: {
      release: true,
    },
  });

  if (!baseSet) {
    console.error('❌ Obsidian Base Set not found');
    return;
  }

  console.log(`✅ Found base set: ${baseSet.name}`);
  console.log(`   Release: ${baseSet.release.year} ${baseSet.release.name}`);
  console.log(`   Slug: ${baseSet.slug}\n`);

  if (!baseSet.parallels || !Array.isArray(baseSet.parallels)) {
    console.log('ℹ️  No parallels array found. Migration may have already been completed.');
    return;
  }

  const parallels = baseSet.parallels as string[];
  console.log(`📋 Found ${parallels.length} parallels in deprecated JSON array\n`);

  // Clean release name (strip year)
  const cleanReleaseName = baseSet.release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

  let created = 0;
  let skipped = 0;

  for (const parallelEntry of parallels) {
    // Parse parallel name and print run
    // Example: "Base Set Checklist Electric Etch Green /5"
    const match = parallelEntry.match(/^(.+?)\s*\/\s*(\d+)\s*$/);

    if (!match) {
      console.log(`⚠️  Skipping invalid parallel format: ${parallelEntry}`);
      skipped++;
      continue;
    }

    const [, parallelNameRaw, printRunStr] = match;
    const printRun = parseInt(printRunStr, 10);

    // Clean the parallel name (remove "Base Set Checklist", etc.)
    const cleanParallelName = parallelNameRaw
      .replace(/\bbase\s+set\s+checklist\b/gi, '')
      .replace(/\bchecklist\b/gi, '')
      .replace(/\bbase\s+set\b/gi, '')
      .trim();

    // Generate full parallel name with print run for display
    const fullParallelName = `${cleanParallelName} /${printRun}`;

    // Generate slug
    const slug = generateSetSlug(
      baseSet.release.year || '',
      cleanReleaseName,
      baseSet.name,
      'Base',
      fullParallelName
    );

    // Check if this parallel set already exists
    const existing = await prisma.set.findUnique({
      where: { slug },
    });

    if (existing) {
      console.log(`⏭️  Skipping (already exists): ${fullParallelName}`);
      skipped++;
      continue;
    }

    // Create parallel set
    try {
      await prisma.set.create({
        data: {
          name: fullParallelName,
          slug,
          type: 'Base',
          releaseId: baseSet.releaseId,
          parentSetId: baseSet.id,
          printRun,
          totalCards: baseSet.totalCards, // Same card count as parent
        },
      });

      console.log(`✅ Created: ${fullParallelName}`);
      console.log(`   Slug: ${slug}`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create ${fullParallelName}:`, error);
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Created: ${created} parallel sets`);
  console.log(`   ⏭️  Skipped: ${skipped} (already exist or invalid)`);

  // Optionally clear the deprecated parallels array
  console.log('\n🧹 Clearing deprecated parallels JSON array...');
  await prisma.set.update({
    where: { id: baseSet.id },
    data: { parallels: null },
  });
  console.log('✅ Cleared deprecated parallels array');

  console.log('\n✨ Migration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
