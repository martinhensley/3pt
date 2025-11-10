import { PrismaClient } from '@prisma/client';
import { generateSetSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function debugSlugs() {
  // Check what we expect vs what exists
  const expectedSlugs = [
    'Animation',
    'Base',
    'Base Optic',
    'Beautiful Game Autographs',
    'Craftsmen',
    'Rated Rookies',
    // Add a few parallels
    'Base Black',
    'Base Gold',
    'Craftsmen Gold',
  ];

  console.log('Expected slugs vs Actual:\n');

  for (const setName of expectedSlugs) {
    const expectedSlug = generateSetSlug('Panini', 'Donruss Soccer', '2024-25', setName);

    const set = await prisma.set.findUnique({
      where: { slug: expectedSlug },
    });

    console.log(`${setName}:`);
    console.log(`  Expected slug: ${expectedSlug}`);
    console.log(`  Exists: ${set ? 'YES' : 'NO'}`);
    if (set) {
      console.log(`  Set ID: ${set.id}, Name: ${set.name}`);
    }
    console.log();
  }

  // Also show ALL sets for this release
  const release = await prisma.release.findUnique({
    where: { slug: '2024-25-panini-donruss-soccer' },
  });

  if (release) {
    const allSets = await prisma.set.findMany({
      where: { releaseId: release.id },
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    });

    console.log(`\n\nAll sets in database for this release (${allSets.length} total):\n`);
    allSets.forEach(set => {
      console.log(`  - ${set.name} (slug: ${set.slug})`);
    });
  }

  await prisma.$disconnect();
}

debugSlugs();
