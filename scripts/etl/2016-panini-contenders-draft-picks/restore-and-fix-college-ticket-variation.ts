/**
 * Restore and fix College Ticket Variation sets
 *
 * Steps:
 * 1. Use College Championship Ticket Variation as the source (has all 75 cards)
 * 2. Copy cards 102-150 to College Ticket Variation (46 cards)
 * 3. Copy cards 102-150 to all Printing Plate sets (46 cards each)
 *
 * The College Championship Ticket Variation has the full checklist:
 * - Cards 102-150 (46 cards, missing 126, 145, 147)
 * - Cards 151-184 (29 cards, with gaps)
 * - Total: 75 cards
 *
 * College Ticket Variation should only have cards 102-150 (46 cards)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Restoring and Fixing College Ticket Variation ===\n');

  const release = await prisma.release.findUnique({
    where: { slug: '2016-panini-contenders-draft-picks-basketball' }
  });

  if (!release) {
    throw new Error('Release not found');
  }

  // Get the source set (College Championship Ticket Variation) which has all cards
  const sourceSet = await prisma.set.findUnique({
    where: { slug: '2016-contenders-draft-picks-college-ticket-variation-championship-ticket-parallel-1' },
    include: {
      cards: {
        orderBy: { cardNumber: 'asc' }
      }
    }
  });

  if (!sourceSet) {
    throw new Error('Source set (College Championship Ticket Variation) not found');
  }

  console.log(`Source set: ${sourceSet.name}`);
  console.log(`  Total cards: ${sourceSet.cards.length}\n`);

  // Filter to get only cards 102-150
  const sourceCards102_150 = sourceSet.cards.filter(c =>
    typeof c.cardNumber === 'string'
      ? parseInt(c.cardNumber) >= 102 && parseInt(c.cardNumber) <= 150
      : c.cardNumber >= 102 && c.cardNumber <= 150
  );

  console.log(`Cards to copy (102-150): ${sourceCards102_150.length}\n`);

  // Get target sets (College Ticket Variation + Printing Plates)
  const targetSets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      OR: [
        { slug: '2016-contenders-draft-picks-college-ticket-variation' },
        { slug: { contains: 'college-ticket-printing-plate' } }
      ]
    },
    include: {
      cards: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log(`Found ${targetSets.length} target sets to restore:\n`);

  for (const targetSet of targetSets) {
    console.log(`\n${targetSet.name}`);
    console.log(`  Current cards: ${targetSet.cards.length}`);

    if (targetSet.cards.length === 0) {
      console.log(`  Status: Empty - will restore`);

      // Create cards from source - need to adjust variant and slug for target set
      const cardsToCreate = sourceCards102_150.map(sourceCard => {
        // Determine variant based on target set
        const isBaseVariation = targetSet.slug === '2016-contenders-draft-picks-college-ticket-variation';
        let newVariant = null;

        // For printing plates, extract the color from set name
        if (targetSet.name.includes('Printing Plate')) {
          if (targetSet.name.includes('Black')) newVariant = 'Printing Plate - Black';
          else if (targetSet.name.includes('Cyan')) newVariant = 'Printing Plate - Cyan';
          else if (targetSet.name.includes('Magenta')) newVariant = 'Printing Plate Magenta';
          else if (targetSet.name.includes('Yellow')) newVariant = 'Printing Plate Yellow';
        }

        // Build new slug based on target set slug pattern
        // Use the set's slug as a base and append card-specific info
        const playerSlug = sourceCard.playerName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || '';

        // Build card slug: use set slug pattern + card number + player
        const newSlug = `${targetSet.slug}-${sourceCard.cardNumber}-${playerSlug}`;

        return {
          setId: targetSet.id,
          playerName: sourceCard.playerName,
          team: sourceCard.team,
          cardNumber: sourceCard.cardNumber,
          variant: newVariant,
          slug: newSlug,
          printRun: targetSet.printRun || sourceCard.printRun,
          numbered: targetSet.printRun ? `${targetSet.printRun === 1 ? '1 of 1' : `/${targetSet.printRun}`}` : sourceCard.numbered
        };
      });

      // Batch create
      const result = await prisma.card.createMany({
        data: cardsToCreate
      });

      console.log(`  ✓ Created ${result.count} cards`);
    } else if (targetSet.cards.length === 46) {
      console.log(`  Status: Correct count - no action needed`);
    } else {
      console.log(`  Status: Has ${targetSet.cards.length} cards - will fix`);

      // Delete all existing cards
      await prisma.card.deleteMany({
        where: { setId: targetSet.id }
      });
      console.log(`  - Deleted ${targetSet.cards.length} existing cards`);

      // Create cards from source - need to adjust variant and slug for target set
      const cardsToCreate = sourceCards102_150.map(sourceCard => {
        // Determine variant based on target set
        const isBaseVariation = targetSet.slug === '2016-contenders-draft-picks-college-ticket-variation';
        let newVariant = null;

        // For printing plates, extract the color from set name
        if (targetSet.name.includes('Printing Plate')) {
          if (targetSet.name.includes('Black')) newVariant = 'Printing Plate - Black';
          else if (targetSet.name.includes('Cyan')) newVariant = 'Printing Plate - Cyan';
          else if (targetSet.name.includes('Magenta')) newVariant = 'Printing Plate Magenta';
          else if (targetSet.name.includes('Yellow')) newVariant = 'Printing Plate Yellow';
        }

        // Build new slug based on target set slug pattern
        // Use the set's slug as a base and append card-specific info
        const playerSlug = sourceCard.playerName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || '';

        // Build card slug: use set slug pattern + card number + player
        const newSlug = `${targetSet.slug}-${sourceCard.cardNumber}-${playerSlug}`;

        return {
          setId: targetSet.id,
          playerName: sourceCard.playerName,
          team: sourceCard.team,
          cardNumber: sourceCard.cardNumber,
          variant: newVariant,
          slug: newSlug,
          printRun: targetSet.printRun || sourceCard.printRun,
          numbered: targetSet.printRun ? `${targetSet.printRun === 1 ? '1 of 1' : `/${targetSet.printRun}`}` : sourceCard.numbered
        };
      });

      const result = await prisma.card.createMany({
        data: cardsToCreate
      });

      console.log(`  ✓ Created ${result.count} cards`);
    }
  }

  // Final verification
  console.log('\n\n=== Final Verification ===\n');

  for (const set of targetSets) {
    const cards = await prisma.card.findMany({
      where: { setId: set.id },
      orderBy: { cardNumber: 'asc' }
    });

    const cardNumbers = cards.map(c =>
      typeof c.cardNumber === 'string' ? parseInt(c.cardNumber) : c.cardNumber
    );
    const minCard = cards.length > 0 ? Math.min(...cardNumbers) : 0;
    const maxCard = cards.length > 0 ? Math.max(...cardNumbers) : 0;

    console.log(`${set.name}: ${cards.length} cards (${minCard}-${maxCard})`);

    // Verify no cards > 150
    const cardsAbove150 = cards.filter(c => {
      const num = typeof c.cardNumber === 'string' ? parseInt(c.cardNumber) : c.cardNumber;
      return num > 150;
    });

    if (cardsAbove150.length > 0) {
      console.log(`  ✗ WARNING: ${cardsAbove150.length} cards numbered > 150`);
    } else if (cards.length === 46) {
      console.log('  ✓ Correct!');
    } else {
      console.log(`  ✗ Expected 46, got ${cards.length}`);
    }
  }

  console.log('\n✓ Restoration and fix complete!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
