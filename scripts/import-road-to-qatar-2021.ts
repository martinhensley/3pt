import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { generateSetSlug, generateCardSlug } from '../lib/slugGenerator';
import { uploadChecklistToRelease, getExistingChecklist } from '../lib/checklistUploader';
import path from 'path';

const prisma = new PrismaClient();

// Define set types
type SetType = 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';

// Print run mapping for parallels (Road to Qatar specific)
const PRINT_RUNS: Record<string, number | null> = {
  // Holo Laser parallels (all 1/1)
  'Holo Black Laser': 1,
  'Holo Blue Laser': 1,
  'Holo Gold Laser': 1,
  'Holo Green Laser': 1,
  'Holo Orange Laser': 1,
  'Holo Pink Laser': 1,
  'Holo Purple Laser': 1,
  'Holo Red Laser': 1,

  // Optic Velocity parallels (all 1/1)
  'Optic Black Velocity': 1,
  'Optic Blue Velocity': 1,
  'Optic Green Velocity': 1,
  'Optic Orange Velocity': 1,
  'Optic Pink Velocity': 1,
  'Optic Purple Velocity': 1,
  'Optic Red Velocity': 1,
  'Optic Red and Gold Velocity': 1,

  // Optic color parallels
  'Optic Blue': null,
  'Optic Red': null,
  'Optic Gold': null,
  'Optic Gold Vinyl': null,
  'Optic Holo': null,

  // Press Proof parallels
  'Press Proof': null,
  'Press Proof Gold': null,
  'Press Proof Purple': null,
  'Press Proof Black': 1,

  // Autograph parallels
  'Autographs Black': 1,
  'Autographs Blue': null,
  'Autographs Red': null,
  'Autographs Gold': null,
  'Autographs Green': null,
  'Autographs Red and Gold Laser': null,

  // Dual Autographs
  'Dual Autographs': null,
  'Dual Autographs Black': 1,
  'Dual Autographs Gold': null,

  // Kit memorabilia variations
  'Prime': null,
  'Super Prime': null,
};

// Known parallel variations (order matters - longer matches first)
const KNOWN_PARALLELS = [
  // Compound names (must check first)
  'Holo Black Laser', 'Holo Blue Laser', 'Holo Gold Laser', 'Holo Green Laser',
  'Holo Orange Laser', 'Holo Pink Laser', 'Holo Purple Laser', 'Holo Red Laser',
  'Optic Black Velocity', 'Optic Blue Velocity', 'Optic Green Velocity',
  'Optic Orange Velocity', 'Optic Pink Velocity', 'Optic Purple Velocity',
  'Optic Red Velocity', 'Optic Red and Gold Velocity',
  'Optic Gold Vinyl', 'Optic Holo', 'Optic Blue', 'Optic Red', 'Optic Gold',
  'Press Proof Gold', 'Press Proof Purple', 'Press Proof Black', 'Press Proof',
  'Autographs Red and Gold Laser', 'Autographs Black', 'Autographs Blue',
  'Autographs Red', 'Autographs Gold', 'Autographs Green',
  'Dual Autographs Black', 'Dual Autographs Gold', 'Dual Autographs',
  'Super Prime', 'Prime',
];

function determineSetType(setName: string): SetType {
  const lowerName = setName.toLowerCase();

  // Check for autograph sets
  if (lowerName.includes('autograph') || lowerName.includes('signature')) {
    return 'Autograph';
  }

  // Check for memorabilia sets
  if (lowerName.includes('kit kings') || lowerName.includes('kit series')) {
    return 'Memorabilia';
  }

  // Check for base sets (including Rated Rookies and Optic)
  if (lowerName.includes('base') || lowerName === 'optic' || lowerName.includes('rated rookies')) {
    return 'Base';
  }

  // Everything else is an insert
  return 'Insert';
}

