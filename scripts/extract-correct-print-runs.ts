#!/usr/bin/env npx tsx

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface CardPrintRun {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
  printRun: string | null;
  sequence: string | null;
}

interface SetPrintRunSummary {
  setName: string;
  expectedCardCount: number;
  printRunDistribution: Map<string, number>;
  cards: CardPrintRun[];
}

function extractPrintRun(sequence: any): string | null {
  if (!sequence) return null;

  const seqStr = String(sequence).trim();

  // Check for date patterns (these are likely unnumbered)
  if (seqStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || seqStr.match(/^\d{5}$/)) {
    return 'DATE_CODE';
  }

  // Extract print run patterns
  const patterns = [
    /^(\d+)\/(\d+)$/,     // Direct format: "1/1", "5/99", etc.
    /\/(\d+)$/,           // Ends with /number
    /^(\d+)$/,            // Just a number (likely the print run)
  ];

  for (const pattern of patterns) {
    const match = seqStr.match(pattern);
    if (match) {
      if (pattern.source === '^(\\d+)\\/(\\d+)$') {
        // For "X/Y" format, Y is the print run
        return match[2];
      } else if (pattern.source === '\\/(\\d+)$') {
        // For "/Y" format, Y is the print run
        return match[1];
      } else {
        // For plain number, it's the print run
        return match[1];
      }
    }
  }

  return null;
}

