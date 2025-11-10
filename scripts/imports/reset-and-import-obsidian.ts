/**
 * Reset Obsidian release and import from Excel
 */

import { prisma } from '../lib/prisma';

const RELEASE_SLUG = '2024-25-panini-obsidian-soccer';

async function main() {
  console.log('🧹 Finding Obsidian release...\n');

  const release = await prisma.release.findUnique({
    where: { slug: RELEASE_SLUG },
    include: { sets: { include: { cards: true } } },
  });

  if (!release) {
    console.log('❌ Release not found with slug:', RELEASE_SLUG);
    console.log('\nAvailable releases:');
    const releases = await prisma.release.findMany({
      select: { slug: true, name: true },
    });
    releases.forEach(r => console.log(`  - ${r.slug} (${r.name})`));
    process.exit(1);
  }

  console.log(`Found: ${release.name}`);
  console.log(`Current sets: ${release.sets.length}`);
  const totalCards = release.sets.reduce((sum, set) => sum + set.cards.length, 0);
  console.log(`Total cards: ${totalCards}\n`);

  if (release.sets.length > 0) {
    console.log('🗑️  Deleting all sets and cards...');

    // Delete all cards first (cascade should handle this, but being explicit)
    for (const set of release.sets) {
      await prisma.card.deleteMany({
        where: { setId: set.id },
      });
    }

    // Delete all sets
    await prisma.set.deleteMany({
      where: { releaseId: release.id },
    });

    console.log('✅ Deleted all sets and cards\n');
  }

  console.log('✅ Ready for import!\n');
  console.log('Now run: npx tsx scripts/import-obsidian-from-excel.ts');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