function extractParallelInfo(setName: string): {
  baseSetName: string;
  variantName: string | null;
  printRun: number | null;
} {
  // Check for known parallel suffixes
  for (const parallel of KNOWN_PARALLELS) {
    if (setName.endsWith(' ' + parallel)) {
      const baseSetName = setName.substring(0, setName.length - parallel.length - 1);
      const printRun = PRINT_RUNS[parallel] ?? null;
      return {
        baseSetName,
        variantName: parallel,
        printRun
      };
    }
  }

  // Not a parallel
  return {
    baseSetName: setName,
    variantName: null,
    printRun: null
  };
}

function normalizeSetDisplayName(fullSetName: string): string {
  // Special handling for Base Optic sets
  if (fullSetName === 'Base Optic') {
    return 'Optic';
  } else if (fullSetName.startsWith('Base Optic ')) {
    return fullSetName.replace('Base Optic ', 'Optic ');
  } else if (fullSetName === 'Rated Rookies Optic') {
    return 'Rated Rookies Optic';
  } else if (fullSetName.startsWith('Rated Rookies Optic ')) {
    return fullSetName.replace('Rated Rookies Optic ', 'Rated Rookies Optic ');
  }

  // Handle autograph naming
  if (fullSetName.includes('Beautiful Game Autographs')) {
    return fullSetName.replace('Beautiful Game Autographs', 'Beautiful Game');
  }
  if (fullSetName.includes('Signature Series')) {
    // Keep Signature Series as is
    return fullSetName;
  }

  return fullSetName;
}

interface CardData {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
}

