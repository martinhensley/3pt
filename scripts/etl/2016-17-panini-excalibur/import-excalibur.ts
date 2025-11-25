/**
 * Import script for 2016-17 Panini Excalibur Basketball
 *
 * This script imports all sets and cards from the official checklist CSV.
 * Excalibur features:
 * - Base Set (200 cards) with 9 parallels: Baron, Count, Duke(/49), Emporer(/1), King(/10), Lord, Marquis(/199), Prince(/149), Viscount
 * - Crusade insert sets (8 color variants)
 * - Multiple insert sets: Battlements, Coat of Arms, Kaboom, Knight in Shining Armor, etc.
 * - Memorabilia sets: Apprentice Shield, Armory, Emblem, Knights Cloak, Team USA
 * - Autograph sets: Apprentice Signature, Calligraphy, Manuscripts, Signature Knights
 */

import { prisma } from '@/lib/prisma';
import { generateSetSlug, generateCardSlug } from '@/lib/slugGenerator';
import * as fs from 'fs';
import * as path from 'path';

const CSV_PATH = '/Users/mh/Desktop/2016-17 Panini Excalibur Basketball/Basketball2016PaniniExcalibur-(.csv';
const RELEASE_SLUG = '2016-17-panini-excalibur-basketball';

// Base set parallels - these map "Base X" to base set "Base"
const BASE_PARALLELS: Record<string, number | null> = {
  'Baron': null,
  'Count': null,
  'Duke': 49,
  'Emporer': 1,
  'King': 10,
  'Lord': null,
  'Marquis': 199,
  'Prince': 149,
  'Viscount': null,
};

// Generic parallel suffixes with optional print runs
const GENERIC_PARALLEL_SUFFIXES = [
  { suffix: ' Prime', printRun: null },
  { suffix: ' Holo Gold', printRun: 10 },
  { suffix: ' Gunmetal', printRun: 1 },
  { suffix: ' Red', printRun: 99 },
  { suffix: ' Blue', printRun: null }, // varies: 149 or 199
  { suffix: ' Purple', printRun: null }, // varies: 25 or 49
  { suffix: ' Black', printRun: 1 },
  { suffix: ' Gold', printRun: 10 },
  { suffix: ' Orange', printRun: 25 },
  { suffix: ' Silver', printRun: null },
  { suffix: ' Camo', printRun: null },
];

// Set type classifications based on set name
function determineSetType(setName: string): 'Base' | 'Insert' | 'Autograph' | 'Memorabilia' {
  const lower = setName.toLowerCase();

  // Memorabilia (material/jersey cards)
  if (lower.includes('shield') || lower.includes('armory') ||
      lower.includes('emblem') || lower.includes('cloak') ||
      lower.includes('team usa')) {
    return 'Memorabilia';
  }

  // Autographs
  if (lower.includes('signature') || lower.includes('calligraphy') ||
      lower.includes('manuscripts')) {
    return 'Autograph';
  }

  // Base (includes all Base parallels)
  if (lower.startsWith('base')) {
    return 'Base';
  }

  // Everything else is Insert
  return 'Insert';
}

// Extract base set name and variant info from full set name
function extractParallelInfo(setName: string): {
  baseName: string;
  variantName: string | null;
  printRun: number | null;
  isParallel: boolean;
} {
  // Check for "Base X" pattern (Base parallels)
  if (setName.startsWith('Base ')) {
    const variant = setName.substring(5); // Remove "Base "
    if (BASE_PARALLELS.hasOwnProperty(variant)) {
      return {
        baseName: 'Base',
        variantName: variant,
        printRun: BASE_PARALLELS[variant],
        isParallel: true,
      };
    }
  }

  // Check for Crusade variants (all are numbered, no base set)
  if (setName.startsWith('Crusade ')) {
    const variant = setName.substring(8); // Remove "Crusade "
    // Crusade Silver and Camo are unnumbered base-like sets
    if (variant === 'Silver' || variant === 'Camo') {
      return {
        baseName: setName,
        variantName: null,
        printRun: null,
        isParallel: false,
      };
    }
    // Other Crusade variants are numbered parallels of Crusade Silver
    const crusadePrintRuns: Record<string, number | null> = {
      'Black': 1,
      'Blue': 149,
      'Gold': 10,
      'Orange': 25,
      'Purple': 49,
      'Red': 99,
    };
    if (crusadePrintRuns.hasOwnProperty(variant)) {
      return {
        baseName: 'Crusade Silver',
        variantName: variant,
        printRun: crusadePrintRuns[variant],
        isParallel: true,
      };
    }
  }

  // Check generic parallel suffixes
  for (const { suffix, printRun } of GENERIC_PARALLEL_SUFFIXES) {
    if (setName.endsWith(suffix)) {
      const baseName = setName.slice(0, -suffix.length);
      const variantName = suffix.trim();
      return { baseName, variantName, printRun, isParallel: true };
    }
  }

  // Not a parallel
  return { baseName: setName, variantName: null, printRun: null, isParallel: false };
}

// Parse simple CSV (comma-separated)
function parseCSV(content: string): Array<{ setName: string; cardNumber: string; playerName: string; team: string; printRun: number | null }> {
  const lines = content.split('\n');
  const cards: Array<{ setName: string; cardNumber: string; playerName: string; team: string; printRun: number | null }> = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma
    const parts = line.split(',');
    if (parts.length < 4) continue;

    const setName = parts[0].trim();
    const cardNumber = parts[1].trim();
    const playerName = parts[2].trim();
    const team = parts[3].trim();
    const seqStr = parts[4]?.trim() || '';

    // Parse print run (Seq. column)
    let printRun: number | null = null;
    if (seqStr && !isNaN(parseFloat(seqStr))) {
      printRun = parseInt(seqStr);
    }

    cards.push({ setName, cardNumber, playerName, team, printRun });
  }

  return cards;
}

async function main() {
  console.log('Starting 2016-17 Panini Excalibur Basketball import...\n');

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
      'excalibur-basketball',
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
    const { baseName, variantName, printRun: variantPrintRun, isParallel } = extractParallelInfo(setName);
    if (!isParallel) continue;

    const cards = cardsBySet.get(setName)!;
    const setType = determineSetType(baseName); // Use base set's type

    // Find base set slug
    const baseSetSlug = baseSetSlugs.get(baseName);

    // Generate slug for parallel
    const slug = generateSetSlug(
      '2016-17',
      'excalibur-basketball',
      baseName,
      setType,
      variantName || undefined,
      variantPrintRun
    );

    console.log(`Creating parallel set: ${setName}`);
    console.log(`  Base: ${baseName}, Variant: ${variantName}, Print Run: ${variantPrintRun || 'unnumbered'}`);

    // Determine set-level print run from cards if not specified by variant
    const cardPrintRuns = [...new Set(cards.map(c => c.printRun).filter(p => p !== null))];
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
