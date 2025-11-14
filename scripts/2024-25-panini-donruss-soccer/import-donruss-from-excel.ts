import * as XLSX from 'xlsx';
import { PrismaClient, SetType } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '@/lib/slugGenerator';

const prisma = new PrismaClient();

// Type definitions for our data structures
interface ExcelCard {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
}

interface ParallelInfo {
  name: string;
  printRun: number | null;
}

interface SetInfo {
  name: string;
  type: SetType;
  parentName: string | null; // null for parent sets
  parallelName: string | null; // null for parent sets
  printRun: number | null;
  cards: ExcelCard[];
}

// Mapping of parallel names to print runs based on documentation
const PARALLEL_PRINT_RUNS: Record<string, number | null> = {
  // Base Set Parallels
  'Cubic': null,
  'Diamond': null,
  'Silver': null,
  'Teal': 199,
  'Blue Cubic': null,
  'Pink Cubic': null,
  'Red': 99,
  'Red Cubic': null,
  'Blue': 49,
  'Pink Diamond': null,
  'Purple': 25,
  'Gold': 10,
  'Green': 5,
  'Black': 1,

  // Base Optic Parallels
  'Argyle': null,
  'Black Pandora': null,
  'Dragon Scale': null,
  'Gold Power': null,
  'Holo': null,
  'Ice': null,
  'Pink Ice': null,
  'Pink Velocity': null,
  'Plum Blossom': null,
  'Purple Mojo': null,
  'Teal Mojo': null,
  'Velocity': null,
};

/**
 * Determine the set type based on set name
 */
function determineSetType(setName: string): SetType {
  const lower = setName.toLowerCase();

  // Autographs
  if (lower.includes('autograph')) return 'Autograph';

  // Memorabilia
  if (lower === 'kit kings' || lower === 'kit series') return 'Memorabilia';

  // Base sets (including Rated Rookies)
  if (lower.includes('base') || lower.includes('rated rookies') || lower.includes('optic')) {
    return 'Base';
  }

  // Everything else is an insert
  return 'Insert';
}

/**
 * Parse a set name to extract parent and parallel information
 */
function parseSetName(fullSetName: string): { parentName: string; parallelName: string | null; printRun: number | null } {
  // List of known parent set names (from Master worksheet analysis)
  const PARENT_SETS = [
    'Base',
    'Base Optic',
    'Rated Rookies',
    'Rated Rookies Optic',
    'Animation',
    'Craftsmen',
    'Crunch Time',
    'Kaboom',
    'Kit Kings',
    'Kit Series',
    'Magicians',
    'Net Marvels',
    'Night Moves',
    'Pitch Kings',
    'Rookie Kings',
    'The Rookies',
    'Zero Gravity',
    'Beautiful Game Autographs',
    'Beautiful Game Dual Autographs',
    'Signature Series',
    'Kit Kings Autographs',
    'Kit Series Autographs',
  ];

  // Check if this is a parent set (exact match)
  if (PARENT_SETS.includes(fullSetName)) {
    return { parentName: fullSetName, parallelName: null, printRun: null };
  }

  // Try to find parent set by checking if fullSetName starts with any parent
  for (const parent of PARENT_SETS) {
    if (fullSetName.startsWith(parent + ' ')) {
      const parallelName = fullSetName.substring(parent.length + 1).trim();
      const printRun = PARALLEL_PRINT_RUNS[parallelName] ?? null;
      return { parentName: parent, parallelName, printRun };
    }
  }

  // If no match found, treat as a parent set
  console.warn(`Unknown set name pattern: ${fullSetName}, treating as parent`);
  return { parentName: fullSetName, parallelName: null, printRun: null };
}

/**
 * Read and parse the Excel file
 */
function parseExcelFile(filePath: string): SetInfo[] {
  console.log('Reading Excel file:', filePath);
  const workbook = XLSX.readFile(filePath);

  // Use the Master worksheet
  const masterSheet = workbook.Sheets['Master'];
  if (!masterSheet) {
    throw new Error('Master worksheet not found in Excel file');
  }

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json<{
    'Card Set': string;
    'Card Number': string;
    'Athlete': string;
    'Team': string;
  }>(masterSheet);

  console.log(`Found ${data.length} cards in Master worksheet`);

  // Group cards by set name
  const setMap = new Map<string, ExcelCard[]>();

  for (const row of data) {
    const setName = row['Card Set']?.trim();
    const cardNumber = row['Card Number']?.toString().trim() || '';
    const playerName = row['Athlete']?.trim() || '';
    const team = row['Team']?.trim() || '';

    if (!setName) continue;

    if (!setMap.has(setName)) {
      setMap.set(setName, []);
    }

    setMap.get(setName)!.push({
      setName,
      cardNumber,
      playerName,
      team,
    });
  }

  console.log(`Found ${setMap.size} unique sets`);

  // Convert to SetInfo array
  const sets: SetInfo[] = [];

  for (const [fullSetName, cards] of setMap.entries()) {
    const { parentName, parallelName, printRun } = parseSetName(fullSetName);
    const setType = determineSetType(parentName);

    sets.push({
      name: fullSetName,
      type: setType,
      parentName: parallelName ? parentName : null,
      parallelName,
      printRun,
      cards,
    });
  }

  return sets;
}

/**
 * Import sets and cards into the database
 */
