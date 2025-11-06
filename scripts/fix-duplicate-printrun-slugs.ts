import { PrismaClient } from '@prisma/client';
import { generateCardSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function fixDuplicatePrintRunSlugs() {
  console.log('Finding cards with duplicate print runs in slugs...\n');

  // Find all cards with print runs
  const cards = await prisma.card.findMany({
    where: {
      printRun: { not: null },
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

  console.log(`Found ${cards.length} cards with print runs.\n`);

  let fixedCount = 0;
  const errors: string[] = [];

  for (const card of cards) {
    const oldSlug = card.slug;

    // Generate the correct slug
    const newSlug = generateCardSlug(
      card.set.release.manufacturer.name,
      card.set.release.name,
      card.set.release.year || '',
      card.set.name,
      card.cardNumber,
      card.playerName || '',
      card.parallelType,
      card.printRun
    );

    // Check if the slug has a duplicate print run pattern
    // Pattern: ends with "-{number}-{number}" where both numbers are the same
    const printRun = card.printRun?.toString();
    if (printRun && oldSlug.endsWith(`-${printRun}-${printRun}`)) {
      console.log(`❌ DUPLICATE FOUND:`);
      console.log(`   Old slug: ${oldSlug}`);
      console.log(`   New slug: ${newSlug}`);
      console.log(`   Print run: ${printRun}`);

      try {
        await prisma.card.update({
          where: { id: card.id },
          data: { slug: newSlug },
        });
        console.log(`   ✅ Fixed!\n`);
        fixedCount++;
      } catch (error) {
        const errorMsg = `Failed to update card ${card.id}: ${error}`;
        console.log(`   ❌ Error: ${errorMsg}\n`);
        errors.push(errorMsg);
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total cards checked: ${cards.length}`);
  console.log(`Cards fixed: ${fixedCount}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(err => console.log(`  - ${err}`));
  }
}

fixDuplicatePrintRunSlugs()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
