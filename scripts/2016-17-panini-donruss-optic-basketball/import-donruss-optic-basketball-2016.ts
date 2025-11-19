import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';
import { uploadChecklistToRelease } from '../../lib/checklistUploader';

const prisma = new PrismaClient();

// Define set types
type SetType = 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';

// Print run mapping based on Excel "Seq." column values
const PRINT_RUN_MAP: Record<number, number> = {
  1: 1,        // 1/1 cards (Black, Gold Vinyl)
  5: 5,        // /5 Green parallels
  10: 10,      // /10 Gold parallels
  25: 25,      // /25 Aqua, Blue (signatures), Pink parallels
  49: 49,      // /49 Blue parallels
  99: 99,      // /99 Red parallels
  199: 199,    // /199 Orange parallels
};

// Known parallel suffixes (order matters - longer matches first)
const KNOWN_PARALLELS = [
  'Gold Vinyl',
  'Press Proof Black',
  'Press Proof Blue',
  'White Sparkle',
  'Holo Blue Laser',
  'Holo Green Laser',
  'Checkerboard',
  'Press Proof',
  'Orange',
  'Purple',
  'Aqua',
  'Black',
  'Blue',
  'Gold',
  'Green',
  'Holo',
  'Pink',
  'Red',
];

function determineSetType(setName: string): SetType {
  const lowerName = setName.toLowerCase();

  // Check for autograph sets (includes "Signatures")
  if (lowerName.includes('autograph') || lowerName.includes('signature')) {
    return 'Autograph';
  }

  // Check for memorabilia sets
  if (lowerName.includes('materials') || lowerName.includes('jersey') || lowerName.includes('patch')) {
    return 'Memorabilia';
  }

  // Check for base sets
  if (lowerName === 'base' || lowerName.startsWith('base ')) {
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
      // For base set parallels, the baseSetName should just be "Base"
      return {
        baseSetName,
        variantName: parallel,
        printRun: null // Will be determined from card data
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

interface CardData {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
  printRun: number | null;
}

async function importDonrussOpticBasketball() {
  try {
    console.log('Starting 2016-17 Panini Donruss Optic Basketball import...\n');

    // 1. Find or create Panini manufacturer
    let manufacturer = await prisma.manufacturer.findUnique({
      where: { name: 'Panini' }
    });

    if (!manufacturer) {
      manufacturer = await prisma.manufacturer.create({
        data: { name: 'Panini' }
      });
      console.log('Created Panini manufacturer\n');
    } else {
      console.log('Found Panini manufacturer\n');
    }

    // 2. Find or create release
    const releaseSlug = '2016-17-panini-donruss-optic-basketball';
    let release = await prisma.release.findUnique({
      where: { slug: releaseSlug },
      include: { manufacturer: true }
    });

    if (!release) {
      release = await prisma.release.create({
        data: {
          name: 'Donruss Optic Basketball',
          year: '2016-17',
          slug: releaseSlug,
          releaseDate: 'November 23, 2016',
          manufacturerId: manufacturer.id,
          postDate: new Date('2016-11-23')
        },
        include: { manufacturer: true }
      });
      console.log(`Created release: ${release.name} (${release.id})\n`);
    } else {
      console.log(`Found release: ${release.name} (${release.id})\n`);
    }

    // 3. Read Excel file
    const excelPath = '/Users/mh/Desktop/2016-17-Donruss-Optic-NBA-Basketball-Cards-Checklist.xlsx';
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON, skipping the header row
    const records: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Read ${records.length} cards from Excel file\n`);

    // 4. Process records and group by set
    const setMap = new Map<string, CardData[]>();
    let expectedCardCount = 0;

    for (const record of records) {
      const setName = record['Card Set'];
      const cardNumber = record['#']?.toString();
      const playerName = record['Player'];
      const team = record['Team'];
      const seqValue = record['Seq.'];

      // Map Seq. value to print run
      let printRun: number | null = null;
      if (seqValue && typeof seqValue === 'number') {
        printRun = PRINT_RUN_MAP[seqValue] || seqValue;
      }

      // Skip if essential fields are missing
      if (!setName || !cardNumber || !playerName) {
        continue;
      }

      const cardData: CardData = {
        setName,
        cardNumber,
        playerName,
        team,
        printRun
      };

      if (!setMap.has(setName)) {
        setMap.set(setName, []);
      }
      setMap.get(setName)!.push(cardData);
      totalCards++;
    }

    console.log(`Parsed ${totalCards} cards across ${setMap.size} unique sets\n`);

    // 5. Process each set
    console.log('Creating sets and cards...\n');
    let setCount = 0;
    let cardCount = 0;

    for (const [fullSetName, cards] of setMap.entries()) {
      console.log(`Processing: ${fullSetName} (${cards.length} cards)`);

      // Extract parallel info
      const { baseSetName, variantName, printRun: parallelPrintRun } = extractParallelInfo(fullSetName);
      const isParallel = variantName !== null;

      // Determine the most common print run for this set (for set-level printRun field)
      let setPrintRun: number | null = null;
      if (cards.length > 0) {
        const printRuns = cards.map(c => c.printRun).filter(pr => pr !== null) as number[];
        if (printRuns.length > 0) {
          // Use the most common print run
          const printRunCounts = new Map<number, number>();
          printRuns.forEach(pr => {
            printRunCounts.set(pr, (printRunCounts.get(pr) || 0) + 1);
          });
          const mostCommonPrintRun = Array.from(printRunCounts.entries())
            .sort((a, b) => b[1] - a[1])[0][0];
          setPrintRun = mostCommonPrintRun;
        }
      }

      // Determine set type
      const setType = determineSetType(baseSetName);

      // Generate slug using the slug generator
      let slug: string;
      if (isParallel) {
        slug = generateSetSlug('2016-17', 'Donruss Optic Basketball', baseSetName, setType, variantName, setPrintRun);
      } else {
        slug = generateSetSlug('2016-17', 'Donruss Optic Basketball', baseSetName, setType);
      }

      // Calculate base set slug for parallels
      let baseSetSlug: string | null = null;
      if (isParallel) {
        const baseSetType = determineSetType(baseSetName);
        baseSetSlug = generateSetSlug('2016-17', 'Donruss Optic Basketball', baseSetName, baseSetType);
      }

      console.log(`  Type: ${setType}`);
      console.log(`  Is Parallel: ${isParallel}`);
      console.log(`  Base Set: ${baseSetName}`);
      console.log(`  Variant: ${variantName || 'N/A'}`);
      console.log(`  Set Print Run: ${setPrintRun || 'N/A'}`);
      console.log(`  Slug: ${slug}`);
      console.log(`  Base Set Slug: ${baseSetSlug || 'N/A'}`);

      // Check if set already exists
      const existingSet = await prisma.set.findUnique({
        where: { slug }
      });

      if (existingSet) {
        console.log(`  ⚠️ Set already exists, skipping...\n`);
        continue;
      }

      // Create set
      const dbSet = await prisma.set.create({
        data: {
          name: fullSetName,
          slug,
          type: setType,
          releaseId: release.id,
          expectedCardCount: cards.length,
          printRun: setPrintRun,
          isParallel,
          baseSetSlug,
        },
      });
      setCount++;
      console.log(`  ✅ Created set: ${dbSet.id}`);

      // Create cards for this set
      let createdCards = 0;
      for (const card of cards) {
        // Use card-specific print run
        const cardPrintRun = card.printRun;

        // Generate card slug
        const cardSlug = generateCardSlug(
          release.manufacturer.name,
          release.name,
          release.year || '2016-17',
          baseSetName,
          card.cardNumber,
          card.playerName,
          variantName,
          cardPrintRun || undefined,
          setType
        );

        try {
          await prisma.card.create({
            data: {
              slug: cardSlug,
              playerName: card.playerName || null,
              team: card.team || null,
              cardNumber: card.cardNumber || null,
              variant: variantName,
              printRun: cardPrintRun,
              isNumbered: cardPrintRun !== null,
              numbered: cardPrintRun ? (cardPrintRun === 1 ? '1 of 1' : `/${cardPrintRun}`) : null,
              rarity: cardPrintRun === 1 ? 'one_of_one' :
                      cardPrintRun && cardPrintRun <= 10 ? 'ultra_rare' :
                      cardPrintRun && cardPrintRun <= 50 ? 'super_rare' :
                      cardPrintRun && cardPrintRun <= 199 ? 'rare' : 'base',
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

    // 6. Final summary
    console.log('='.repeat(60));
    console.log(`Successfully imported ${setCount} sets and ${cardCount} cards`);
    console.log('='.repeat(60));

    // 7. Upload checklist (REQUIRED)
    console.log('\nUploading checklist file...');
    await uploadChecklistToRelease(
      excelPath,
      release.id,
      '2016-17 Panini Donruss Optic Basketball Checklist'
    );
    console.log('Checklist uploaded successfully!');

    // 8. Validation
    console.log('\n===== Validation =====');

    const baseSet = await prisma.set.findUnique({
      where: { slug: '2016-17-donruss-optic-basketball-base' },
      include: { _count: { select: { cards: true } } }
    });

    if (baseSet) {
      console.log(`Base set card count: ${baseSet._count.cards} (expected: 200)`);
      if (baseSet._count.cards === 200) {
        console.log('✓ Base set has correct number of cards');
      } else {
        console.warn('⚠ Base set card count mismatch!');
      }
    }

    // Check total set count
    const totalSets = await prisma.set.count({
      where: { releaseId: release.id }
    });
    console.log(`\nTotal sets in release: ${totalSets} (expected: 116)`);

    // Check total card count
    const totalCardsInDb = await prisma.card.count({
      where: { set: { releaseId: release.id } }
    });
    console.log(`Total cards in release: ${totalCardsInDb} (expected: 5,734)`);

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importDonrussOpticBasketball();
