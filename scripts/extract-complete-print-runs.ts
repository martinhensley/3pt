#!/usr/bin/env npx tsx

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface CompleteCardData {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
  printRun: number | null;
  sequence: string | null;
}

interface SetCardMapping {
  setName: string;
  cards: CompleteCardData[];
}

function extractPrintRun(sequence: any): number | null {
  if (!sequence) return null;

  const seqStr = String(sequence).trim();

  // Check for date patterns (these are unnumbered)
  if (seqStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || seqStr.match(/^\d{5}$/)) {
    return null; // DATE_CODE means unnumbered
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
        return parseInt(match[2]);
      } else if (pattern.source === '\\/(\\d+)$') {
        // For "/Y" format, Y is the print run
        return parseInt(match[1]);
      } else {
        // For plain number, it's the print run
        return parseInt(match[1]);
      }
    }
  }

  return null;
}

async function extractCompletePrintRuns() {
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

  // Find column indices - need to be more flexible
  let setCol = -1;
  let cardNumCol = -1;
  let playerCol = -1;
  let teamCol = -1;
  let sequenceCol = -1;

  // Try to find columns by name
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toString().toLowerCase() || '';
    if (header.includes('set') && setCol === -1) setCol = i;
    if (header.includes('card') && cardNumCol === -1) cardNumCol = i;
    if (header.includes('player') && playerCol === -1) playerCol = i;
    if (header.includes('team') && teamCol === -1) teamCol = i;
    if (header.includes('sequence') && sequenceCol === -1) sequenceCol = i;
  }

  // Handle case where first column has set data but no header
  if (setCol === -1 && data[1]?.[0]) {
    setCol = 0;
  }

  console.log('📍 Column mappings:');
  console.log(`  Set: ${setCol}, Card: ${cardNumCol}, Player: ${playerCol}, Team: ${teamCol}, Sequence: ${sequenceCol}`);

  // Build complete mapping by set
  const setMappings = new Map<string, SetCardMapping>();
  const allCards: CompleteCardData[] = [];

  // Focus on sets that need individual print runs
  const targetSets = [
    'Signature Series',
    'Signature Series Black',
    'Signature Series Blue',
    'Signature Series Gold',
    'Signature Series Red',
    'Signature Series Dragon Scale',
    'Signature Series Pink Ice',
    'Signature Series Pink Velocity',
    'Beautiful Game Autographs',
    'Beautiful Game Autographs Black',
    'Beautiful Game Autographs Blue',
    'Beautiful Game Autographs Gold',
    'Beautiful Game Autographs Red',
    'Beautiful Game Autographs Dragon Scale',
    'Beautiful Game Autographs Pink Ice',
    'Beautiful Game Autographs Pink Velocity',
    'Beautiful Game Dual Autographs',
    'Beautiful Game Dual Autographs Black',
    'Beautiful Game Dual Autographs Blue',
    'Beautiful Game Dual Autographs Gold',
    'Beautiful Game Dual Autographs Red',
    'Beautiful Game Dual Autographs Dragon Scale',
    'Beautiful Game Dual Autographs Pink Ice',
    'Beautiful Game Dual Autographs Pink Velocity',
    'Kit Series Gold'
  ];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[setCol]) continue;

    const setName = String(row[setCol]).trim();

    // Only process target sets
    if (!targetSets.includes(setName)) continue;

    const cardNumber = cardNumCol >= 0 && row[cardNumCol] ? String(row[cardNumCol]).trim() : '';
    const playerName = playerCol >= 0 && row[playerCol] ? String(row[playerCol]).trim() : '';
    const team = teamCol >= 0 && row[teamCol] ? String(row[teamCol]).trim() : '';
    const sequence = sequenceCol >= 0 ? row[sequenceCol] : null;
    const printRun = extractPrintRun(sequence);

    const card: CompleteCardData = {
      setName,
      cardNumber,
      playerName,
      team,
      printRun,
      sequence: sequence ? String(sequence) : null
    };

    allCards.push(card);

    // Add to set mapping
    if (!setMappings.has(setName)) {
      setMappings.set(setName, {
        setName,
        cards: []
      });
    }

    setMappings.get(setName)!.cards.push(card);
  }

  console.log(`\n📊 EXTRACTION COMPLETE: ${allCards.length} cards across ${setMappings.size} sets\n`);

  // Generate detailed report
  console.log('📦 Sets with Individual Print Runs:\n');

  const sortedSets = Array.from(setMappings.values()).sort((a, b) => a.setName.localeCompare(b.setName));

  for (const setData of sortedSets) {
    console.log(`${setData.setName} (${setData.cards.length} cards)`);

    // Show print run distribution
    const printRunDist = new Map<number | null, number>();
    for (const card of setData.cards) {
      const key = card.printRun;
      printRunDist.set(key, (printRunDist.get(key) || 0) + 1);
    }

    const sortedDist = Array.from(printRunDist.entries()).sort((a, b) => {
      if (a[0] === null) return 1;
      if (b[0] === null) return -1;
      return a[0] - b[0];
    });

    console.log('  Print run distribution:');
    for (const [pr, count] of sortedDist) {
      const prStr = pr === null ? 'UNNUMBERED' : `/${pr}`;
      console.log(`    ${prStr}: ${count} cards`);
    }

    // Show first few cards as examples
    console.log('  Sample cards:');
    for (let i = 0; i < Math.min(3, setData.cards.length); i++) {
      const card = setData.cards[i];
      const prStr = card.printRun === null ? 'UNNUMBERED' : `/${card.printRun}`;
      console.log(`    #${card.cardNumber || 'N/A'} ${card.playerName || 'Unknown'} - ${prStr}`);
    }
    console.log();
  }

  // Save complete mapping to file
  const mappingData = {
    timestamp: new Date().toISOString(),
    totalCards: allCards.length,
    totalSets: setMappings.size,
    sets: sortedSets
  };

  const outputPath = path.join(process.cwd(), 'scripts', 'complete-card-print-runs.json');
  fs.writeFileSync(outputPath, JSON.stringify(mappingData, null, 2));
  console.log(`💾 Complete card data saved to: ${outputPath}`);
  console.log(`   Total cards: ${allCards.length}`);
  console.log(`   Total sets: ${setMappings.size}\n`);

  // Also save a simplified version for easier processing
  const simplifiedData = allCards.map(card => ({
    setName: card.setName,
    cardNumber: card.cardNumber,
    playerName: card.playerName,
    printRun: card.printRun
  }));

  const simplifiedPath = path.join(process.cwd(), 'scripts', 'simplified-print-runs.json');
  fs.writeFileSync(simplifiedPath, JSON.stringify(simplifiedData, null, 2));
  console.log(`💾 Simplified data saved to: ${simplifiedPath}\n`);
}

// Run the extraction
extractCompletePrintRuns().catch(console.error);