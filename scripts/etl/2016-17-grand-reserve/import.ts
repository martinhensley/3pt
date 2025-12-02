/**
 * ETL Import Script for 2016-17 Panini Grand Reserve Basketball
 *
 * CRITICAL NOTE: Rookie Cornerstones (#101-140) are part of the Base set
 */

import { PrismaClient, SetType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { uploadChecklistToRelease, getExistingChecklist } from '../../../lib/checklistUploader';

const prisma = new PrismaClient();

const RELEASE_SLUG = '2016-17-panini-grand-reserve-basketball';
const CHECKLIST_PATH = path.join(__dirname, 'checklist.csv');
const ORIGINAL_FILE_PATH = path.join(__dirname, '2016-17-Panini-Grand-Reserve-NBA-Basketball-Cards-Checklist.pdf');

// Parallel variant mappings - standard print runs for this release
const PARALLEL_VARIANTS: Record<string, { printRun: number | null; suffix: string }> = {
  'Vintage': { printRun: null, suffix: 'vintage' },
  'Granite': { printRun: 25, suffix: 'granite' },
  'Marble': { printRun: 10, suffix: 'marble' },
  'Onyx': { printRun: 1, suffix: 'onyx' },
  'Quartz': { printRun: 49, suffix: 'quartz' },
  'Tag': { printRun: 1, suffix: 'tag' },
};

interface CardRow {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
  printRun: number | null;
}

function parseCSV(content: string): CardRow[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  const setIdx = headers.findIndex(h => h.includes('Card Set'));
  const numIdx = headers.findIndex(h => h === '#');
  const playerIdx = headers.findIndex(h => h.includes('Player'));
  const teamIdx = headers.findIndex(h => h.includes('Team'));
  const seqIdx = headers.findIndex(h => h.includes('Seq'));

  const cards: CardRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const setName = values[setIdx]?.trim() || '';
    const cardNumber = values[numIdx]?.trim() || '';
    const playerName = values[playerIdx]?.trim() || '';
    const team = values[teamIdx]?.trim() || '';
    const seq = values[seqIdx]?.trim();
    const printRun = seq && !isNaN(Number(seq)) ? Number(seq) : null;

    if (setName && cardNumber && playerName) {
      cards.push({ setName, cardNumber, playerName, team, printRun });
    }
  }

  return cards;
}

function determineSetType(setName: string): SetType {
  const lower = setName.toLowerCase();

  // Autograph sets
  if (lower.includes('autograph') || lower.includes('signature')) {
    return 'Autograph';
  }

  // Memorabilia sets
  if (lower.includes('materials') || lower.includes('cornerstone') ||
      lower.includes('hickory') || lower.includes('local legends') ||
      lower.includes('closing statements') || lower.includes('team slogans') ||
      lower.includes('number ones') || lower.includes('one-of-a-kind')) {
    return 'Memorabilia';
  }

  // Base sets
  if (lower.includes('base')) {
    return 'Base';
  }

  // Everything else is Insert
  return 'Insert';
}

