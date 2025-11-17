import { PrismaClient, SetType } from '@prisma/client';
import * as XLSX from 'xlsx';
import { generateCardSlug } from '@/lib/slugGenerator';
import { uploadChecklistToRelease, getExistingChecklist } from '@/lib/checklistUploader';
import path from 'path';

const prisma = new PrismaClient();

const CHECKLIST_PATH = '/Users/mh/Desktop/2022-23-Donruss-Soccer-Cards-Checklist.xls';
const SHEET_NAME = '2022 Donruss Donruss (22-23) (S';

// Print run mapping for parallels
const PRINT_RUNS: Record<string, number | null> = {
  // Base/Rated Rookies Parallels
  'Black': 1,
  'Green': 5,
  'Gold': 10,
  'Purple': 25,
  'Blue': 49,
  'Red': 99,
  'Teal': 199,
  'Silver': null,
  'Orange': null,
  'Pink': null,

  // Optic Parallels
  'Dragon': 8,
  'Photon': null,
  'Holo': null,
  'Green Ice': null,
  'Orange Ice': null,
  'Pink Ice': 25,
  'Purple Ice': null,
  'Purple Mojo': 25,
  'Teal Mojo': 199,
};

// Base sets that should have 200 cards after Rated Rookies merge
const BASE_SET_NAMES = [
  'Base Set',
  'Base Set Black',
  'Base Set Blue',
  'Base Set Gold',
  'Base Set Green',
  'Base Set Orange',
  'Base Set Pink',
  'Base Set Purple',
  'Base Set Red',
  'Base Set Silver',
  'Base Set Teal',
  'Base Optic',
  'Base Optic Dragon',
  'Base Optic Photon',
  'Base Optic Holo',
  'Base Optic Green Ice',
  'Base Optic Orange Ice',
  'Base Optic Pink Ice',
  'Base Optic Purple Ice',
  'Base Optic Purple Mojo',
  'Base Optic Teal Mojo',
];

interface CardRow {
  cardNumber: string;
  setName: string;
  playerName: string;
  team: string;
  sequence: string;
}

function determineSetType(setName: string): SetType {
  const name = setName.toLowerCase();

  // Rated Rookies are Base type
  if (name.includes('rated rookies')) {
    return 'Base';
  }

  // Base sets
  if (name.includes('base') || name === 'optic' || name.includes('optic ')) {
    return 'Base';
  }

  // Autograph sets
  if (name.includes('autograph') || name.includes('signature')) {
    return 'Autograph';
  }

  // Memorabilia sets
  if (name.includes('kit kings') || name.includes('kit series')) {
    return 'Memorabilia';
  }

  // Everything else is Insert
  return 'Insert';
}

function extractParallelInfo(setName: string): {
  baseName: string;
  parallelName: string | null;
  printRun: number | null;
} {
  // Check for known parallel types
  for (const [parallelType, printRun] of Object.entries(PRINT_RUNS)) {
    if (setName.endsWith(` ${parallelType}`)) {
      const baseName = setName.substring(0, setName.length - parallelType.length - 1);
      return { baseName, parallelName: parallelType, printRun };
    }
  }

  return { baseName: setName, parallelName: null, printRun: null };
}