async function importToDatabase(sets: SetInfo[], testMode: boolean = false) {
  // Find or verify the release
  const release = await prisma.release.findFirst({
    where: { slug: '2024-25-panini-donruss-soccer' },
  });

  if (!release) {
    throw new Error('Release "2024-25-panini-donruss-soccer" not found. Please create it first.');
  }

  console.log(`Found release: ${release.name} (${release.id})`);

  // Separate parent sets and parallel sets
  const parentSets = sets.filter(s => s.parentName === null);
  const parallelSets = sets.filter(s => s.parentName !== null);

  console.log(`Parent sets: ${parentSets.length}`);
  console.log(`Parallel sets: ${parallelSets.length}`);

  // In test mode, only import Base sets
  const setsToImport = testMode
    ? parentSets.filter(s => s.name === 'Base' || s.name === 'Base Optic')
    : parentSets;

  const parallelsToImport = testMode
    ? parallelSets.filter(s => s.parentName === 'Base' || s.parentName === 'Base Optic')
    : parallelSets;

  console.log(`\nImporting ${setsToImport.length} parent sets and ${parallelsToImport.length} parallel sets${testMode ? ' (TEST MODE)' : ''}`);

  // Create parent sets first
  const setIdMap = new Map<string, string>(); // Maps set name to database ID

  for (const set of setsToImport) {
    console.log(`\nCreating parent set: ${set.name} (${set.type})`);
    console.log(`  Cards: ${set.cards.length}`);

    // Special handling for "Base Optic" - rename to just "Optic"
    const displayName = set.name === 'Base Optic' ? 'Optic' : set.name;

    // Generate slug using display name
    const slug = generateSetSlug(
      '2024-25',
      'Donruss Soccer',
      displayName,
      set.type
    );

    console.log(`  Display Name: ${displayName}`);
    console.log(`  Slug: ${slug}`);

    // Create the set
    const dbSet = await prisma.set.create({
      data: {
        name: displayName,
        slug,
        type: set.type,
        releaseId: release.id,
        totalCards: set.cards.length.toString(),
        parentSetId: null,
      },
    });

    setIdMap.set(set.name, dbSet.id);

    // Create cards for this parent set
    console.log(`  Creating ${set.cards.length} cards...`);

    for (const card of set.cards) {
      const cardSlug = generateCardSlug(
        'Panini',
        'Donruss Soccer',
        '2024-25',
        displayName,
        card.cardNumber,
        card.playerName,
        null, // No variant for base cards
        null  // No print run for base cards
      );

      await prisma.card.create({
        data: {
          slug: cardSlug,
          playerName: card.playerName,
          team: card.team,
          cardNumber: card.cardNumber,
          setId: dbSet.id,
        },
      });
    }

    console.log(`  ✓ Created set with ${set.cards.length} cards`);
  }

  // Create parallel sets
  for (const parallel of parallelsToImport) {
    const parentId = setIdMap.get(parallel.parentName!);

    if (!parentId) {
      console.warn(`  Warning: Parent set "${parallel.parentName}" not found for parallel "${parallel.name}", skipping`);
      continue;
    }

    console.log(`\nCreating parallel set: ${parallel.name}`);
    console.log(`  Parent: ${parallel.parentName}`);
    console.log(`  Parallel: ${parallel.parallelName}`);
    console.log(`  Print Run: ${parallel.printRun ?? 'unlimited'}`);
    console.log(`  Cards: ${parallel.cards.length}`);

    // Special handling for set names
    let parentDisplayName = parallel.parentName!;
    if (parallel.parentName === 'Base Optic') {
      parentDisplayName = 'Optic';
    } else if (parallel.parentName === 'Rated Rookies Optic') {
      parentDisplayName = 'Rated Rookies Optic';
    }

    // For Base or Rated Rookies sets, generate slug differently to avoid collisions
    // Base sets: just use parallel name (e.g., "2024-25-donruss-soccer-black")
    // Rated Rookies sets: include parent name (e.g., "2024-25-donruss-soccer-rated-rookies-black")
    let slug: string;
    if (parallel.parentName === 'Base') {
      // Base parallels don't include parent name
      slug = generateSetSlug(
        '2024-25',
        'Donruss Soccer',
        'Base',
        parallel.type,
        parallel.parallelName!
      );
    } else {
      // All other parallels include the parent set name
      slug = generateSetSlug(
        '2024-25',
        'Donruss Soccer',
        parentDisplayName,
        parallel.type === 'Base' ? 'Insert' : parallel.type, // Treat Rated Rookies as Insert for slug purposes
        parallel.parallelName!
      );
    }

    console.log(`  Slug: ${slug}`);

    // Create the parallel set
    await prisma.set.create({
      data: {
        name: parallel.parallelName!,
        slug,
        type: parallel.type,
        releaseId: release.id,
        totalCards: parallel.cards.length.toString(),
        printRun: parallel.printRun,
        parentSetId: parentId,
        mirrorsParentChecklist: true,
      },
    });

    console.log(`  ✓ Created parallel set (cards inherited from parent)`);
  }

  console.log('\n✓ Import complete!');

  // Print summary
  const totalSets = await prisma.set.count({
    where: { releaseId: release.id },
  });

  const totalCards = await prisma.card.count({
    where: { set: { releaseId: release.id } },
  });

  console.log(`\nSummary:`);
  console.log(`  Total sets: ${totalSets}`);
  console.log(`  Total cards: ${totalCards}`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const testMode = args.includes('--test');
  const excelPath = '/Users/mh/Desktop/2024-25-Donruss-Soccer-Checklist.xlsx';

  try {
    // Parse Excel file
    const sets = parseExcelFile(excelPath);

    // Import to database
    await importToDatabase(sets, testMode);

  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
