/**
 * Import script for 2016-17 Panini Gold Standard Basketball
 *
 * This script imports all sets and cards from the official checklist CSV.
 * Gold Standard features:
 * - Base Set (200 cards /269) with parallels: Base Black (/15), Base AU (/79)
 * - Autograph sets: AU, 14K Autographs, Gold Scripts, Gold Standard, Gold Strike Signatures, etc.
 * - Memorabilia sets: Newly Minted Memorabilia family, Golden Pairs/Trios/Quads, Mother Lode, etc.
 * - Insert sets: Photo Variations, Team Variations, Solid Gold
 *
 * Note: The CSV has no card numbers, so we generate sequential numbers per set.
 */

import { prisma } from '@/lib/prisma';
import { generateSetSlug, generateCardSlug } from '@/lib/slugGenerator';
import * as fs from 'fs';
import * as path from 'path';

const CSV_PATH = '/Users/mh/Desktop/2016-17 Panini Gold Standard Basketball/2016-17-Panini-Gold-Standard-Basketball.csv';
const RELEASE_SLUG = '2016-17-panini-gold-standard-basketball';

// Parallel detection patterns
const PARALLEL_PATTERNS: Array<{
  suffix: string;
  getBaseName: (setName: string) => string;
}> = [
  // Tags variants (must come before Prime)
  { suffix: ' Prime Logo Tags', getBaseName: (s) => s.replace(' Prime Logo Tags', '') },
  { suffix: ' Prime Tags', getBaseName: (s) => s.replace(' Prime Tags', '') },
  // Prime/Platinum variants
  { suffix: ' Platinum', getBaseName: (s) => s.replace(' Platinum', '') },
  { suffix: ' Prime', getBaseName: (s) => s.replace(' Prime', '') },
  // Black variants
  { suffix: ' Black', getBaseName: (s) => s.replace(' Black', '') },
];

// Set type classifications
function determineSetType(setName: string): 'Base' | 'Insert' | 'Autograph' | 'Memorabilia' {
  const lower = setName.toLowerCase();

  // Base sets - "Base", "Base AU", "Base Black"
  if (lower === 'base' || lower === 'base au' || lower === 'base black') {
    return 'Base';
  }

  // Autograph sets (including AU standalone)
  if (lower.includes('autograph') || lower.includes('signature') ||
      lower.includes('scripts') || lower.includes('graphs') ||
      lower === 'au' || lower.includes('gold standard') ||
      lower.includes('gold strike') || lower.includes('golden debuts') ||
      lower.includes('good as gold') || lower.includes('14k')) {
    return 'Autograph';
  }

  // Memorabilia sets
  if (lower.includes('memorabilia') || lower.includes('threads') ||
      lower.includes('pairs') || lower.includes('trios') ||
      lower.includes('quads') || lower.includes('bullion') ||
      lower.includes('mother lode') || lower.includes('jumbos')) {
    return 'Memorabilia';
  }

  // Everything else is Insert
  return 'Insert';
}

// Extract parallel info from set name
function extractParallelInfo(setName: string): {
  baseName: string;
  variantName: string | null;
  isParallel: boolean;
} {
  // Check for Base parallels special cases
  if (setName === 'Base AU') {
    return {
      baseName: 'Base',
      variantName: 'AU',
      isParallel: true,
    };
  }

  if (setName === 'Base Black') {
    return {
      baseName: 'Base',
      variantName: 'Black',
      isParallel: true,
    };
  }

  // Check parallel patterns
  for (const pattern of PARALLEL_PATTERNS) {
    if (setName.endsWith(pattern.suffix)) {
      const baseName = pattern.getBaseName(setName);
      const variantName = pattern.suffix.trim();
      return { baseName, variantName, isParallel: true };
    }
  }

  // Not a parallel
  return { baseName: setName, variantName: null, isParallel: false };
}

