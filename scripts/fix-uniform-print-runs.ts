#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UniformPrintRunSet {
  namePattern: string;
  printRun: number | null;
  numbered: string | null;
}

async function fixUniformPrintRuns() {
  console.log('🔧 FIXING UNIFORM PRINT RUN CARDS\n');

  // Define sets that have uniform print runs across all cards
  const uniformSets: UniformPrintRunSet[] = [
    // Black parallels - all are 1/1
    { namePattern: 'Signature Series Black', printRun: 1, numbered: '/1' },
    { namePattern: 'Beautiful Game Autographs Black', printRun: 1, numbered: '/1' },
    { namePattern: 'Beautiful Game Dual Autographs Black', printRun: 1, numbered: '/1' },

    // Pink Ice parallels - all are /25
    { namePattern: 'Signature Series Pink Ice', printRun: 25, numbered: '/25' },
    { namePattern: 'Beautiful Game Autographs Pink Ice', printRun: 25, numbered: '/25' },
    { namePattern: 'Beautiful Game Dual Autographs Pink Ice', printRun: 25, numbered: '/25' },

    // Pink Velocity parallels - all are /99 (but some might be unnumbered)
    { namePattern: 'Signature Series Pink Velocity', printRun: null, numbered: null },
    { namePattern: 'Beautiful Game Autographs Pink Velocity', printRun: null, numbered: null },
    { namePattern: 'Beautiful Game Dual Autographs Pink Velocity', printRun: null, numbered: null },

    // Base autograph sets (unnumbered)
    { namePattern: 'Signature Series', printRun: null, numbered: null },
    { namePattern: 'Beautiful Game Autographs', printRun: null, numbered: null },
    { namePattern: 'Beautiful Game Dual Autographs', printRun: null, numbered: null },
  ];

  let totalFixed = 0;
  let totalErrors = 0;

  for (const uniformSet of uniformSets) {
    console.log(`\n📦 Processing: ${uniformSet.namePattern}`);
    console.log(`   Target print run: ${uniformSet.printRun === null ? 'UNNUMBERED' : `/${uniformSet.printRun}`}`);

    // Find matching sets in database
    const dbSets = await prisma.set.findMany({
      where: {
        name: {
          equals: uniformSet.namePattern
        },
        release: {
          slug: '2024-25-panini-donruss-soccer'
        }
      },
      include: {
        cards: true
      }
    });

    if (dbSets.length === 0) {
      console.log(`   ⚠️ No sets found matching pattern`);
      continue;
    }

    for (const dbSet of dbSets) {
      console.log(`   Found set: ${dbSet.name} (${dbSet.cards.length} cards)`);

      // First, update the set-level print run if needed
      if (dbSet.printRun !== uniformSet.printRun) {
        await prisma.set.update({
          where: { id: dbSet.id },
          data: { printRun: uniformSet.printRun }
        });
        console.log(`   ✅ Updated Set.printRun: ${dbSet.printRun} → ${uniformSet.printRun}`);
      }

      // Count cards needing updates
      const cardsNeedingUpdate = dbSet.cards.filter(card =>
        card.printRun !== uniformSet.printRun ||
        card.numbered !== uniformSet.numbered
      );

      if (cardsNeedingUpdate.length === 0) {
        console.log(`   ✓ All cards already have correct print run`);
        continue;
      }

      console.log(`   Updating ${cardsNeedingUpdate.length} cards...`);

      // Update all cards in bulk
      try {
        const result = await prisma.card.updateMany({
          where: {
            setId: dbSet.id
          },
          data: {
            printRun: uniformSet.printRun,
            numbered: uniformSet.numbered
          }
        });

        console.log(`   ✅ Updated ${result.count} cards`);
        totalFixed += result.count;

        // Show sample cards
        const sampleCards = dbSet.cards.slice(0, 3);
        for (const card of sampleCards) {
          const prStr = uniformSet.printRun === null ? 'UNNUMBERED' : `/${uniformSet.printRun}`;
          console.log(`      • ${card.playerName || 'Unknown'} → ${prStr}`);
        }
      } catch (error) {
        console.error(`   ❌ Error updating cards: ${error}`);
        totalErrors += cardsNeedingUpdate.length;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ UNIFORM PRINT RUN FIX COMPLETE');
  console.log(`   Total cards fixed: ${totalFixed}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log('='.repeat(60) + '\n');
}

// Run the fix
fixUniformPrintRuns()
  .catch(console.error)
  .finally(() => prisma.$disconnect());