import { PrismaClient } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '../../../lib/slugGenerator';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const RELEASE_SLUG = '2016-17-panini-flawless-basketball';
const CSV_PATH = path.join(__dirname, 'flawless-checklist.csv');

type SetType = 'Base' | 'Autograph' | 'Memorabilia' | 'Insert';

interface CardRow {
  set_name: string;
  card_number: string;
  player_name: string;
  team: string;
}

interface ParallelInfo {
  baseSetName: string;
  variantName: string | null;
  printRun: number;
  isParallel: boolean;
}

// Flawless print run mapping
const FLAWLESS_PRINT_RUNS: Record<string, number> = {
  '': 20,              // Base (no suffix)
  'Bronze': 20,        // Same as base
  'Double Diamond': 10,
  'Triple Diamond': 5,
  'Emerald': 5,
  'Gold': 10,
  'Ruby': 15,
  'Platinum': 1,
  'Gold Proof': 1,
  'Emerald Gold Proof': 1,
  'Gold Gold Proof': 1,
  'Ruby Gold Proof': 1,
  'Silver Gold Proof': 1,
  'Logoman': 1,
  'Silver': 20,        // USA Basketball Silver
};

/**
 * Extract parallel information from set name
 */
function extractParallelInfo(setName: string): ParallelInfo {
  // Nested Gold Proof variants - these are parallels of their color tier
  const nestedGoldProofs = [
    { suffix: 'Emerald Gold Proof', baseOf: 'Emerald', printRun: 1 },
    { suffix: 'Gold Gold Proof', baseOf: 'Gold', printRun: 1 },
    { suffix: 'Ruby Gold Proof', baseOf: 'Ruby', printRun: 1 },
    { suffix: 'Silver Gold Proof', baseOf: 'Silver', printRun: 1 },
  ];

  // Check nested Gold Proofs first
  for (const { suffix, baseOf, printRun } of nestedGoldProofs) {
    if (setName.endsWith(' ' + suffix)) {
      const rootSetName = setName.slice(0, -suffix.length - 1);
      return {
        baseSetName: rootSetName + ' ' + baseOf, // e.g., "Flawless Autographs Emerald"
        variantName: 'Gold Proof',
        printRun,
        isParallel: true,
      };
    }
  }

  // Standard parallels - these are parallels of the base set
  const standardParallels = [
    { suffix: 'Gold Proof', printRun: 1 },
    { suffix: 'Platinum', printRun: 1 },
    { suffix: 'Logoman', printRun: 1 },
    { suffix: 'Triple Diamond', printRun: 5 },
    { suffix: 'Double Diamond', printRun: 10 },
    { suffix: 'Emerald', printRun: 5 },
    { suffix: 'Gold', printRun: 10 },
    { suffix: 'Ruby', printRun: 15 },
    { suffix: 'Bronze', printRun: 20 },
    { suffix: 'Silver', printRun: 20 },
  ];

  for (const { suffix, printRun } of standardParallels) {
    if (setName.endsWith(' ' + suffix)) {
      const baseSetName = setName.slice(0, -suffix.length - 1);
      return {
        baseSetName,
        variantName: suffix,
        printRun,
        isParallel: true,
      };
    }
  }

  // Base set (no suffix)
  return {
    baseSetName: setName,
    variantName: null,
    printRun: 20, // Default Flawless base print run
    isParallel: false,
  };
}

/**
 * Determine set type from set name
 */
function determineSetType(setName: string): SetType {
  const lower = setName.toLowerCase();

  // Base sets
  if (lower.includes('base set')) {
    return 'Base';
  }

  // Check for autograph keywords (including sets with both patch and signature)
  if (
    lower.includes('autograph') ||
    lower.includes('signature') ||
    lower.includes('ink')
  ) {
    return 'Autograph';
  }

  // Check for memorabilia keywords
  if (
    lower.includes('patch') ||
    lower.includes('memorabilia') ||
    lower.includes('tags') ||
    lower.includes('swatch') ||
    lower.includes('logoman')
  ) {
    return 'Memorabilia';
  }

  // Everything else is Insert
  return 'Insert';
}