async function importRoadToQatar() {
  try {
    console.log('🚀 Starting 2021-22 Panini Donruss Road to Qatar Soccer import...\n');

    // 1. Get or create manufacturer
    let manufacturer = await prisma.manufacturer.findUnique({
      where: { name: 'Panini' }
    });

    if (!manufacturer) {
      console.log('Creating Panini manufacturer...');
      manufacturer = await prisma.manufacturer.create({
        data: { name: 'Panini', slug: 'panini' }
      });
    }

    console.log(`Manufacturer: ${manufacturer.name} (${manufacturer.id})`);

    // 2. Create or find release
    const releaseSlug = '2021-22-panini-donruss-road-to-qatar-soccer';
    let release = await prisma.release.findUnique({
      where: { slug: releaseSlug }
    });

    if (!release) {
      console.log('\n📦 Creating release...');
      release = await prisma.release.create({
        data: {
          name: 'Donruss Road to Qatar Soccer',
          year: '2021-22',
          slug: releaseSlug,
          manufacturerId: manufacturer.id,
          releaseDate: new Date('2021-11-01'),
        }
      });
      console.log(`✅ Created release: ${release.name} (${release.id})`);
    } else {
      console.log(`\n✓ Found existing release: ${release.name} (${release.id})`);
    }

    // 3. Upload source checklist (REQUIRED)
    const checklistPath = '/Users/mh/Desktop/2021-22-Donruss-Soccer-Road-to-Qatar-checklist-Excel-spreadsheet-updated.xlsx';
    const filename = path.basename(checklistPath);

    const existing = await getExistingChecklist(release.id, filename);

    if (!existing) {
      console.log('\n📤 Uploading checklist...');
      await uploadChecklistToRelease(
        checklistPath,
        release.id,
        '2021-22 Panini Donruss Road to Qatar Soccer Checklist'
      );
      console.log('✅ Checklist uploaded successfully\n');
    } else {
      console.log('\nℹ️  Checklist already uploaded\n');
    }

    // 4. Read Excel file
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(checklistPath);
    const sheet = workbook.Sheets['Sheet 1'];

    if (!sheet) {
      console.error('Sheet 1 not found in Excel file!');
      return;
    }

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
    console.log(`Found ${jsonData.length} rows in spreadsheet\n`);

    // 5. Parse cards and group by set
    const setMap = new Map<string, CardData[]>();
    let expectedCardCount = 0;

    // Skip header row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row[0]) continue; // Skip empty rows

      const cardSet = String(row[0]).trim();
      const cardNumber = row[1] ? String(row[1]).trim() : '';
      const player = row[2] ? String(row[2]).trim() : '';
      const team = row[3] ? String(row[3]).trim() : '';

      const cardData: CardData = {
        setName: cardSet,
        cardNumber,
        playerName: player,
        team
      };

      if (!setMap.has(cardSet)) {
        setMap.set(cardSet, []);
      }
      setMap.get(cardSet)!.push(cardData);
      totalCards++;
    }

    console.log(`📊 Parsed ${totalCards} cards across ${setMap.size} unique sets\n`);

    // 6. Process each set
    console.log('🔨 Creating sets and cards...\n');
    let setCount = 0;
    let cardCount = 0;

    for (const [fullSetName, cards] of setMap.entries()) {
      console.log(`\n🔹 Processing: ${fullSetName} (${cards.length} cards)`);

      // Extract parallel info
      const { baseSetName, variantName, printRun } = extractParallelInfo(fullSetName);
      const isParallel = variantName !== null;

      // Determine set type
      const setType = determineSetType(baseSetName);

      // Normalize display name
      const displayName = normalizeSetDisplayName(fullSetName);

      // Generate slug
      let slug: string;
      if (isParallel) {
        // For parallels, add "-parallel" suffix and include print run if available
        const parallelSlug = variantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const baseSlug = generateSetSlug('2021-22', 'Donruss Road to Qatar Soccer', baseSetName, setType);
        slug = printRun ? `${baseSlug}-${parallelSlug}-parallel-${printRun}` : `${baseSlug}-${parallelSlug}-parallel`;
      } else {
        slug = generateSetSlug('2021-22', 'Donruss Road to Qatar Soccer', baseSetName, setType);
      }

      // Calculate base set slug for parallels
      let baseSetSlug: string | null = null;
      if (isParallel) {
        const baseSetType = determineSetType(baseSetName);
        baseSetSlug = generateSetSlug('2021-22', 'Donruss Road to Qatar Soccer', baseSetName, baseSetType);
      }

      console.log(`  Type: ${setType}`);
      console.log(`  Is Parallel: ${isParallel}`);
      console.log(`  Base Set: ${baseSetName}`);
      console.log(`  Variant: ${variantName || 'N/A'}`);
      console.log(`  Print Run: ${printRun || 'N/A'}`);
      console.log(`  Slug: ${slug}`);
      console.log(`  Base Set Slug: ${baseSetSlug || 'N/A'}`);

      // Check if set already exists
      const existingSet = await prisma.set.findUnique({
        where: { slug }
      });

      if (existingSet) {
        console.log(`  ⚠️  Set already exists, skipping...`);
        continue;
      }

      // Create set
      const dbSet = await prisma.set.create({
        data: {
          name: displayName,
          slug,
          type: setType,
          releaseId: release.id,
          expectedCardCount: cards.length,
          printRun,
          isParallel,
          baseSetSlug,
        },
      });
      setCount++;
      console.log(`  ✅ Created set: ${dbSet.id}`);

      // Create cards for this set
      let createdCards = 0;
      for (const card of cards) {
        // Generate card slug
        const cardSlug = generateCardSlug(
          manufacturer.name,
          release.name,
          release.year || '2021-22',
          baseSetName,
          card.cardNumber,
          card.playerName,
          variantName,
          printRun || undefined,
          setType
        );

        try {
          await prisma.card.create({
            data: {
              slug: cardSlug,
              playerName: card.playerName || null,
              team: card.team || null,
              cardNumber: card.cardNumber || null,
              variant: variantName || null,
              printRun: printRun || null,
              setId: dbSet.id,
            },
          });
          createdCards++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`    ⚠️  Card already exists: ${cardSlug}`);
          } else {
            console.error(`    ❌ Error creating card ${cardSlug}:`, error.message);
          }
        }
      }

      cardCount += createdCards;
      console.log(`  ✅ Created ${createdCards} cards`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ IMPORT COMPLETE!');
    console.log('='.repeat(80));
    console.log(`📦 Sets created: ${setCount}`);
    console.log(`🃏 Cards created: ${cardCount}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importRoadToQatar()
  .catch(console.error);