function generateSetSlug(year: string, releaseName: string, setName: string, setType: SetType, parallelName?: string): string {
  const parts = [year, releaseName];

  // Add type prefix for non-Base sets
  if (setType === 'Autograph') {
    parts.push('auto');
  } else if (setType === 'Memorabilia') {
    parts.push('mem');
  } else if (setType === 'Insert') {
    parts.push('insert');
  }

  // Add set name
  parts.push(setName);

  // Add parallel name if exists
  if (parallelName) {
    parts.push(parallelName);
  }

  // Slugify
  return parts
    .join('-')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  console.log('🏈 2022-23 Panini Donruss Soccer Import Script\n');

  // 1. Get or create manufacturer
  console.log('1️⃣ Finding Panini manufacturer...');
  const manufacturer = await prisma.manufacturer.findFirst({
    where: { name: 'Panini' }
  });

  if (!manufacturer) {
    throw new Error('Panini manufacturer not found. Please create it first.');
  }
  console.log(`✅ Found Panini (${manufacturer.id})\n`);

  // 2. Get or create release
  console.log('2️⃣ Finding Donruss Soccer release...');
  let release = await prisma.release.findUnique({
    where: { slug: '2022-23-panini-donruss-soccer' }
  });

  if (!release) {
    console.log('Creating new release...');
    release = await prisma.release.create({
      data: {
        name: 'Donruss Soccer',
        year: '2022-23',
        slug: '2022-23-panini-donruss-soccer',
        manufacturerId: manufacturer.id,
      }
    });
    console.log(`✅ Created release: ${release.name} (${release.id})\n`);
  } else {
    console.log(`✅ Found release: ${release.name} (${release.id})\n`);
  }

  // 3. Upload checklist (REQUIRED)
  console.log('3️⃣ Uploading checklist...');
  const filename = path.basename(CHECKLIST_PATH);
  const existing = await getExistingChecklist(release.id, filename);

  if (!existing) {
    await uploadChecklistToRelease(
      CHECKLIST_PATH,
      release.id,
      '2022-23 Panini Donruss Soccer Checklist'
    );
    console.log('✅ Checklist uploaded successfully\n');
  } else {
    console.log('ℹ️  Checklist already uploaded\n');
  }

  // 4. Parse Excel file
  console.log('4️⃣ Parsing Excel file...');
  const workbook = XLSX.readFile(CHECKLIST_PATH);
  const worksheet = workbook.Sheets[SHEET_NAME];
  const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

  console.log(`✅ Parsed ${rawData.length} rows\n`);

  // 5. Group cards by set
  console.log('5️⃣ Grouping cards by set...');
  const cardsBySet = new Map<string, CardRow[]>();

  // The first row contains the actual headers, skip it
  // Columns are mapped to: [title column, __EMPTY, __EMPTY_1, __EMPTY_2, __EMPTY_3]
  // Which represent: [CARD #, CARD SET, ATHLETE, TEAM, SEQUENCE]

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];

    // Skip the first row (headers)
    if (i === 0) continue;

    // Get values from the weird column names
    const cardNumber = row['2022-23 Donruss Soccer Cards Checklist']; // CARD #
    const setName = row['__EMPTY']; // CARD SET
    const playerName = row['__EMPTY_1']; // ATHLETE
    const team = row['__EMPTY_2']; // TEAM
    const sequence = row['__EMPTY_3']; // SEQUENCE

    // Skip rows without card number or set name
    if (!cardNumber || !setName) continue;

    const cardRow: CardRow = {
      cardNumber: String(cardNumber).trim(),
      setName: String(setName).trim(),
      playerName: String(playerName || '').trim(),
      team: String(team || '').trim(),
      sequence: String(sequence || '').trim(),
    };

    if (!cardsBySet.has(cardRow.setName)) {
      cardsBySet.set(cardRow.setName, []);
    }
    cardsBySet.get(cardRow.setName)!.push(cardRow);
  }

  console.log(`✅ Found ${cardsBySet.size} unique sets\n`);

  // 6. Import sets and cards
  console.log('6️⃣ Importing sets and cards...\n');

  let setsCreated = 0;
  let cardsCreated = 0;
  let setsSkipped = 0;

  for (const [setName, cards] of cardsBySet.entries()) {
    const setType = determineSetType(setName);
    const { baseName, parallelName, printRun } = extractParallelInfo(setName);

    // Generate slug
    const slug = generateSetSlug('2022-23', 'Panini Donruss Soccer', baseName, setType, parallelName || undefined);

    // Check if set already exists
    const existingSet = await prisma.set.findUnique({
      where: { slug }
    });

    if (existingSet) {
      console.log(`⏭️  Set already exists: ${setName} (${slug})`);
      setsSkipped++;
      continue;
    }

    // Create set
    const set = await prisma.set.create({
      data: {
        name: setName,
        slug,
        type: setType,
        releaseId: release.id,
        totalCards: String(cards.length),
        printRun: printRun,
        isParallel: parallelName !== null,
        baseSetSlug: parallelName ? generateSetSlug('2022-23', 'Panini Donruss Soccer', baseName, setType) : null,
      }
    });

    setsCreated++;
    console.log(`✅ Created set: ${setName} (${setType}, ${cards.length} cards, ${slug})`);

    // Create cards for this set
    for (const cardRow of cards) {
      const cardSlug = generateCardSlug(
        'Panini',
        'Donruss Soccer',
        '2022-23',
        baseName,
        cardRow.cardNumber,
        cardRow.playerName,
        parallelName,
        printRun || undefined
      );

      // Check if card already exists
      const existingCard = await prisma.card.findUnique({
        where: { slug: cardSlug }
      });

      if (existingCard) {
        continue; // Skip duplicate card
      }

      await prisma.card.create({
        data: {
          slug: cardSlug,
          playerName: cardRow.playerName,
          team: cardRow.team,
          cardNumber: cardRow.cardNumber,
          variant: parallelName,
          printRun: printRun,
          setId: set.id,
        }
      });

      cardsCreated++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   Sets created: ${setsCreated}`);
  console.log(`   Sets skipped: ${setsSkipped}`);
  console.log(`   Cards created: ${cardsCreated}`);
  console.log('\n✅ Import complete!\n');
  console.log('⚠️  Next step: Run fix-rated-rookies-merge.ts to merge Rated Rookies into Base sets\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
