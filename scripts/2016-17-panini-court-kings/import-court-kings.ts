/**
 * Import script for 2016-17 Panini Court Kings Basketball
 *
 * This script imports all sets and cards from the official checklist CSV.
 * Court Kings features:
 * - Base Set (100 cards) with parallels: Sapphire, Masterpiece (/1)
 * - Multiple insert sets: Aurora, Portraits, Rookie Portraits, Rookies I-IV
 * - Memorabilia sets: Art Nouveau, Performance Art Jerseys, Vintage Materials, etc.
 * - Autograph sets: 5x7 Box Topper Autographs, Fresh Paint
 */

import { prisma } from '@/lib/prisma';
import { generateSetSlug, generateCardSlug } from '@/lib/slugGenerator';
import * as fs from 'fs';
import * as path from 'path';

const CSV_PATH = '/Users/mh/Desktop/2016-17 Panini Court Kings NBA Basketball/ 2016-17 Panini Court Kings Basketball.csv';
const RELEASE_SLUG = '2016-17-panini-court-kings-basketball';

// Parallel relationships: maps variant suffixes to their base set and print run
const PARALLEL_MAPPINGS: Record<string, { baseName: string; printRun: number | null }> = {
  'Masterpiece': { baseName: '', printRun: 1 },
  'Sapphire': { baseName: '', printRun: null },
  'Prime': { baseName: '', printRun: null },
  'Emerald': { baseName: '', printRun: null },
  'Ruby': { baseName: '', printRun: null },
  'Nameplate': { baseName: '', printRun: null },
};

// Set type classifications based on set name
function determineSetType(setName: string): 'Base' | 'Insert' | 'Autograph' | 'Memorabilia' {
  const lower = setName.toLowerCase();

  // Memorabilia sets
  if (lower.includes('memorabilia') ||
      lower.includes('jerseys') ||
      lower.includes('swatches') ||
      lower.includes('materials') ||
      lower.includes('jumbo') ||
      lower.startsWith('art nouveau') ||
      lower.startsWith('artistic endeavors')) {  // Art Nouveau and Artistic Endeavors are memorabilia sets
    return 'Memorabilia';
  }

  // Autograph sets
  if (lower.includes('autograph') ||
      lower.includes('fresh paint') ||
      lower.includes('heir apparent')) {  // Heir Apparent is an autograph set
    return 'Autograph';
  }

  // Base set
  if (lower === 'base set' ||
      lower === 'base set masterpiece' ||
      lower === 'base set sapphire' ||
      lower.startsWith('rookies')) {  // Rookies I-IV are base sets
    return 'Base';
  }

  // Everything else is an Insert
  return 'Insert';
}

// Extract base set name and variant info from full set name
function extractParallelInfo(setName: string): {
  baseName: string;
  variantName: string | null;
  printRun: number | null;
  isParallel: boolean;
} {
  // Check each parallel suffix
  const parallelSuffixes = [
    ' Masterpiece',
    ' Sapphire',
    ' Prime',
    ' Emerald',
    ' Ruby',
    ' Nameplate',
    ' Variation'  // Fresh Paint Variation is a parallel
  ];

  for (const suffix of parallelSuffixes) {
    if (setName.endsWith(suffix)) {
      const baseName = setName.slice(0, -suffix.length);
      const variantName = suffix.trim();

      // Determine print run for this variant
      let printRun: number | null = null;
      if (variantName === 'Masterpiece') printRun = 1;

      return { baseName, variantName, printRun, isParallel: true };
    }
  }

  // Not a parallel
  return { baseName: setName, variantName: null, printRun: null, isParallel: false };
}

// Parse simple CSV (comma-separated, no complex quoting needed for this file)
function parseCSV(content: string): Array<{ setName: string; cardNumber: string; playerName: string; team: string; printRun: number | null }> {
  const lines = content.split('\n');
  const cards: Array<{ setName: string; cardNumber: string; playerName: string; team: string; printRun: number | null }> = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, handling potential quotes
    const parts = line.split(',');
    if (parts.length < 4) continue;

    const setName = parts[0].trim();
    const cardNumber = parts[1].trim();
    const playerName = parts[2].trim();
    const team = parts[3].trim();
    const seqStr = parts[4]?.trim() || '';

    // Parse print run (Seq. column)
    let printRun: number | null = null;
    if (seqStr && !isNaN(parseInt(seqStr))) {
      printRun = parseInt(seqStr);
    }

    cards.push({ setName, cardNumber, playerName, team, printRun });
  }

  return cards;
}

