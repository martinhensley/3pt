import { PrismaClient } from '@prisma/client';
import { generateCardSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function updateCardSlugsWithPrintRun() {
  console.log('Updating card slugs to include print run...\n');

  // Find all cards in the Dual Jersey Ink set
  const cards = await prisma.card.findMany({
    where: {
      set: {
        name: 'Dual Jersey Ink',
        release: {
          slug: '2024-25-panini-obsidian-soccer',
        },
      },
    },
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

  console.log(`Found ${cards.length} cards to update\n`);

  let updatedCount = 0;

  for (const card of cards) {
    const oldSlug = card.slug;

    // Generate new slug with print run
    const newSlug = generateCardSlug(
      card.set.release.manufacturer.name,
      card.set.release.name,
      card.set.release.year || '',
      card.set.name,
      card.cardNumber || '',
      card.playerName || '',
      card.parallelType,
      card.printRun
    );

    if (oldSlug !== newSlug) {
      await prisma.card.update({
        where: { id: card.id },
        data: { slug: newSlug },
      });

      console.log(`✓ Updated: ${card.playerName} #${card.cardNumber}`);
      console.log(`  Old: ${oldSlug}`);
      console.log(`  New: ${newSlug}\n`);
      updatedCount++;
    } else {
      console.log(`- Skipped: ${card.playerName} #${card.cardNumber} (no change)`);
    }
  }

  console.log(`\n✅ Updated ${updatedCount} card slugs`);
}

updateCardSlugsWithPrintRun()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
