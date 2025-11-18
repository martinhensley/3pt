import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';
import { uploadChecklistToRelease } from '../../lib/checklistUploader';

const prisma = new PrismaClient();

// Define set types
type SetType = 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';

// Print run mapping for parallels
const PRINT_RUNS: Record<string, number | null> = {
  // Basketball-specific parallels
  'Black': 1,
  'Blue': 99,
  'Press Proof': null,  // Unnumbered parallel
  'Press Proof Black': 1,
  'Press Proof Blue': 99,
  'Holo Blue Laser': null,
  'Holo Green Laser': null,
};

// Known parallel variations for Basketball (order matters - longer matches first)
const KNOWN_PARALLELS = [
  'Press Proof Black',
  'Press Proof Blue',
  'Press Proof',
  'Holo Blue Laser',
  'Holo Green Laser',
  'Black',
  'Blue',
];

function determineSetType(setName: string): SetType {
  const lowerName = setName.toLowerCase();

  // Check for autograph sets
  if (lowerName.includes('autograph') || lowerName.includes('signature')) {
    return 'Autograph';
  }

  // Check for memorabilia sets
  if (lowerName.includes('materials') || lowerName.includes('jersey')) {
    return 'Memorabilia';
  }

  // Check for base sets
  if (lowerName.includes('base') || lowerName.includes('optic') || lowerName.includes('rookies')) {
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

interface CardData {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
  printRun: number | null;
}

async function importDonrussBasketball() {
  try {
    console.log('Starting 2016-17 Panini Donruss Basketball import...\n');

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
    const releaseSlug = '2016-17-panini-donruss-basketball';
    let release = await prisma.release.findUnique({
      where: { slug: releaseSlug },
      include: { manufacturer: true }
    });

    if (!release) {
      release = await prisma.release.create({
        data: {
          name: 'Donruss Basketball',
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

    // 3. Read CSV file
    const csvPath = path.join(__dirname, '2016-17-Panini-Donruss-Basketball-Checklist.csv');
    let csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Remove the outer quotes that wrap each line (unusual CSV format)
    csvContent = csvContent.replace(/^"(.+)"$/gm, '$1');

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    console.log(`Read ${records.length} cards from CSV\n`);

    // 4. Process records and merge Rookies into Base
    const setMap = new Map<string, CardData[]>();
    let totalCards = 0;

    for (const record of records) {
      let setName = record['Card Set'];
      const cardNumber = record['Card Number'];
      const playerName = record['Player'];
      const team = record['Team'];
      const printRunStr = record['Print Run'];
      const printRun = printRunStr ? parseInt(printRunStr, 10) : null;

      // Skip if essential fields are missing
      if (!setName || !cardNumber || !playerName) {
        continue;
      }

      // Merge Rookies into Base
      if (setName === 'Rookies') {
        setName = 'Base';
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
      const { baseSetName, variantName, printRun } = extractParallelInfo(fullSetName);
      const isParallel = variantName !== null;

      // Determine set type
      const setType = determineSetType(baseSetName);

      // Generate slug
      let slug: string;
      if (isParallel) {
        // For parallels, add "-parallel" suffix and include print run if available
        const parallelSlug = variantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const baseSlug = generateSetSlug('2016-17', 'Donruss Basketball', baseSetName, setType);
        slug = printRun ? `${baseSlug}-${parallelSlug}-parallel-${printRun}` : `${baseSlug}-${parallelSlug}-parallel`;
      } else {
        slug = generateSetSlug('2016-17', 'Donruss Basketball', baseSetName, setType);
      }

      // Calculate base set slug for parallels
      let baseSetSlug: string | null = null;
      if (isParallel) {
        const baseSetType = determineSetType(baseSetName);
        baseSetSlug = generateSetSlug('2016-17', 'Donruss Basketball', baseSetName, baseSetType);
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
        // Use card-specific print run if available, otherwise fall back to set print run
        const cardPrintRun = card.printRun ?? printRun;

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
      csvPath,
      release.id,
      '2016-17 Panini Donruss Basketball Checklist'
    );
    console.log('Checklist uploaded successfully!');

    // 8. Validation
    console.log('\n===== Validation =====');

    const baseSet = await prisma.set.findUnique({
      where: { slug: '2016-17-donruss-basketball-base' },
      include: { _count: { select: { cards: true } } }
    });

    if (baseSet) {
      console.log(`Base set card count: ${baseSet._count.cards} (expected: 200)`);
      if (baseSet._count.cards === 200) {
        console.log('✓ Base set has correct number of cards (includes merged Rookies)');
      } else {
        console.warn('⚠ Base set card count mismatch!');
      }
    }

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importDonrussBasketball();