// Parse CSV with quoted fields
// Format: "Field1,""Field2"",""Field3"",""Field4"""
function parseCSV(content: string): Array<{
  setName: string;
  playerName: string;
  team: string;
  printRun: number | null;
}> {
  const lines = content.split('\n');
  const cards: Array<{
    setName: string;
    playerName: string;
    team: string;
    printRun: number | null;
  }> = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line with quoted fields
    // Format: "SetName,""Player"",""Team"",""Seq."""
    // Remove leading " and trailing """
    const cleanLine = line.replace(/^"|""?"$/g, '');

    // Split by ,"" delimiter and clean up trailing quotes
    const parts = cleanLine.split(/,""/).map(p => p.replace(/"+$/g, '').trim());

    if (parts.length < 4) continue;

    // Remove trailing comma from set name (CSV formatting quirk)
    const setName = parts[0].replace(/,+$/, '');
    const playerName = parts[1];
    const team = parts[2];
    const seqStr = parts[3];

    // Parse print run
    let printRun: number | null = null;
    if (seqStr && !isNaN(parseInt(seqStr))) {
      printRun = parseInt(seqStr);
    }

    cards.push({ setName, playerName, team, printRun });
  }

  return cards;
}

async function main() {
  console.log('Starting 2016-17 Panini Gold Standard Basketball import...\n');

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

  // 4. Group cards by set and assign card numbers
  const cardsBySet = new Map<string, Array<{
    cardNumber: string;
    playerName: string;
    team: string;
    printRun: number | null;
  }>>();

  for (const card of allCards) {
    const existing = cardsBySet.get(card.setName) || [];
    existing.push({
      cardNumber: (existing.length + 1).toString(),
      playerName: card.playerName,
      team: card.team,
      printRun: card.printRun,
    });
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
      'gold-standard-basketball',
      setName,
      setType
    );

    baseSetSlugs.set(setName, slug);

    console.log(`Creating base set: ${setName} (${setType}, ${cards.length} cards)`);

    // Determine set-level print run (if all cards have same print run)
    const printRuns = [...new Set(cards.map(c => c.printRun).filter(p => p !== null))];
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
    const { baseName, variantName, isParallel } = extractParallelInfo(setName);
    if (!isParallel) continue;

    const cards = cardsBySet.get(setName)!;
    const setType = determineSetType(baseName); // Use base set's type

    // Find base set slug
    const baseSetSlug = baseSetSlugs.get(baseName);

    // Determine set-level print run from cards
    const cardPrintRuns = [...new Set(cards.map(c => c.printRun).filter(p => p !== null))];
    const setPrintRun = cardPrintRuns.length === 1 ? cardPrintRuns[0] : null;

    // Generate slug for parallel
    const slug = generateSetSlug(
      '2016-17',
      'gold-standard-basketball',
      baseName,
      setType,
      variantName || undefined,
      setPrintRun
    );

    console.log(`Creating parallel set: ${setName}`);
    console.log(`  Base: ${baseName}, Variant: ${variantName}, Print Run: ${setPrintRun || 'variable'}`);

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
      const cardSlug = generateCardSlug(
        release.manufacturer.name,
        release.name,
        release.year || '',
        baseName, // Use base set name for parallel cards
        card.cardNumber,
        card.playerName,
        variantName, // variant
        card.printRun,
        setType
      );

      return {
        slug: cardSlug,
        cardNumber: card.cardNumber,
        playerName: card.playerName,
        team: card.team,
        setId: dbSet.id,
        variant: variantName,
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

  // 6. Summary
  const setCount = await prisma.set.count({
    where: { releaseId: release.id }
  });

  const cardCount = await prisma.card.count({
    where: { set: { releaseId: release.id } }
  });

  console.log('\n========================================');
  console.log('Import Complete!');
  console.log('========================================');
  console.log(`Sets created: ${setCount}`);
  console.log(`Cards created: ${cardCount}`);
  console.log('========================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