/**
 * Parse CSV file into card rows
 */
function parseCSV(filePath: string): CardRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  const rows: CardRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= 4) {
      rows.push({
        set_name: values[0].trim(),
        card_number: values[1].trim(),
        player_name: values[2].trim(),
        team: values[3].trim(),
      });
    }
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

/**
 * Get or create a set in the database
 */
async function getOrCreateSet(
  setName: string,
  releaseId: string,
  cardCount: number
): Promise<{ id: string; slug: string }> {
  const parallelInfo = extractParallelInfo(setName);
  const setType = determineSetType(setName);

  // Generate slug
  let slug: string;
  let baseSetSlug: string | null = null;

  if (parallelInfo.isParallel && parallelInfo.variantName) {
    // For parallels, need to determine the base set slug
    const baseParallelInfo = extractParallelInfo(parallelInfo.baseSetName);

    if (baseParallelInfo.isParallel) {
      // This is a nested parallel (e.g., Emerald Gold Proof is parallel of Emerald)
      // The base is the color tier set (e.g., Flawless Autographs Emerald)
      baseSetSlug = generateSetSlug(
        '2016-17',
        'Flawless Basketball',
        baseParallelInfo.baseSetName,
        setType,
        baseParallelInfo.variantName,
        baseParallelInfo.printRun
      );
    } else {
      // Standard parallel - base is the root set
      baseSetSlug = generateSetSlug(
        '2016-17',
        'Flawless Basketball',
        parallelInfo.baseSetName,
        setType
      );
    }

    slug = generateSetSlug(
      '2016-17',
      'Flawless Basketball',
      parallelInfo.baseSetName,
      setType,
      parallelInfo.variantName,
      parallelInfo.printRun
    );
  } else {
    // Non-parallel set
    slug = generateSetSlug(
      '2016-17',
      'Flawless Basketball',
      setName,
      setType
    );
  }

  // Check if set exists
  const existingSet = await prisma.set.findUnique({ where: { slug } });

  if (existingSet) {
    return { id: existingSet.id, slug: existingSet.slug };
  }

  // Create set
  const newSet = await prisma.set.create({
    data: {
      name: setName,
      slug,
      type: setType,
      releaseId,
      expectedCardCount: cardCount,
      printRun: parallelInfo.printRun,
      isParallel: parallelInfo.isParallel,
      baseSetSlug,
    },
  });

  return { id: newSet.id, slug: newSet.slug };
}

/**
 * Main import function
 */
