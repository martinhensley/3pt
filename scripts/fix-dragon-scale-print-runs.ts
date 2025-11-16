#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDragonScalePrintRuns() {
  console.log('🐉 FIXING DRAGON SCALE PRINT RUNS (88 → 8)\n');

  // Find all Dragon Scale sets
  const dragonScaleSets = await prisma.set.findMany({
    where: {
      name: { contains: 'Dragon Scale' },
      release: {
        slug: '2024-25-panini-donruss-soccer'
      }
    },
    include: {
      cards: true
    }
  });

  console.log(`📦 Found ${dragonScaleSets.length} Dragon Scale sets to fix\n`);

  let totalSetsFixed = 0;
  let totalCardsFixed = 0;

  for (const set of dragonScaleSets) {
    console.log(`\n🔧 Processing: ${set.name}`);
    console.log(`   Current Set.printRun: ${set.printRun}`);
    console.log(`   Total cards: ${set.cards.length}`);

    // Check if this set needs fixing
    // Note: Dragon Scale was imported with 99 (from the parallel set logic)
    // but should actually be 8
    if (set.printRun === 88 || set.printRun === 99) {
      // Fix the set print run
      await prisma.set.update({
        where: { id: set.id },
        data: { printRun: 8 }
      });
      console.log(`   ✅ Set.printRun updated: ${set.printRun} → 8`);
      totalSetsFixed++;
    } else if (set.printRun === 8) {
      console.log(`   ✓ Set.printRun already correct: 8`);
    } else {
      console.log(`   ⚠️ Set.printRun has unexpected value: ${set.printRun}`);
    }

    // Fix all cards in this set
    let cardsFixed = 0;
    let cardsAlreadyCorrect = 0;
    let cardsWithOtherValues = 0;

    for (const card of set.cards) {
      if (card.printRun === 88 || card.printRun === 99) {
        // Fix the card (was imported with 99 due to parallel set logic)
        await prisma.card.update({
          where: { id: card.id },
          data: {
            printRun: 8,
            numbered: '/8'
          }
        });
        cardsFixed++;
      } else if (card.printRun === 8) {
        cardsAlreadyCorrect++;
      } else if (card.printRun !== null) {
        cardsWithOtherValues++;
        console.log(`      Card #${card.cardNumber} has printRun: ${card.printRun}`);
      }
    }

    console.log(`   📊 Cards fixed: ${cardsFixed}`);
    console.log(`   📊 Cards already correct: ${cardsAlreadyCorrect}`);
    if (cardsWithOtherValues > 0) {
      console.log(`   ⚠️ Cards with other print runs: ${cardsWithOtherValues}`);
    }

    totalCardsFixed += cardsFixed;
  }

  // Also fix Pink Velocity and Plum Blossom if needed
  console.log('\n\n🌸 CHECKING OTHER PARALLEL FIXES\n');

  // Fix Pink Velocity (should be /99 not /25)
  const pinkVelocitySets = await prisma.set.findMany({
    where: {
      name: { contains: 'Pink Velocity' },
      release: {
        slug: '2024-25-panini-donruss-soccer'
      }
    },
    include: {
      cards: true
    }
  });

  for (const set of pinkVelocitySets) {
    console.log(`\n🔧 Processing: ${set.name}`);
    if (set.printRun === 25) {
      await prisma.set.update({
        where: { id: set.id },
        data: { printRun: 99 }
      });
      console.log(`   ✅ Set.printRun updated: 25 → 99`);

      // Update all cards
      const result = await prisma.card.updateMany({
        where: { setId: set.id, printRun: 25 },
        data: { printRun: 99, numbered: '/99' }
      });
      console.log(`   ✅ ${result.count} cards updated: 25 → 99`);
    }
  }

  // Fix Plum Blossom (should be unnumbered, not /88)
  const plumBlossomSets = await prisma.set.findMany({
    where: {
      name: { contains: 'Plum Blossom' },
      release: {
        slug: '2024-25-panini-donruss-soccer'
      }
    },
    include: {
      cards: true
    }
  });

  for (const set of plumBlossomSets) {
    console.log(`\n🔧 Processing: ${set.name}`);
    if (set.printRun === 88 || set.printRun !== null) {
      await prisma.set.update({
        where: { id: set.id },
        data: { printRun: null }
      });
      console.log(`   ✅ Set.printRun updated to null (unnumbered)`);

      // Update all cards
      const result = await prisma.card.updateMany({
        where: { setId: set.id },
        data: { printRun: null, numbered: null }
      });
      console.log(`   ✅ ${result.count} cards updated to unnumbered`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ DRAGON SCALE FIX COMPLETE`);
  console.log(`   Dragon Scale sets fixed: ${totalSetsFixed}`);
  console.log(`   Dragon Scale cards fixed: ${totalCardsFixed}`);
  console.log(`   Pink Velocity sets checked: ${pinkVelocitySets.length}`);
  console.log(`   Plum Blossom sets checked: ${plumBlossomSets.length}`);
  console.log('='.repeat(60) + '\n');
}

// Run the fix
fixDragonScalePrintRuns()
  .catch(console.error)
  .finally(() => prisma.$disconnect());