import { PrismaClient } from '@prisma/client';
import { generateCardSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

/**
 * Regenerate card slugs for Season Draft Ticket parallel
 *
 * Current incorrect format:
 * 2016-contenders-draft-picks-season-draft-ticket-1-aaron-gordon-99
 *
 * Correct format (parallel cards exclude set name):
 * 2016-contenders-draft-picks-1-aaron-gordon-draft-ticket-99
 */
async function regenerateSeasonDraftTicketSlugs() {
  console.log('=== Regenerating Season Draft Ticket Card Slugs ===\n');

  const setSlug = '2016-contenders-draft-picks-season-ticket-draft-ticket-parallel-99';

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

  console.log('Set:', set.name);
  console.log('Release:', set.release.name);
  console.log('Year:', set.release.year);
  console.log('Manufacturer:', set.release.manufacturer.name);
  console.log('Total Cards:', set.cards.length);
  console.log('');

  // 2. Extract the release name from the release slug
  // Release slug: "2016-panini-contenders-draft-picks-basketball"
  // We want: "contenders-draft-picks"
  const releaseSlugParts = set.release.slug.split('-');
  // Remove year (2016), manufacturer (panini), and sport (basketball)
  const releaseName = releaseSlugParts.slice(2, -1).join('-'); // "contenders-draft-picks"

  const year = set.release.year || '2016';
  const manufacturer = set.release.manufacturer.name;

  // 3. For parallel cards, the variant should be "Draft Ticket"
  const parallelVariant = 'Draft Ticket';
  const printRun = 99;

  console.log('Slug generation parameters:');
  console.log('  Year:', year);
  console.log('  Release name:', releaseName);
  console.log('  Manufacturer:', manufacturer);
  console.log('  Parallel variant:', parallelVariant);
  console.log('  Print run:', printRun);
  console.log('  Set type: Base (parallel cards exclude set name)');
  console.log('');

  // 4. Show examples of old vs new slugs
  console.log('Example slug transformations:\n');
  const sampleCards = set.cards.slice(0, 3);
  for (const card of sampleCards) {
    const newSlug = generateCardSlug(
      manufacturer,
      releaseName,
      year,
      'Season Ticket', // Set name (will be excluded for Base parallel)
      card.cardNumber || '',
      card.playerName || '',
      parallelVariant,
      printRun,
      'Base' // This is a Base set parallel
    );

    console.log(`Card #${card.cardNumber}: ${card.playerName}`);
    console.log(`  Old: ${card.slug}`);
    console.log(`  New: ${newSlug}`);
    console.log('');
  }

  // 5. Ask for confirmation before proceeding
  console.log('=== Ready to update all card slugs ===');
  console.log(`This will update ${set.cards.length} cards.`);
  console.log('');

  // 6. Update all card slugs
  let updated = 0;
  let errors = 0;

  for (const card of set.cards) {
    try {
      const newSlug = generateCardSlug(
        manufacturer,
        releaseName,
        year,
        'Season Ticket',
        card.cardNumber || '',
        card.playerName || '',
        parallelVariant,
        printRun,
        'Base'
      );

      await prisma.card.update({
        where: { id: card.id },
        data: { slug: newSlug }
      });

      updated++;
    } catch (error) {
      console.error(`Error updating card ${card.cardNumber}:`, error);
      errors++;
    }
  }

  console.log(`\n✓ Updated ${updated} card slugs`);
  if (errors > 0) {
    console.log(`⚠️  ${errors} errors occurred`);
  }

  // 7. Verify a few updated cards
  console.log('\n=== Verification ===\n');
  const verifyCards = await prisma.card.findMany({
    where: { setId: set.id },
    take: 3,
    orderBy: { cardNumber: 'asc' }
  });

  for (const card of verifyCards) {
    console.log(`Card #${card.cardNumber}: ${card.playerName}`);
    console.log(`  Slug: ${card.slug}`);
    console.log(`  Print Run: ${card.printRun}`);
    console.log(`  Numbered: ${card.numbered}`);
    console.log('');
  }

  console.log('=== Slug Regeneration Complete ===');

  await prisma.$disconnect();
}

regenerateSeasonDraftTicketSlugs()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  });