async function analyzeExcelPrintRuns() {
  const excelPath = '/Users/mh/Desktop/2024-25-Donruss-Soccer-Checklist.xlsx';

  console.log('📊 Reading Excel file...');
  const workbook = XLSX.readFile(excelPath);

  const masterSheet = workbook.Sheets['Master'];
  if (!masterSheet) {
    console.error('❌ Master sheet not found');
    return;
  }

  // Convert to JSON with header row
  const data = XLSX.utils.sheet_to_json(masterSheet, { header: 1 }) as any[][];
  const headers = data[0] as string[];

  // Find column indices
  const setCol = headers.findIndex(h => h?.toLowerCase().includes('set'));
  const cardNumCol = headers.findIndex(h => h?.toLowerCase().includes('card'));
  const playerCol = headers.findIndex(h => h?.toLowerCase().includes('player'));
  const teamCol = headers.findIndex(h => h?.toLowerCase().includes('team'));
  const sequenceCol = headers.findIndex(h => h?.toLowerCase().includes('sequence'));

  console.log('📍 Column mappings:');
  console.log(`  Set: ${setCol}, Card: ${cardNumCol}, Player: ${playerCol}, Team: ${teamCol}, Sequence: ${sequenceCol}`);

  // Process all rows (skip header)
  const allCards: CardPrintRun[] = [];
  const setMap = new Map<string, SetPrintRunSummary>();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[setCol]) continue;

    const setName = String(row[setCol]).trim();
    const cardNumber = row[cardNumCol] ? String(row[cardNumCol]).trim() : '';
    const playerName = row[playerCol] ? String(row[playerCol]).trim() : '';
    const team = row[teamCol] ? String(row[teamCol]).trim() : '';
    const sequence = row[sequenceCol];
    const printRun = extractPrintRun(sequence);

    const card: CardPrintRun = {
      setName,
      cardNumber,
      playerName,
      team,
      printRun,
      sequence: sequence ? String(sequence) : null
    };

    allCards.push(card);

    // Update set summary
    if (!setMap.has(setName)) {
      setMap.set(setName, {
        setName,
        expectedCardCount: 0,
        printRunDistribution: new Map(),
        cards: []
      });
    }

    const setSummary = setMap.get(setName)!;
    setSummary.expectedCardCount++;
    setSummary.cards.push(card);

    // Update print run distribution
    const prKey = printRun || 'UNNUMBERED';
    setSummary.printRunDistribution.set(
      prKey,
      (setSummary.printRunDistribution.get(prKey) || 0) + 1
    );
  }

  // Analyze and report findings
  console.log(`\n📊 ANALYSIS COMPLETE: ${allCards.length} cards across ${setMap.size} sets\n`);

  // Focus on sets with variable print runs
  console.log('🔍 SETS WITH VARIABLE PRINT RUNS:\n');

  const variablePrintRunSets: SetPrintRunSummary[] = [];

  for (const [setName, summary] of setMap) {
    if (summary.printRunDistribution.size > 1) {
      // Exclude sets where the only variation is UNNUMBERED vs one print run
      const hasMultipleNumberedRuns = Array.from(summary.printRunDistribution.keys())
        .filter(pr => pr !== 'UNNUMBERED' && pr !== 'DATE_CODE').length > 1;

      if (hasMultipleNumberedRuns) {
        variablePrintRunSets.push(summary);
      }
    }
  }

  variablePrintRunSets.sort((a, b) => a.setName.localeCompare(b.setName));

  for (const summary of variablePrintRunSets) {
    console.log(`📦 ${summary.setName} (${summary.expectedCardCount} cards)`);
    console.log('   Print run distribution:');

    const sortedDistribution = Array.from(summary.printRunDistribution.entries())
      .sort((a, b) => {
        // Sort by numeric value if possible
        const aNum = parseInt(a[0]);
        const bNum = parseInt(b[0]);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a[0].localeCompare(b[0]);
      });

    for (const [printRun, count] of sortedDistribution) {
      console.log(`     /${printRun}: ${count} cards`);
    }
    console.log();
  }

  // Check Dragon Scale specifically
  console.log('🐉 DRAGON SCALE SETS:\n');

  for (const [setName, summary] of setMap) {
    if (setName.toLowerCase().includes('dragon scale')) {
      console.log(`📦 ${setName} (${summary.expectedCardCount} cards)`);
      console.log('   Print run distribution:');

      const sortedDistribution = Array.from(summary.printRunDistribution.entries())
        .sort((a, b) => {
          const aNum = parseInt(a[0]);
          const bNum = parseInt(b[0]);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return a[0].localeCompare(b[0]);
        });

      for (const [printRun, count] of sortedDistribution) {
        console.log(`     /${printRun}: ${count} cards`);
      }

      // Show sample cards
      console.log('\n   Sample cards:');
      for (let i = 0; i < Math.min(5, summary.cards.length); i++) {
        const card = summary.cards[i];
        console.log(`     #${card.cardNumber} ${card.playerName} - /${card.printRun || 'UNNUMBERED'}`);
      }
      console.log();
    }
  }

  // Generate detailed JSON report
  const report = {
    expectedCardCount: allCards.length,
    totalSets: setMap.size,
    setsWithVariablePrintRuns: variablePrintRunSets.map(s => ({
      setName: s.setName,
      expectedCardCount: s.expectedCardCount,
      printRuns: Object.fromEntries(s.printRunDistribution)
    })),
    dragonScaleSets: Array.from(setMap.values())
      .filter(s => s.setName.toLowerCase().includes('dragon scale'))
      .map(s => ({
        setName: s.setName,
        expectedCardCount: s.expectedCardCount,
        printRuns: Object.fromEntries(s.printRunDistribution),
        cards: s.cards.map(c => ({
          number: c.cardNumber,
          player: c.playerName,
          printRun: c.printRun
        }))
      }))
  };

  // Save report to file
  const reportPath = path.join(process.cwd(), 'scripts', 'print-runs-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}\n`);

  // Generate card-level mapping for database updates
  const cardMappings: any[] = [];

  for (const summary of variablePrintRunSets) {
    for (const card of summary.cards) {
      if (card.printRun && card.printRun !== 'UNNUMBERED' && card.printRun !== 'DATE_CODE') {
        cardMappings.push({
          setName: card.setName,
          cardNumber: card.cardNumber,
          playerName: card.playerName,
          printRun: parseInt(card.printRun)
        });
      }
    }
  }

  const mappingPath = path.join(process.cwd(), 'scripts', 'card-print-run-mappings.json');
  fs.writeFileSync(mappingPath, JSON.stringify(cardMappings, null, 2));
  console.log(`💾 Card mappings saved to: ${mappingPath}`);
  console.log(`   Total cards with individual print runs: ${cardMappings.length}\n`);
}

// Run the analysis
analyzeExcelPrintRuns().catch(console.error);