#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CardPrintRunData {
  setName: string;
  cardNumber: string;
  playerName: string;
  printRun: number | null;
}

async function fixVariablePrintRuns() {
  console.log('🔧 FIXING VARIABLE PRINT RUN CARDS\n');

  // Load the complete card data
  const dataPath = path.join(process.cwd(), 'scripts', 'complete-card-print-runs.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ complete-card-print-runs.json not found. Run extract-complete-print-runs.ts first.');
    return;
  }

  const excelData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`📊 Loaded data for ${excelData.expectedCardCount} cards across ${excelData.totalSets} sets\n`);

  let totalFixed = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  // Process each set from Excel data
  for (const excelSet of excelData.sets) {
    const setName = excelSet.setName;
    const excelCards = excelSet.cards;

    // Skip sets that are all unnumbered
    const numberedCards = excelCards.filter((c: any) => c.printRun !== null);
    if (numberedCards.length === 0) {
      console.log(`⏭️ Skipping ${setName} - all cards are unnumbered`);
      totalSkipped += excelCards.length;
      continue;
    }

    console.log(`\n📦 Processing: ${setName}`);
    console.log(`   Excel cards: ${excelCards.length} (${numberedCards.length} numbered)`);

    // Find the corresponding set in the database
    const dbSet = await prisma.set.findFirst({
      where: {
        name: setName,
        release: {
          slug: '2024-25-panini-donruss-soccer'
        }
      },
      include: {
        cards: {
          orderBy: [
            { cardNumber: 'asc' },
            { playerName: 'asc' }
          ]
        }
      }
    });

    if (!dbSet) {
      console.log(`   ❌ Set not found in database`);
      totalErrors += excelCards.length;
      continue;
    }

    console.log(`   Database cards: ${dbSet.cards.length}`);

    // Match cards by position (since we don't have reliable card numbers)
    // This assumes cards are in the same order in Excel and database
    let setFixed = 0;
    let setErrors = 0;

    for (let i = 0; i < Math.min(excelCards.length, dbSet.cards.length); i++) {
      const excelCard = excelCards[i];
      const dbCard = dbSet.cards[i];

      // Skip if Excel card is unnumbered
      if (excelCard.printRun === null) {
        console.log(`   ⏭️ Card ${i + 1}: Unnumbered in Excel`);
        continue;
      }

      try {
        // Update the card's print run
        await prisma.card.update({
          where: { id: dbCard.id },
          data: {
            printRun: excelCard.printRun,
            numbered: `/${excelCard.printRun}`
          }
        });

        setFixed++;

        // Log every 10th card or notable print runs
        if (setFixed % 10 === 1 || excelCard.printRun <= 10 || excelCard.printRun === 1) {
          console.log(`   ✅ Card ${i + 1}: ${dbCard.playerName || 'Unknown'} → /${excelCard.printRun}`);
        }
      } catch (error) {
        console.error(`   ❌ Error updating card ${i + 1}: ${error}`);
        setErrors++;
      }
    }

    console.log(`   📊 Fixed: ${setFixed}, Errors: ${setErrors}`);
    totalFixed += setFixed;
    totalErrors += setErrors;

    // Handle mismatch in card counts
    if (excelCards.length !== dbSet.cards.length) {
      console.log(`   ⚠️ Card count mismatch: Excel has ${excelCards.length}, DB has ${dbSet.cards.length}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ VARIABLE PRINT RUN FIX COMPLETE');
  console.log(`   Total cards fixed: ${totalFixed}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log(`   Total skipped (unnumbered): ${totalSkipped}`);
  console.log('='.repeat(60) + '\n');
}

// Run the fix
fixVariablePrintRuns()
  .catch(console.error)
  .finally(() => prisma.$disconnect());