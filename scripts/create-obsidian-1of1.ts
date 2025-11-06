import { PrismaClient } from '@prisma/client';
import { generateSetSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Creating Obsidian 1 of 1 parallel set...\n');

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

  // Clean release name (strip year)
  const cleanReleaseName = baseSet.release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

  // Create the 1 of 1 parallel
  const parallelName = 'Electric Etch Blue Finite';
  const printRun = 1;
  const fullParallelName = `${parallelName} 1 of 1`; // Use "1 of 1" for display

  // Generate slug (will convert "1 of 1" to "1-of-1")
  const slug = generateSetSlug(
    baseSet.release.year || '',
    cleanReleaseName,
    baseSet.name,
    'Base',
    fullParallelName
  );

  console.log(`Creating: ${fullParallelName}`);
  console.log(`Slug: ${slug}`);

  // Check if already exists
  const existing = await prisma.set.findUnique({
    where: { slug },
  });

  if (existing) {
    console.log('⏭️  Already exists, skipping');
    return;
  }

  // Create parallel set
  await prisma.set.create({
    data: {
      name: fullParallelName,
      slug,
      type: 'Base',
      releaseId: baseSet.releaseId,
      parentSetId: baseSet.id,
      printRun,
      totalCards: baseSet.totalCards,
    },
  });

  console.log('✅ Created successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
