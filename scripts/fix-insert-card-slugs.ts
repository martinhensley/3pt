import { prisma } from '../lib/prisma';
import { generateCardSlug } from '../lib/slugGenerator';

/**
 * This script fixes card slugs for insert set parallels.
 * Cards in sets like "Atomic Material Electric Etch Purple" should have
 * "atomic-material" in their slug, not be direct parallels.
 */

async function main() {
  // Find all sets that have a parent set (child sets/parallels)
  const childSets = await prisma.set.findMany({
    where: {
      parentSetId: {
        not: null
      }
    },
    include: {
      parentSet: true,
      release: {
        include: {
          manufacturer: true
        }
      },
      cards: true
    }
  });

  console.log(`Found ${childSets.length} child sets to check\n`);

  let totalCardsUpdated = 0;

  for (const childSet of childSets) {
    if (!childSet.parentSet) continue;

    // Skip if parent set is "Obsidian Base" or contains "Base"
    // These are base set parallels and shouldn't have the parent set name in slugs
    const parentSetName = childSet.parentSet.name;
    if (parentSetName.toLowerCase().includes('base')) {
      console.log(`⏭️  Skipping ${childSet.name} (parent is base set: ${parentSetName})`);
      continue;
    }

    // This is an INSERT SET parallel (like Atomic Material)
    // Cards should have the parent set name in their slug
    console.log(`\n📦 Processing: ${childSet.name}`);
    console.log(`   Parent: ${parentSetName}`);
    console.log(`   Cards: ${childSet.cards.length}`);

    let cardsUpdated = 0;

    for (const card of childSet.cards) {
      if (!card.playerName || !card.cardNumber) continue;

      // Generate new slug WITH parent set name
      const cleanReleaseName = childSet.release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

      // Build slug parts: year + release + PARENT-SET-NAME + cardNumber + player + parallel + printRun
      const parts = [
        childSet.release.year || '',
        cleanReleaseName,
        parentSetName, // THIS is what was missing!
        card.cardNumber,
        card.playerName,
        card.parallelType ? card.parallelType.replace(/\s*\/\s*\d+\s*$/, '') : null, // Remove print run from parallel type
        card.printRun ? card.printRun.toString() : null, // Add print run at the end
      ];

      // Remove empty/null parts and create slug
      const newSlug = parts
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Only update if slug actually changed
      if (newSlug !== card.slug) {
        console.log(`   Updating: ${card.playerName} #${card.cardNumber}`);
        console.log(`     Old: ${card.slug}`);
        console.log(`     New: ${newSlug}`);

        await prisma.card.update({
          where: { id: card.id },
          data: { slug: newSlug }
        });

        cardsUpdated++;
        totalCardsUpdated++;
      }
    }

    console.log(`   ✅ Updated ${cardsUpdated} cards`);
  }

  console.log(`\n✅ Total cards updated: ${totalCardsUpdated}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
