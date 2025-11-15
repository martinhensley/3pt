import { PrismaClient } from '@prisma/client';
import { generateCardSlug } from '@/lib/slugGenerator';

const prisma = new PrismaClient();

/**
 * Generate individual card records for all parallel sets
 *
 * Currently: 872 cards stored on parent sets, parallels inherit via parent-child relationship
 * Target: 15,201 individual card records (one for each parallel version)
 */
async function main() {
  console.log('🎴 GENERATING PARALLEL CARD RECORDS');
  console.log('='.repeat(80));

  const release = await prisma.release.findFirst({
    where: { slug: '2024-25-panini-donruss-soccer' },
    include: {
      sets: {
        include: {
          cards: true,
          parentSet: {
            include: {
              cards: true
            }
          }
        }
      }
    },
  });

  if (!release) {
    console.error('Release not found!');
    return;
  }

  // Find all parallel sets (sets with parentSetId)
  const parallelSets = release.sets.filter(s => s.parentSetId);

  console.log(`\nFound ${parallelSets.length} parallel sets that need card records created\n`);

  let totalCardsCreated = 0;

  for (const parallelSet of parallelSets) {
    // Find the parent set
    const parentSet = release.sets.find(s => s.id === parallelSet.parentSetId);

    if (!parentSet) {
      console.warn(`⚠️  Parent set not found for parallel: ${parallelSet.name}`);
      continue;
    }

    console.log(`\n📦 Processing: ${parallelSet.name} (parent: ${parentSet.name})`);
    console.log(`   Parent has ${parentSet.cards.length} cards`);

    // Check if parallel already has cards
    if (parallelSet.cards.length > 0) {
      console.log(`   ✓ Already has ${parallelSet.cards.length} cards, skipping`);
      continue;
    }

    // Create a card in the parallel set for each card in the parent set
    let cardsCreated = 0;

    for (const parentCard of parentSet.cards) {
      // Generate slug for the parallel card
      const cardSlug = generateCardSlug(
        'Panini',
        'Donruss Soccer',
        '2024-25',
        parentSet.name,
        parentCard.cardNumber || '',
        parentCard.playerName || '',
        parallelSet.name, // Use parallel name as variant
        parallelSet.printRun
      );

      // Create the card
      await prisma.card.create({
        data: {
          slug: cardSlug,
          playerName: parentCard.playerName,
          team: parentCard.team,
          cardNumber: parentCard.cardNumber,
          variant: parallelSet.name, // Store the parallel name as variant
          printRun: parallelSet.printRun,
          setId: parallelSet.id,
        },
      });

      cardsCreated++;
    }

    console.log(`   ✅ Created ${cardsCreated} cards`);
    totalCardsCreated += cardsCreated;
  }

  console.log('\n' + '='.repeat(80));
  console.log(`✅ CARD GENERATION COMPLETE!`);
  console.log(`   Total new cards created: ${totalCardsCreated.toLocaleString()}`);
  console.log('='.repeat(80));

  // Final count
  const finalCardCount = await prisma.card.count({
    where: { set: { releaseId: release.id } },
  });

  console.log(`\n📊 Final Statistics:`);
  console.log(`   Total cards in database: ${finalCardCount.toLocaleString()}`);
  console.log(`   Expected: 15,201`);

  if (finalCardCount === 15201) {
    console.log(`   ✅ Perfect match!`);
  } else {
    console.log(`   ⚠️  Mismatch: ${15201 - finalCardCount} cards difference`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