function extractParallelInfo(setName: string): { baseSetName: string; variantName: string | null; isParallel: boolean } {
  // Check for parallel variants
  for (const [variant, _] of Object.entries(PARALLEL_VARIANTS)) {
    if (setName.includes(variant)) {
      const baseSetName = setName.replace(variant, '').trim();
      return { baseSetName, variantName: variant, isParallel: true };
    }
  }

  return { baseSetName: setName, variantName: null, isParallel: false };
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateSetSlug(
  year: string,
  releaseName: string,
  setName: string,
  variantName: string | null,
  printRun: number | null
): string {
  const parts = [year, releaseName, setName];

  if (variantName) {
    parts.push(variantName, 'parallel');
    if (printRun) {
      parts.push(printRun === 1 ? '1-of-1' : printRun.toString());
    }
  }

  return generateSlug(parts.join(' '));
}

function generateCardSlug(
  year: string,
  releaseName: string,
  setName: string,
  cardNumber: string,
  playerName: string,
  variantName: string | null,
  printRun: number | null
): string {
  const parts = [year, releaseName, setName, cardNumber, playerName];

  if (variantName) {
    parts.push(variantName);
  }

  if (printRun) {
    parts.push(printRun === 1 ? '1-of-1' : printRun.toString());
  }

  return generateSlug(parts.join(' '));
}

async function importData() {
  console.log('🏀 Starting import for 2016-17 Panini Grand Reserve Basketball\n');

  // Find existing release
  const release = await prisma.release.findUnique({
    where: { slug: RELEASE_SLUG }
  });

  if (!release) {
    throw new Error(`Release '${RELEASE_SLUG}' not found in database. Please create the release first.`);
  }

  console.log(`✅ Found existing release: ${release.name} (${release.slug})\n`);

  // Read and parse checklist
  const csvContent = fs.readFileSync(CHECKLIST_PATH, 'utf8');
  const cards = parseCSV(csvContent);
  console.log(`📊 Parsed ${cards.length} card rows from checklist\n`);

  // Upload source document to Vercel Blob
  const originalFilename = path.basename(ORIGINAL_FILE_PATH);

  const existingDoc = await getExistingChecklist(release.id, originalFilename);

  if (!existingDoc) {
    await uploadChecklistToRelease(ORIGINAL_FILE_PATH, release.id, 'Checklist');
    console.log(`📎 Uploaded source document: ${originalFilename}\n`);
  } else {
    console.log(`📎 Source document already exists: ${originalFilename}\n`);
  }

  // Group cards by set, handling the Rookie Cornerstones -> Base merge
  const cardsBySet = new Map<string, CardRow[]>();

  for (const card of cards) {
    let effectiveSetName = card.setName;

    // CRITICAL: Merge Rookie Cornerstones into Base Set
    if (card.setName === 'Rookie Cornerstones') {
      effectiveSetName = 'Base Set';
    } else if (card.setName.startsWith('Rookie Cornerstones ')) {
      // Handle parallels: "Rookie Cornerstones Granite" -> "Base Set Granite"
      const variant = card.setName.replace('Rookie Cornerstones ', '');
      effectiveSetName = `Base Set ${variant}`;
    }

    if (!cardsBySet.has(effectiveSetName)) {
      cardsBySet.set(effectiveSetName, []);
    }
    cardsBySet.get(effectiveSetName)!.push({ ...card, setName: effectiveSetName });
  }

  console.log(`📦 Grouped into ${cardsBySet.size} sets\n`);

  // Process each set
  let totalCardsCreated = 0;
  let setsCreated = 0;

  for (const [setName, setCards] of cardsBySet) {
    const { baseSetName, variantName, isParallel } = extractParallelInfo(setName);
    const setType = determineSetType(baseSetName);

    // Determine print run for the set
    // Use the most common print run, or the variant default
    let setPrintRun: number | null = null;
    if (isParallel && variantName && PARALLEL_VARIANTS[variantName]) {
      setPrintRun = PARALLEL_VARIANTS[variantName].printRun;
    }

    // Generate set slug
    const setSlug = generateSetSlug('2016-17', 'grand-reserve', baseSetName, variantName, setPrintRun);

    // Generate base set slug for parallels
    const baseSetSlug = isParallel
      ? generateSetSlug('2016-17', 'grand-reserve', baseSetName, null, null)
      : null;

    // Clean up display name
    let displayName = setName.replace(' Set', '');
    if (displayName === 'Base') displayName = 'Base';

    // Upsert the set
    const dbSet = await prisma.set.upsert({
      where: { slug: setSlug },
      create: {
        name: displayName,
        slug: setSlug,
        type: setType,
        releaseId: release.id,
        isParallel,
        baseSetSlug,
        printRun: setPrintRun,
        expectedCardCount: setCards.length,
      },
      update: {
        name: displayName,
        type: setType,
        expectedCardCount: setCards.length,
      }
    });

    setsCreated++;
    console.log(`  📁 ${isParallel ? '↳' : '•'} ${displayName} (${setType}) - ${setCards.length} cards - ${setSlug}`);

    // Create cards
    for (const card of setCards) {
      const cardSlug = generateCardSlug(
        '2016-17',
        'grand-reserve',
        baseSetName,
        card.cardNumber,
        card.playerName,
        variantName,
        card.printRun
      );

      // Determine the numbered display string
      let numbered: string | null = null;
      if (card.printRun) {
        numbered = card.printRun === 1 ? '1 of 1' : `/${card.printRun}`;
      } else if (setPrintRun) {
        numbered = setPrintRun === 1 ? '1 of 1' : `/${setPrintRun}`;
      }

      try {
        await prisma.card.upsert({
          where: { slug: cardSlug },
          create: {
            setId: dbSet.id,
            cardNumber: card.cardNumber,
            playerName: card.playerName,
            team: card.team || null,
            variant: variantName,
            printRun: card.printRun || setPrintRun,
            numbered,
            slug: cardSlug,
          },
          update: {
            playerName: card.playerName,
            team: card.team || null,
            variant: variantName,
            printRun: card.printRun || setPrintRun,
            numbered,
          }
        });
        totalCardsCreated++;
      } catch (error) {
        console.error(`    ⚠️ Error creating card: ${cardSlug}`, error);
      }
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Sets: ${setsCreated}`);
  console.log(`   Cards: ${totalCardsCreated}`);
}

importData()
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
