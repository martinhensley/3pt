import { PrismaClient } from '@prisma/client';
import { generateCardSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function regenerateAllCardSlugs() {
  console.log('Regenerating all card slugs with new logic...\n');

  // Fetch all cards with their relationships
  const cards = await prisma.card.findMany({
    include: {
      set: {
        include: {
          release: {
            include: {
              manufacturer: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${cards.length} cards to process.\n`);

  let updatedCount = 0;
  let unchangedCount = 0;
  const errors: string[] = [];

  for (const card of cards) {
    const oldSlug = card.slug;

    // Generate new slug with updated logic
    // For base cards (parallelType === "Base"), treat variant as null
    const variant = card.parallelType === 'Base' ? null : card.parallelType;

    const newSlug = generateCardSlug(
      card.set.release.manufacturer.name,
      card.set.release.name,
      card.set.release.year || '',
      card.set.name,
      card.cardNumber,
      card.playerName || '',
      variant,
      card.printRun
    );

    // Only update if slug changed
    if (oldSlug !== newSlug) {
      console.log(`📝 Updating card #${card.cardNumber} - ${card.playerName}`);
      console.log(`   Old: ${oldSlug}`);
      console.log(`   New: ${newSlug}`);

      try {
        await prisma.card.update({
          where: { id: card.id },
          data: { slug: newSlug },
        });
        console.log(`   ✅ Updated!\n`);
        updatedCount++;
      } catch (error) {
        const errorMsg = `Failed to update card ${card.id} (${card.playerName}): ${error}`;
        console.log(`   ❌ Error: ${errorMsg}\n`);
        errors.push(errorMsg);
      }
    } else {
      unchangedCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total cards processed: ${cards.length}`);
  console.log(`Cards updated: ${updatedCount}`);
  console.log(`Cards unchanged: ${unchangedCount}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(err => console.log(`  - ${err}`));
  }

  if (updatedCount > 0) {
    console.log('\n✅ All card slugs have been regenerated successfully!');
  } else {
    console.log('\n✅ No cards needed updating - all slugs are correct!');
  }
}

regenerateAllCardSlugs()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
