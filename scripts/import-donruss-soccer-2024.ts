import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { generateSetSlug, generateCardSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

// Define set types
type SetType = 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';

// Print run mapping for parallels
const PRINT_RUNS: Record<string, number | null> = {
  // Base/Rated Rookies/Optic Parallels with print runs
  'Black': 1,
  'Black 1/1': 1,
  'Black Pandora': 1,
  'Green': 5,
  'Gold': 10,
  'Gold Power': 10,
  'Purple': 25,
  'Pink Diamond': 25,
  'Blue': 49,
  'Red': 99,
  'Blue Cubic': 99,
  'Pink Cubic': 99,
  'Red Cubic': 99,
  'Teal': 199,

  // Mojo parallels
  'Purple Mojo': 25,
  'Teal Mojo': 199,

  // Other specific print runs
  'Pink Ice': 25,
  'Pink Velocity': 99,  // Fixed: Pink Velocity is /99 not /25
  'Plum Blossom': null,  // Fixed: Plum Blossom is unnumbered
  'Dragon Scale': 8,     // Fixed: Dragon Scale is /8 not /88

  // No print run (unlimited parallels)
  'Cubic': null,
  'Diamond': null,
  'Silver': null,
  'Argyle': null,
  'Holo': null,
  'Ice': null,
  'Velocity': null,
  'Orange': null,
  'Pink': null,
};

// Known parallel variations (order matters - longer matches first)
const KNOWN_PARALLELS = [
  // Compound names (must check first)
  'Black Pandora', 'Blue Cubic', 'Pink Cubic', 'Red Cubic',
  'Pink Diamond', 'Pink Ice', 'Pink Velocity',
  'Gold Power', 'Purple Mojo', 'Teal Mojo',
  'Plum Blossom', 'Dragon Scale', 'Black 1/1',
  // Single words
  'Argyle', 'Black', 'Blue', 'Cubic', 'Diamond',
  'Gold', 'Green', 'Holo', 'Ice', 'Orange', 'Purple',
  'Red', 'Silver', 'Teal', 'Velocity', 'Pink',
];

function determineSetType(setName: string): SetType {
  const lowerName = setName.toLowerCase();

  // Check for autograph sets
  if (lowerName.includes('autograph') || lowerName.includes('signature')) {
    return 'Autograph';
  }

  // Check for memorabilia sets
  if (lowerName === 'kit kings' || lowerName === 'kit series') {
    return 'Memorabilia';
  }

  // Check for base sets (including Rated Rookies which are special base rookies)
  if (lowerName.includes('base') || lowerName.includes('optic') || lowerName.includes('rated rookies')) {
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
  // Special handling for Optic sets - remove "Base" from display
  if (fullSetName === 'Base Optic') {
    return 'Optic';
  } else if (fullSetName.startsWith('Base Optic ')) {
    return fullSetName.replace('Base Optic ', 'Optic ');
  } else if (fullSetName === 'Rated Rookies Optic') {
    return 'Rated Rookies Optic';
  } else if (fullSetName.startsWith('Rated Rookies Optic ')) {
    return fullSetName.replace('Rated Rookies Optic ', 'Rated Rookies Optic ');
  }
  return fullSetName;
}

interface CardData {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
}

async function importDonrussSoccer() {
  try {
    console.log('Starting 2024-25 Panini Donruss Soccer import...\n');

    // 1. Verify release exists
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
      include: { manufacturer: true }
    });

    if (!release) {
      console.error('Release not found! Please create 2024-25 Panini Donruss Soccer release first.');
      return;
    }

    console.log(`Found release: ${release.name} (${release.id})`);
    console.log(`Manufacturer: ${release.manufacturer.name}\n`);

    // 2. Read Excel file
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile('/Users/mh/Desktop/2024-25-Donruss-Soccer-Checklist.xlsx');
    const masterSheet = workbook.Sheets['Master'];

    if (!masterSheet) {
      console.error('Master sheet not found in Excel file!');
      return;
    }

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json<any>(masterSheet, { header: 1 });
    console.log(`Found ${jsonData.length} rows in Master sheet\n`);

    // 3. Parse cards and group by set
    const setMap = new Map<string, CardData[]>();
    let totalCards = 0;

    // Skip header row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row[0]) continue; // Skip empty rows

      const cardSet = String(row[0]).trim();
      const cardNumber = row[1] ? String(row[1]).trim() : '';
      const athlete = row[2] ? String(row[2]).trim() : '';
      const team = row[3] ? String(row[3]).trim() : '';

      // Merge Rated Rookies into Base sets
      let finalSetName = cardSet;
      if (cardSet.startsWith('Rated Rookies')) {
        if (cardSet === 'Rated Rookies') {
          finalSetName = 'Base';
        } else if (cardSet.startsWith('Rated Rookies Optic')) {
          finalSetName = cardSet.replace('Rated Rookies Optic', 'Base Optic');
        } else if (cardSet.startsWith('Rated Rookies ')) {
          // For parallels like "Rated Rookies Gold"
          finalSetName = cardSet.replace('Rated Rookies ', 'Base ');
        }
      }

      const cardData: CardData = {
        setName: finalSetName,
        cardNumber,
        playerName: athlete,
        team
      };

      if (!setMap.has(finalSetName)) {
        setMap.set(finalSetName, []);
      }
      setMap.get(finalSetName)!.push(cardData);
      totalCards++;
    }

    console.log(`Parsed ${totalCards} cards across ${setMap.size} unique sets\n`);

    // 4. Process each set
    console.log('Creating sets and cards...\n');
    let setCount = 0;
    let cardCount = 0;

    for (const [fullSetName, cards] of setMap.entries()) {
      console.log(`Processing: ${fullSetName} (${cards.length} cards)`);

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
        const baseSlug = generateSetSlug('2024-25', 'Donruss Soccer', baseSetName, setType);
        slug = printRun ? `${baseSlug}-${parallelSlug}-parallel-${printRun}` : `${baseSlug}-${parallelSlug}-parallel`;
      } else {
        slug = generateSetSlug('2024-25', 'Donruss Soccer', baseSetName, setType);
      }

      // Calculate base set slug for parallels
      let baseSetSlug: string | null = null;
      if (isParallel) {
        const baseSetType = determineSetType(baseSetName);
        baseSetSlug = generateSetSlug('2024-25', 'Donruss Soccer', baseSetName, baseSetType);
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
        console.log(`  ⚠️ Set already exists, skipping...`);
        continue;
      }

      // Create set
      const dbSet = await prisma.set.create({
        data: {
          name: displayName,
          slug,
          type: setType,
          releaseId: release.id,
          totalCards: cards.length.toString(),
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
        // Generate card slug - now passing setType
        const cardSlug = generateCardSlug(
          release.manufacturer.name,
          release.name,
          release.year || '2024-25',
          baseSetName,
          card.cardNumber,
          card.playerName,
          variantName,
          printRun || undefined,
          setType  // Pass the set type for proper slug generation
        );

        try {
          await prisma.card.create({
            data: {
              slug: cardSlug,
              playerName: card.playerName || null,
              team: card.team || null,
              cardNumber: card.cardNumber || null,
              variant: variantName,
              printRun,
              isNumbered: printRun !== null,
              numbered: printRun ? (printRun === 1 ? '1 of 1' : `/${printRun}`) : null,
              rarity: printRun === 1 ? 'one_of_one' :
                      printRun && printRun <= 10 ? 'ultra_rare' :
                      printRun && printRun <= 50 ? 'super_rare' :
                      printRun && printRun <= 199 ? 'rare' : 'base',
              setId: dbSet.id,
            },
          });
          createdCards++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`    ⚠️ Card slug already exists: ${cardSlug}`);
          } else {
            throw error;
          }
        }
      }

      cardCount += createdCards;
      console.log(`  ✅ Created ${createdCards}/${cards.length} cards\n`);
    }

    // 5. Final summary
    console.log('=' * 60);
    console.log('IMPORT COMPLETE!');
    console.log('=' * 60);
    console.log(`Total sets created: ${setCount}/${setMap.size}`);
    console.log(`Total cards created: ${cardCount}/${totalCards}`);

    // Validate results
    const finalSetCount = await prisma.set.count({
      where: { releaseId: release.id }
    });
    const finalCardCount = await prisma.card.count({
      where: { set: { releaseId: release.id } }
    });

    console.log(`\nDatabase totals for this release:`);
    console.log(`  Sets: ${finalSetCount}`);
    console.log(`  Cards: ${finalCardCount}`);

  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importDonrussSoccer();