async function main() {
  console.log('Starting 2016-17 Panini Court Kings Basketball import...\n');

  // 1. Find the release
  const release = await prisma.release.findUnique({
    where: { slug: RELEASE_SLUG },
    include: { manufacturer: true }
  });

  if (!release) {
    throw new Error(`Release '${RELEASE_SLUG}' not found! Please create the release first.`);
  }

  console.log(`Found release: ${release.name} (${release.year})`);
  console.log(`Manufacturer: ${release.manufacturer.name}\n`);

  // 2. Read and parse the CSV
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const allCards = parseCSV(csvContent);

  console.log(`Parsed ${allCards.length} cards from CSV\n`);

  // 3. Upload source file to release if not already present
  const sourceFileName = path.basename(CSV_PATH).trim();
  const existingSourceFiles = (release.sourceFiles as any[]) || [];

  if (!existingSourceFiles.some((f: any) => f.filename === sourceFileName)) {
    console.log('Uploading source CSV to release...');
    const csvBase64 = fs.readFileSync(CSV_PATH).toString('base64');

    await prisma.release.update({
      where: { id: release.id },
      data: {
        sourceFiles: [
          ...existingSourceFiles,
          {
            type: 'text/csv',
            filename: sourceFileName,
            url: `data:text/csv;base64,${csvBase64}`
          }
        ]
      }
    });
    console.log('Source file uploaded.\n');
  }

  // 4. Group cards by set
  const cardsBySet = new Map<string, typeof allCards>();
  for (const card of allCards) {
    const existing = cardsBySet.get(card.setName) || [];
    existing.push(card);
    cardsBySet.set(card.setName, existing);
  }

  console.log(`Found ${cardsBySet.size} unique sets\n`);

  // 5. Track base set slugs for parallel relationships
  const baseSetSlugs = new Map<string, string>(); // baseName -> slug

  // First pass: identify and create base sets (non-parallels)
  const sortedSetNames = Array.from(cardsBySet.keys()).sort();

  // Process non-parallels first
  for (const setName of sortedSetNames) {
    const { isParallel } = extractParallelInfo(setName);
    if (isParallel) continue;

    const cards = cardsBySet.get(setName)!;
    const setType = determineSetType(setName);

    // Generate slug
    const slug = generateSetSlug(
      '2016-17',
      'court-kings-basketball',
      setName,
      setType
    );

    baseSetSlugs.set(setName, slug);

    console.log(`Creating base set: ${setName} (${setType}, ${cards.length} cards)`);

    // Determine set-level print run (if all cards have same print run)
    const printRuns = [...new Set(cards.map(c => c.printRun))];
    const setPrintRun = printRuns.length === 1 ? printRuns[0] : null;

    // Create/update set
    const dbSet = await prisma.set.upsert({
      where: { slug },
      create: {
        name: setName,
        slug,
        type: setType,
        releaseId: release.id,
        isParallel: false,
        baseSetSlug: null,
        printRun: setPrintRun
      },
      update: {
        name: setName,
        type: setType,
        printRun: setPrintRun
      }
    });

    // Delete existing cards and insert new ones
    await prisma.card.deleteMany({ where: { setId: dbSet.id } });

    const cardData = cards.map(card => {
      const cardSlug = generateCardSlug(
        release.manufacturer.name,
        release.name,
        release.year || '',
        setName,
        card.cardNumber,
        card.playerName,
        null, // variant
        card.printRun,
        setType
      );

      return {
        slug: cardSlug,
        cardNumber: card.cardNumber,
        playerName: card.playerName,
        team: card.team,
        setId: dbSet.id,
        variant: null,
        printRun: card.printRun,
        numbered: card.printRun ? (card.printRun === 1 ? '1 of 1' : `/${card.printRun}`) : null
      };
    });

    await prisma.card.createMany({
      data: cardData,
      skipDuplicates: true
    });

    console.log(`  Created ${cardData.length} cards\n`);
  }

  // Second pass: create parallel sets
  for (const setName of sortedSetNames) {
    const { baseName, variantName, printRun: variantPrintRun, isParallel } = extractParallelInfo(setName);
    if (!isParallel) continue;

    const cards = cardsBySet.get(setName)!;
    const setType = determineSetType(baseName); // Use base set's type

    // Find base set slug
    const baseSetSlug = baseSetSlugs.get(baseName);

    // Generate slug for parallel
    const slug = generateSetSlug(
      '2016-17',
      'court-kings-basketball',
      baseName,
      setType,
      variantName || undefined,
      variantPrintRun
    );

    console.log(`Creating parallel set: ${setName}`);
    console.log(`  Base: ${baseName}, Variant: ${variantName}, Print Run: ${variantPrintRun || 'unnumbered'}`);

    // Determine set-level print run
    const cardPrintRuns = [...new Set(cards.map(c => c.printRun))];
    const setPrintRun = variantPrintRun || (cardPrintRuns.length === 1 ? cardPrintRuns[0] : null);

    // Create/update set
    const dbSet = await prisma.set.upsert({
      where: { slug },
      create: {
        name: setName,
        slug,
        type: setType,
        releaseId: release.id,
        isParallel: true,
        baseSetSlug: baseSetSlug || null,
        printRun: setPrintRun
      },
      update: {
        name: setName,
        type: setType,
        isParallel: true,
        baseSetSlug: baseSetSlug || null,
        printRun: setPrintRun
      }
    });

    // Delete existing cards and insert new ones
    await prisma.card.deleteMany({ where: { setId: dbSet.id } });

    const cardData = cards.map(card => {
      // For parallel cards, use the card's individual print run or fall back to variant print run
      const cardPrintRun = card.printRun || variantPrintRun;

      const cardSlug = generateCardSlug(
        release.manufacturer.name,
        release.name,
        release.year || '',
        baseName,
        card.cardNumber,
        card.playerName,
        variantName,
        cardPrintRun,
        setType
      );

      return {
        slug: cardSlug,
        cardNumber: card.cardNumber,
        playerName: card.playerName,
        team: card.team,
        setId: dbSet.id,
        variant: variantName,
        printRun: cardPrintRun,
        numbered: cardPrintRun ? (cardPrintRun === 1 ? '1 of 1' : `/${cardPrintRun}`) : null
      };
    });

    await prisma.card.createMany({
      data: cardData,
      skipDuplicates: true
    });

    console.log(`  Created ${cardData.length} cards\n`);
  }

  // 6. Summary
  console.log('\n========================================');
  console.log('Import Complete!');
  console.log('========================================\n');

  // Count totals
  const setCount = await prisma.set.count({
    where: { releaseId: release.id }
  });

  const cardCount = await prisma.card.count({
    where: { set: { releaseId: release.id } }
  });

  console.log(`Total sets created: ${setCount}`);
  console.log(`Total cards created: ${cardCount}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error during import:', error);
  prisma.$disconnect();
  process.exit(1);
});
