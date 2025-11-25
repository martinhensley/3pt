import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix Season Championship Ticket print run and slugs
 *
 * Issue: The set has printRun: 299 but should be 1 (1/1 cards)
 * Cards already have correct printRun (1) but set slug needs updating
 *
 * Changes:
 * 1. Update Set.printRun from 299 to 1
 * 2. Update Set.slug to end with -parallel-1 instead of -parallel-299
 * 3. Verify all cards have printRun: 1 and numbered: "/1" or "1/1"
 * 4. Regenerate card slugs if needed (they already look correct)
 */
async function fixSeasonChampionshipTicket() {
  console.log('=== Fixing Season Championship Ticket Print Run ===\n');

  const setSlug = '2016-contenders-draft-picks-season-ticket-championship-ticket-parallel-299';
  const newSetSlug = '2016-contenders-draft-picks-season-ticket-championship-ticket-parallel-1';

  // 1. Get the set with its release information
  const set = await prisma.set.findUnique({
    where: { slug: setSlug },
    include: {
      release: {
        include: {
          manufacturer: true
        }
      },
      cards: {
        orderBy: { cardNumber: 'asc' }
      }
    }
  });

  if (!set) {
    throw new Error(`Set not found: ${setSlug}`);
  }

  console.log('Current Set Details:');
  console.log('  Name:', set.name);
  console.log('  Slug:', set.slug);
  console.log('  Print Run:', set.printRun, '(should be 1)');
  console.log('  Total Cards:', set.cards.length);
  console.log('  Release:', set.release.name);
  console.log('  Year:', set.release.year);
  console.log('');

  // 2. Check card status
  console.log('Checking card status...\n');

  let cardsNeedingFix = 0;
  let cardsSlugsNeedingFix = 0;

  for (const card of set.cards) {
    if (card.printRun !== 1) {
      cardsNeedingFix++;
      console.log(`Card #${card.cardNumber} (${card.playerName}): printRun = ${card.printRun} (should be 1)`);
    }

    // Check if slug ends with -299 instead of -1
    if (card.slug && card.slug.endsWith('-299')) {
      cardsSlugsNeedingFix++;
    }
  }

  console.log(`\nCards needing printRun fix: ${cardsNeedingFix}`);
  console.log(`Cards needing slug fix: ${cardsSlugsNeedingFix}`);
  console.log('');

  // 3. Show examples of current state
  console.log('Example cards (first 3):\n');
  const sampleCards = set.cards.slice(0, 3);
  for (const card of sampleCards) {
    console.log(`Card #${card.cardNumber}: ${card.playerName}`);
    console.log(`  Current slug: ${card.slug}`);
    console.log(`  Print Run: ${card.printRun}`);
    console.log(`  Numbered: ${card.numbered}`);
    console.log('');
  }

  // 4. Confirm before proceeding
  console.log('=== Ready to Fix ===');
  console.log('Changes to be made:');
  console.log('  1. Update Set.printRun from 299 to 1');
  console.log('  2. Update Set.slug to:', newSetSlug);
  if (cardsNeedingFix > 0) {
    console.log(`  3. Update ${cardsNeedingFix} cards' printRun to 1`);
  }
  if (cardsSlugsNeedingFix > 0) {
    console.log(`  4. Update ${cardsSlugsNeedingFix} cards' slugs (remove -299, add -1)`);
  }
  console.log('');

  // 5. Update the Set record
  console.log('Updating Set record...');
  await prisma.set.update({
    where: { id: set.id },
    data: {
      printRun: 1,
      slug: newSetSlug
    }
  });
  console.log('Set record updated.\n');

  // 6. Update cards if needed
  let cardsUpdated = 0;
  let cardSlugsUpdated = 0;
  let errors = 0;

  if (cardsNeedingFix > 0 || cardsSlugsNeedingFix > 0) {
    console.log('Updating cards...\n');

    for (const card of set.cards) {
      try {
        const updates: any = {};

        // Fix printRun if needed
        if (card.printRun !== 1) {
          updates.printRun = 1;
          cardsUpdated++;
        }

        // Fix slug if it ends with -299
        if (card.slug && card.slug.endsWith('-299')) {
          // Replace -299 at the end with -1
          updates.slug = card.slug.replace(/-299$/, '-1');
          cardSlugsUpdated++;
        }

        // Update if there are changes
        if (Object.keys(updates).length > 0) {
          await prisma.card.update({
            where: { id: card.id },
            data: updates
          });
        }
      } catch (error) {
        console.error(`Error updating card ${card.cardNumber}:`, error);
        errors++;
      }
    }

    if (cardsUpdated > 0) {
      console.log(`Updated printRun on ${cardsUpdated} cards`);
    }
    if (cardSlugsUpdated > 0) {
      console.log(`Updated slugs on ${cardSlugsUpdated} cards`);
    }
    if (errors > 0) {
      console.log(`⚠️  ${errors} errors occurred`);
    }
    console.log('');
  } else {
    console.log('All cards already have correct printRun and slugs.\n');
  }

  // 7. Verify the fix
  console.log('=== Verification ===\n');

  const updatedSet = await prisma.set.findUnique({
    where: { slug: newSetSlug },
    include: {
      cards: {
        take: 3,
        orderBy: { cardNumber: 'asc' }
      }
    }
  });

  if (!updatedSet) {
    throw new Error('Set not found after update!');
  }

  console.log('Updated Set Details:');
  console.log('  Slug:', updatedSet.slug);
  console.log('  Print Run:', updatedSet.printRun);
  console.log('');

  console.log('Sample cards after update:\n');
  for (const card of updatedSet.cards) {
    console.log(`Card #${card.cardNumber}: ${card.playerName}`);
    console.log(`  Slug: ${card.slug}`);
    console.log(`  Print Run: ${card.printRun}`);
    console.log(`  Numbered: ${card.numbered}`);
    console.log('');
  }

  console.log('=== Fix Complete ===');
  console.log(`Set print run corrected: 299 → 1`);
  console.log(`Set slug updated to: ${newSetSlug}`);
  if (cardsUpdated > 0 || cardSlugsUpdated > 0) {
    console.log(`Cards updated: ${Math.max(cardsUpdated, cardSlugsUpdated)}`);
  }

  await prisma.$disconnect();
}

fixSeasonChampionshipTicket()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  });