async function importFlawless() {
  console.log('Starting 2016-17 Panini Flawless Basketball import...\n');

  // Find the release
  const release = await prisma.release.findUnique({
    where: { slug: RELEASE_SLUG },
    include: { manufacturer: true },
  });

  if (!release) {
    throw new Error(`Release not found: ${RELEASE_SLUG}`);
  }

  console.log(`Found release: ${release.name} (${release.id})\n`);

  // Upload source file to release.sourceFiles
  const csvFilename = path.basename(CSV_PATH);
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const currentSourceFiles = (release.sourceFiles as any[]) || [];
  const fileExists = currentSourceFiles.some(
    (file: any) => file.filename === csvFilename
  );

  if (!fileExists) {
    console.log(`Uploading source file: ${csvFilename}`);
    const updatedSourceFiles = [
      ...currentSourceFiles,
      {
        filename: csvFilename,
        type: 'csv',
        content: csvContent,
        uploadedAt: new Date().toISOString(),
      },
    ];
    await prisma.release.update({
      where: { id: release.id },
      data: { sourceFiles: updatedSourceFiles },
    });
    console.log('Source file uploaded.\n');
  }

  // Parse CSV
  console.log(`Reading CSV: ${CSV_PATH}`);
  const rows = parseCSV(CSV_PATH);
  console.log(`Found ${rows.length} cards\n`);

  // Group cards by set
  const cardsBySet = new Map<string, CardRow[]>();
  for (const row of rows) {
    if (!cardsBySet.has(row.set_name)) {
      cardsBySet.set(row.set_name, []);
    }
    cardsBySet.get(row.set_name)!.push(row);
  }

  console.log(`Found ${cardsBySet.size} unique sets\n`);

  // Process each set
  let setCount = 0;
  let cardCount = 0;
  let skippedCards = 0;

  for (const [setName, cards] of cardsBySet.entries()) {
    console.log(`Processing: ${setName} (${cards.length} cards)`);

    const parallelInfo = extractParallelInfo(setName);
    const setType = determineSetType(setName);

    console.log(`  Type: ${setType}`);
    console.log(`  Is Parallel: ${parallelInfo.isParallel}`);
    if (parallelInfo.isParallel) {
      console.log(`  Base Set: ${parallelInfo.baseSetName}`);
      console.log(`  Variant: ${parallelInfo.variantName}`);
    }
    console.log(`  Print Run: ${parallelInfo.printRun}`);

    // Get or create set
    const dbSet = await getOrCreateSet(setName, release.id, cards.length);
    console.log(`  Slug: ${dbSet.slug}`);
    setCount++;

    // Create cards
    let createdCards = 0;
    for (const card of cards) {
      const cardPrintRun = parallelInfo.printRun;

      const cardSlug = generateCardSlug(
        release.manufacturer.name,
        release.name,
        release.year || '2016-17',
        parallelInfo.baseSetName,
        card.card_number,
        card.player_name,
        parallelInfo.variantName,
        cardPrintRun,
        setType
      );

      try {
        await prisma.card.create({
          data: {
            slug: cardSlug,
            playerName: card.player_name,
            team: card.team,
            cardNumber: card.card_number,
            variant: parallelInfo.variantName,
            printRun: cardPrintRun,
            isNumbered: cardPrintRun !== null,
            numbered:
              cardPrintRun === 1 ? '1 of 1' : cardPrintRun ? `/${cardPrintRun}` : null,
            rarity:
              cardPrintRun === 1
                ? 'one_of_one'
                : cardPrintRun && cardPrintRun <= 10
                ? 'ultra_rare'
                : cardPrintRun && cardPrintRun <= 50
                ? 'super_rare'
                : cardPrintRun && cardPrintRun <= 199
                ? 'rare'
                : 'base',
            hasAutograph:
              setType === 'Autograph' ||
              setName.toLowerCase().includes('autograph') ||
              setName.toLowerCase().includes('signature') ||
              setName.toLowerCase().includes('ink'),
            hasMemorabilia:
              setType === 'Memorabilia' ||
              setName.toLowerCase().includes('patch') ||
              setName.toLowerCase().includes('memorabilia') ||
              setName.toLowerCase().includes('swatch') ||
              setName.toLowerCase().includes('tags') ||
              setName.toLowerCase().includes('logoman') ||
              setName.toLowerCase().includes('materials'),
            setId: dbSet.id,
          },
        });
        createdCards++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint violation - card already exists
          skippedCards++;
        } else {
          console.error(`    Error creating card ${card.card_number}: ${error.message}`);
          throw error;
        }
      }
    }

    cardCount += createdCards;
    console.log(`  Created ${createdCards}/${cards.length} cards\n`);
  }

  console.log('='.repeat(60));
  console.log(`Import complete!`);
  console.log(`  Sets: ${setCount}`);
  console.log(`  Cards: ${cardCount}`);
  console.log(`  Skipped (duplicates): ${skippedCards}`);
  console.log('='.repeat(60));
}

importFlawless()
  .catch((error) => {
    console.error('Error during import:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
