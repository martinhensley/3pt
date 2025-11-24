import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCollegeTicketVariations() {
  console.log('Starting College Ticket Variation fix...\n');

  try {
    // First, get the release
    const release = await prisma.release.findUnique({
      where: { slug: '2016-panini-contenders-draft-picks-basketball' },
      include: { sets: true }
    });

    if (!release) {
      throw new Error('Release not found');
    }

    console.log(`Found release: ${release.name}\n`);

    // Define the parallel types to fix
    const parallelTypes = [
      'Championship Ticket',
      'Cracked Ice Ticket',
      'Draft Ticket',
      'Playoff Ticket',
      'Printing Plate Black',
      'Printing Plate Cyan',
      'Printing Plate Magenta',
      'Printing Plate Yellow',
      'Blue Foil Ticket',
      'Red Foil Ticket'
    ];

    let totalCardsMoved = 0;
    const moveLog: Array<{ cardNumber: string; playerName: string; from: string; to: string }> = [];

    // Process each parallel type
    for (const parallelType of parallelTypes) {
      console.log(`\n=== Processing ${parallelType} ===`);

      // Find the non-variation set
      const nonVariationSet = release.sets.find(s =>
        s.name === `College ${parallelType}` && !s.name.includes('Variation')
      );

      // Find the variation set
      const variationSet = release.sets.find(s =>
        s.name === `College ${parallelType} Variation`
      );

      if (!nonVariationSet) {
        console.log(`  ⚠️  Non-variation set not found for ${parallelType}`);
        continue;
      }

      if (!variationSet) {
        console.log(`  ⚠️  Variation set not found for ${parallelType}`);
        continue;
      }

      console.log(`  Non-variation set: ${nonVariationSet.name} (ID: ${nonVariationSet.id})`);
      console.log(`  Variation set: ${variationSet.name} (ID: ${variationSet.id})`);

      // Find cards >= 102 in the non-variation set
      const cardsToMove = await prisma.card.findMany({
        where: {
          setId: nonVariationSet.id,
          cardNumber: {
            gte: '102'
          }
        },
        orderBy: { cardNumber: 'asc' }
      });

      if (cardsToMove.length === 0) {
        console.log(`  ℹ️  No cards to move (already correct)`);
        continue;
      }

      console.log(`  Found ${cardsToMove.length} cards to move (>= 102)`);

      // Move each card to the variation set
      for (const card of cardsToMove) {
        await prisma.card.update({
          where: { id: card.id },
          data: { setId: variationSet.id }
        });

        moveLog.push({
          cardNumber: card.cardNumber,
          playerName: card.playerName,
          from: nonVariationSet.name,
          to: variationSet.name
        });

        totalCardsMoved++;
      }

      console.log(`  ✅ Moved ${cardsToMove.length} cards to variation set`);
    }

    console.log(`\n\n=== Fix Draft Ticket Variation Print Run ===`);

    // Fix Draft Ticket Variation print run
    const draftTicketVariation = release.sets.find(s =>
      s.name === 'College Draft Ticket Variation'
    );

    if (draftTicketVariation) {
      console.log(`Current slug: ${draftTicketVariation.slug}`);
      console.log(`Current printRun: ${draftTicketVariation.printRun}`);

      await prisma.set.update({
        where: { id: draftTicketVariation.id },
        data: {
          printRun: 99,
          slug: '2016-contenders-draft-picks-college-ticket-variation-draft-ticket-parallel-99'
        }
      });

      console.log(`✅ Updated Draft Ticket Variation:`);
      console.log(`  - printRun: null → 99`);
      console.log(`  - slug: updated to end with -parallel-99`);
    } else {
      console.log(`⚠️  Draft Ticket Variation set not found`);
    }

    console.log(`\n\n=== Final Verification ===`);

    // Verify the final state
    for (const parallelType of parallelTypes) {
      const nonVariationSet = release.sets.find(s =>
        s.name === `College ${parallelType}` && !s.name.includes('Variation')
      );
      const variationSet = release.sets.find(s =>
        s.name === `College ${parallelType} Variation`
      );

      if (!nonVariationSet || !variationSet) continue;

      const nonVariationCount = await prisma.card.count({
        where: { setId: nonVariationSet.id }
      });

      const variationCount = await prisma.card.count({
        where: { setId: variationSet.id }
      });

      const nonVariation102Plus = await prisma.card.count({
        where: {
          setId: nonVariationSet.id,
          cardNumber: { gte: '102' }
        }
      });

      console.log(`\n${parallelType}:`);
      console.log(`  Non-variation: ${nonVariationCount} cards (${nonVariation102Plus} cards >= 102)`);
      console.log(`  Variation: ${variationCount} cards`);

      if (nonVariation102Plus > 0) {
        console.log(`  ⚠️  WARNING: Non-variation still has cards >= 102!`);
      } else if (variationCount === 46) {
        console.log(`  ✅ Correct!`);
      } else if (variationCount === 0) {
        console.log(`  ⚠️  Variation set is empty`);
      } else {
        console.log(`  ⚠️  Variation has ${variationCount} cards (expected 46)`);
      }
    }

    console.log(`\n\n=== Summary ===`);
    console.log(`Total cards moved: ${totalCardsMoved}`);
    console.log(`\nFirst 10 moves:`);
    moveLog.slice(0, 10).forEach(log => {
      console.log(`  Card ${log.cardNumber} (${log.playerName}): ${log.from} → ${log.to}`);
    });
    if (moveLog.length > 10) {
      console.log(`  ... and ${moveLog.length - 10} more`);
    }

    console.log('\n✅ Fix completed successfully!');

  } catch (error) {
    console.error('Error fixing College Ticket Variations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixCollegeTicketVariations();
