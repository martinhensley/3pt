import { PrismaClient, SetType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { generateReleaseSlug, generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';

const prisma = new PrismaClient();

// CSV path
const CSV_PATH = '/Users/mh/Desktop/2016-contenders-draft-picks/2016-Panini-Contenders-Draft-Picks-Basketball-Checklist.csv';

// Release information
const MANUFACTURER = 'Panini';
const RELEASE_NAME = 'Contenders Draft Picks Basketball';
const YEAR = '2016';
const RELEASE_DESCRIPTION = '2016 Panini Contenders Draft Picks Basketball';
const RELEASE_DATE = '2016-11-01'; // Approximate release date

// Print run mappings for parallels
const PRINT_RUNS: Record<string, number | null> = {
  // Printing plates are all 1/1
  'Printing Plate Black': 1,
  'Printing Plate Cyan': 1,
  'Printing Plate Magenta': 1,
  'Printing Plate Yellow': 1,
  // Other numbered parallels
  'Cracked Ice Ticket': 23,
  'Playoff Ticket': 99,
  'Championship Ticket': 299,
  // Foil parallels are unnumbered
  'Blue Foil': null,
  'Red Foil': null,
};

interface CardData {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
  printRun: number | null;
}

/**
 * Parse CSV file with unusual quote format
 * Format: "Field1,""Field2"",""Field3"",""Field4"",""Field5"""
 */
function parseCSV(): CardData[] {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = csv.split(/\r?\n/); // Handle both Unix and Windows line endings
  const cards: CardData[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Remove leading and trailing quotes
    if (line.startsWith('"')) line = line.substring(1);
    if (line.endsWith('"')) line = line.substring(0, line.length - 1);

    // Split by ,"" which is the field separator in this format
    const parts = line.split(',""');

    if (parts.length < 5) {
      continue; // Skip incomplete rows
    }

    // Clean up the fields - remove any remaining quotes
    const fields = parts.map(f => f.replace(/^"+|"+$/g, ''));

    const [setName, cardNumber, playerName, team, seq] = fields;

    // Skip empty rows
    if (!setName || !cardNumber || !playerName) continue;

    // Determine print run from set name or seq field
    let printRun: number | null = null;

    // Check if seq field has a number (for numbered parallels)
    if (seq && /^\d+$/.test(seq)) {
      printRun = parseInt(seq, 10);
    } else {
      // Try to determine from set name
      for (const [parallelName, run] of Object.entries(PRINT_RUNS)) {
        if (setName.includes(parallelName)) {
          printRun = run;
          break;
        }
      }
    }

    cards.push({
      setName,
      cardNumber,
      playerName,
      team,
      printRun,
    });
  }

  return cards;
}

/**
 * Determine set type from set name
 */
function determineSetType(setName: string): SetType {
  const lower = setName.toLowerCase();

  if (lower.includes('autograph') || lower.includes('signatures') || lower.includes('ink')) {
    return SetType.Autograph;
  }

  if (lower.includes('materials') || lower.includes('jersey') || lower.includes('memorabilia')) {
    return SetType.Memorabilia;
  }

  if (lower.includes('ticket')) {
    return SetType.Base;
  }

  return SetType.Insert;
}

/**
 * Extract base set name and parallel information from set name
 */
function extractParallelInfo(setName: string): {
  baseSetName: string;
  parallelName: string | null;
  printRun: number | null;
  isParallel: boolean;
} {
  const lower = setName.toLowerCase();

  // Identify the base set name
  let baseSetName = setName;
  let parallelName: string | null = null;
  let printRun: number | null = null;
  let isParallel = false;

  // Check for "Variation" suffix (indicates different photo/design, still parallel)
  const hasVariation = lower.includes('variation');

  // Printing Plates
  if (lower.includes('printing plate')) {
    isParallel = true;
    printRun = 1; // All printing plates are 1/1

    // Extract color
    if (lower.includes('black')) {
      parallelName = 'Printing Plate Black';
    } else if (lower.includes('cyan')) {
      parallelName = 'Printing Plate Cyan';
    } else if (lower.includes('magenta')) {
      parallelName = 'Printing Plate Magenta';
    } else if (lower.includes('yellow')) {
      parallelName = 'Printing Plate Yellow';
    }

    // Extract base set name
    if (lower.includes('college ticket')) {
      baseSetName = hasVariation ? 'College Ticket Variation' : 'College Ticket';
    } else if (lower.includes('season ticket')) {
      baseSetName = 'Season Ticket';
    } else if (lower.includes('international tickets')) {
      baseSetName = 'International Tickets';
    }
  }
  // Foil parallels
  else if (lower.includes('blue foil') || lower.includes('red foil')) {
    isParallel = true;
    parallelName = lower.includes('blue foil') ? 'Blue Foil' : 'Red Foil';
    printRun = null; // Foil parallels are unnumbered

    // Extract base set
    if (lower.includes('college draft ticket')) {
      baseSetName = hasVariation ? 'College Draft Ticket Variation' : 'College Draft Ticket';
    } else if (lower.includes('international draft tickets')) {
      baseSetName = 'International Draft Tickets';
    }
  }
  // Special ticket parallels
  else if (lower.includes('cracked ice ticket')) {
    isParallel = true;
    parallelName = 'Cracked Ice Ticket';
    printRun = 23;

    if (lower.includes('college')) {
      baseSetName = hasVariation ? 'College Ticket Variation' : 'College Ticket';
    } else if (lower.includes('season')) {
      baseSetName = 'Season Ticket';
    } else if (lower.includes('international')) {
      baseSetName = 'International Tickets';
    }
  }
  else if (lower.includes('playoff ticket')) {
    isParallel = true;
    parallelName = 'Playoff Ticket';
    printRun = 99;

    if (lower.includes('college')) {
      baseSetName = hasVariation ? 'College Ticket Variation' : 'College Ticket';
    } else if (lower.includes('international')) {
      baseSetName = 'International Tickets';
    }
  }
  else if (lower.includes('championship ticket') && !lower.includes('college championship ticket')) {
    isParallel = true;
    parallelName = 'Championship Ticket';
    printRun = 299;

    if (lower.includes('season')) {
      baseSetName = 'Season Ticket';
    } else if (lower.includes('international')) {
      baseSetName = 'International Tickets';
    }
  }
  // Draft tickets and championship tickets for college
  else if (lower.includes('college draft ticket')) {
    isParallel = true;
    parallelName = 'Draft Ticket';
    printRun = null;
    baseSetName = hasVariation ? 'College Ticket Variation' : 'College Ticket';
  }
  else if (lower.includes('college championship ticket')) {
    isParallel = true;
    parallelName = 'Championship Ticket';
    printRun = null;
    baseSetName = hasVariation ? 'College Ticket Variation' : 'College Ticket';
  }
  // International draft tickets
  else if (lower.includes('international draft tickets')) {
    isParallel = true;
    parallelName = 'Draft Ticket';
    printRun = null;
    baseSetName = 'International Tickets';
  }

  // Look up print run if not set yet
  if (isParallel && printRun === null && parallelName) {
    printRun = PRINT_RUNS[parallelName] ?? null;
  }

  return { baseSetName, parallelName, printRun, isParallel };
}

/**
 * Main import function
 */
async function importData() {
  console.log('🏀 Starting import for 2016 Panini Contenders Draft Picks Basketball...\n');

  // Parse CSV
  console.log('📄 Parsing CSV file...');
  const allCards = parseCSV();
  console.log(`✅ Parsed ${allCards.length} cards\n`);

  // Get or create manufacturer
  console.log('🏭 Creating/finding manufacturer...');
  const manufacturer = await prisma.manufacturer.upsert({
    where: { name: MANUFACTURER },
    update: {},
    create: {
      name: MANUFACTURER,
    },
  });
  console.log(`✅ Manufacturer: ${manufacturer.name} (${manufacturer.id})\n`);

  // Get or create release
  console.log('📦 Creating/finding release...');
  const releaseSlug = generateReleaseSlug(MANUFACTURER, RELEASE_NAME, YEAR);
  const release = await prisma.release.upsert({
    where: { slug: releaseSlug },
    update: {
      description: RELEASE_DESCRIPTION,
      releaseDate: RELEASE_DATE,
    },
    create: {
      name: RELEASE_NAME,
      slug: releaseSlug,
      year: YEAR,
      manufacturerId: manufacturer.id,
      description: RELEASE_DESCRIPTION,
      releaseDate: RELEASE_DATE,
    },
  });
  console.log(`✅ Release: ${release.name} (${release.slug})\n`);

  // Upload CSV as source file
  console.log('📤 Uploading CSV source file...');
  const csvFilename = path.basename(CSV_PATH);
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');

  // Get current sourceFiles array
  const currentSourceFiles = (release.sourceFiles as any[]) || [];

  // Check if this file is already in the array
  const fileExists = currentSourceFiles.some(
    (file: any) => file.filename === csvFilename
  );

  if (!fileExists) {
    // Add the new source file to the array
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
      data: {
        sourceFiles: updatedSourceFiles,
      },
    });

    console.log(`✅ Uploaded source file: ${csvFilename}\n`);
  } else {
    console.log(`   Source file already exists: ${csvFilename}\n`);
  }

  // Group cards by set name
  const cardsBySet = new Map<string, CardData[]>();
  allCards.forEach(card => {
    if (!cardsBySet.has(card.setName)) {
      cardsBySet.set(card.setName, []);
    }
    cardsBySet.get(card.setName)!.push(card);
  });

  console.log(`📊 Found ${cardsBySet.size} unique sets\n`);

  // Import each set
  let totalSetsCreated = 0;
  let totalCardsCreated = 0;

  for (const [setName, cards] of cardsBySet.entries()) {
    console.log(`\n🎯 Processing set: ${setName} (${cards.length} cards)`);

    // Determine set type
    const setType = determineSetType(setName);
    console.log(`   Type: ${setType}`);

    // Extract parallel info
    const { baseSetName, parallelName, printRun, isParallel } = extractParallelInfo(setName);
    console.log(`   Base: ${baseSetName}`);
    if (isParallel) {
      console.log(`   Parallel: ${parallelName} ${printRun ? `(/${printRun})` : '(unnumbered)'}`);
    }

    // Generate base set slug (for reference)
    const baseSetSlug = generateSetSlug(YEAR, RELEASE_NAME, baseSetName, setType);

    // Generate actual set slug (includes parallel info if applicable)
    const setSlug = generateSetSlug(
      YEAR,
      RELEASE_NAME,
      baseSetName,
      setType,
      parallelName ?? undefined,
      printRun
    );
    console.log(`   Slug: ${setSlug}`);

    // Create or update set
    const dbSet = await prisma.set.upsert({
      where: { slug: setSlug },
      update: {
        name: setName,
        type: setType,
        isParallel,
        baseSetSlug: isParallel ? baseSetSlug : null,
        printRun,
      },
      create: {
        name: setName,
        slug: setSlug,
        type: setType,
        releaseId: release.id,
        isParallel,
        baseSetSlug: isParallel ? baseSetSlug : null,
        printRun,
      },
    });
    totalSetsCreated++;

    // Import cards for this set
    let cardsCreated = 0;
    for (const card of cards) {
      // Generate card slug
      const cardSlug = generateCardSlug(
        MANUFACTURER,
        RELEASE_NAME,
        YEAR,
        baseSetName,
        card.cardNumber,
        card.playerName,
        parallelName,
        card.printRun || printRun,
        setType
      );

      // Create card
      try {
        await prisma.card.upsert({
          where: { slug: cardSlug },
          update: {
            playerName: card.playerName,
            team: card.team,
            cardNumber: card.cardNumber,
            variant: parallelName,
            printRun: card.printRun || printRun,
            numbered: (card.printRun || printRun) ? `/${card.printRun || printRun}` : null,
          },
          create: {
            slug: cardSlug,
            playerName: card.playerName,
            team: card.team,
            cardNumber: card.cardNumber,
            variant: parallelName,
            printRun: card.printRun || printRun,
            numbered: (card.printRun || printRun) ? `/${card.printRun || printRun}` : null,
            setId: dbSet.id,
          },
        });
        cardsCreated++;
        totalCardsCreated++;
      } catch (error) {
        console.error(`   ❌ Error creating card ${cardSlug}:`, error);
      }
    }
    console.log(`   ✅ Created ${cardsCreated} cards`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Import complete!');
  console.log(`   Sets created: ${totalSetsCreated}`);
  console.log(`   Cards created: ${totalCardsCreated}`);
  console.log('='.repeat(60));
}

// Run import
importData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
