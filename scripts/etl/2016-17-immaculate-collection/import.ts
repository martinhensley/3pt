/**
 * ETL Import Script for 2016-17 Panini Immaculate Collection Basketball
 *
 * Base Set: 139 cards (1-100 veterans /99, 101-140 rookies with AUTO PATCH, #138 DNE)
 * Base Parallels: 139 cards each - Blue /35, Red /25, Gold /10, Emerald Special /5, Platinum 1/1
 */

import { PrismaClient, SetType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { uploadChecklistToRelease, getExistingChecklist } from '../../../lib/checklistUploader';

const prisma = new PrismaClient();

const RELEASE_SLUG = '2016-17-panini-immaculate-collection-basketball';
const CHECKLIST_PATH = path.join(__dirname, 'checklist.csv');
const ORIGINAL_FILE_PATH = path.join(__dirname, 'checklist.csv');

// Base Set parallel print runs (cards 1-100 only)
const BASE_PARALLEL_PRINT_RUNS: Record<string, number> = {
  'Blue': 35,
  'Red': 25,
  'Gold': 10,
  'Emerald Special': 5,
  'Platinum': 1,
};

// Parallel variant mappings for Immaculate Collection
const PARALLEL_VARIANTS: Record<string, { suffix: string }> = {
  'Gold': { suffix: 'gold' },
  'Platinum': { suffix: 'platinum' },
  'Red': { suffix: 'red' },
  'Blue': { suffix: 'blue' },
  'Emerald Special': { suffix: 'emerald-special' },
  'Prime': { suffix: 'prime' },
  'Jersey Number': { suffix: 'jersey-number' },
  'Jersey': { suffix: 'jersey' },
  'Jumbo': { suffix: 'jumbo' },
};

interface CardRow {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
  printRun: number | null;
}

// Rookie data (cards 101-140, #138 does not exist)
const ROOKIE_DATA: { cardNumber: string; playerName: string; team: string }[] = [
  { cardNumber: '101', playerName: 'Paul Zipser', team: 'Chicago Bulls' },
  { cardNumber: '102', playerName: 'Tomas Satoransky', team: 'Washington Wizards' },
  { cardNumber: '103', playerName: 'Stephen Zimmerman', team: 'Orlando Magic' },
  { cardNumber: '104', playerName: 'Kay Felder', team: 'Cleveland Cavaliers' },
  { cardNumber: '105', playerName: 'Dejounte Murray', team: 'San Antonio Spurs' },
  { cardNumber: '106', playerName: 'Jake Layman', team: 'Portland Trail Blazers' },
  { cardNumber: '107', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings' },
  { cardNumber: '108', playerName: 'Skal Labissiere', team: 'Sacramento Kings' },
  { cardNumber: '109', playerName: 'Malcolm Brogdon', team: 'Milwaukee Bucks' },
  { cardNumber: '110', playerName: 'Juan Hernangomez', team: 'Denver Nuggets' },
  { cardNumber: '111', playerName: 'Patrick McCaw', team: 'Golden State Warriors' },
  { cardNumber: '112', playerName: 'Caris LeVert', team: 'Brooklyn Nets' },
  { cardNumber: '113', playerName: 'Willy Hernangomez', team: 'New York Knicks' },
  { cardNumber: '114', playerName: 'Chinanu Onuaku', team: 'Houston Rockets' },
  { cardNumber: '115', playerName: 'Cheick Diallo', team: 'New Orleans Pelicans' },
  { cardNumber: '116', playerName: 'Marquese Chriss', team: 'Phoenix Suns' },
  { cardNumber: '117', playerName: 'Henry Ellenson', team: 'Detroit Pistons' },
  { cardNumber: '118', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers' },
  { cardNumber: '119', playerName: 'Domantas Sabonis', team: 'Oklahoma City Thunder' },
  { cardNumber: '120', playerName: 'Malachi Richardson', team: 'Sacramento Kings' },
  { cardNumber: '121', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers' },
  { cardNumber: '122', playerName: 'Malik Beasley', team: 'Denver Nuggets' },
  { cardNumber: '123', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies' },
  { cardNumber: '124', playerName: 'Pascal Siakam', team: 'Toronto Raptors' },
  { cardNumber: '125', playerName: 'Marshall Plumlee', team: 'New York Knicks' },
  { cardNumber: '126', playerName: 'Buddy Hield', team: 'New Orleans Pelicans' },
  { cardNumber: '127', playerName: 'Dragan Bender', team: 'Phoenix Suns' },
  { cardNumber: '128', playerName: 'Demetrius Jackson', team: 'Boston Celtics' },
  { cardNumber: '129', playerName: 'Jakob Poeltl', team: 'Toronto Raptors' },
  { cardNumber: '130', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers' },
  { cardNumber: '131', playerName: 'Thon Maker', team: 'Milwaukee Bucks' },
  { cardNumber: '132', playerName: 'Mindaugas Kuzminskas', team: 'New York Knicks' },
  { cardNumber: '133', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies' },
  { cardNumber: '134', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves' },
  { cardNumber: '135', playerName: 'Jamal Murray', team: 'Denver Nuggets' },
  { cardNumber: '136', playerName: 'Tyler Ulis', team: 'Phoenix Suns' },
  { cardNumber: '137', playerName: 'Georges Niang', team: 'Indiana Pacers' },
  // Card 138 does not exist
  { cardNumber: '139', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets' },
  { cardNumber: '140', playerName: 'Denzel Valentine', team: 'Chicago Bulls' },
];

// Base set-specific print runs for rookies (most are /99, some differ)
const BASE_ROOKIE_PRINT_RUNS: Record<string, number> = {
  '116': 81,  // Marquese Chriss
  '134': 85,  // Kris Dunn
};

// Triple Autographs set (missing from CSV) - 27 cards /25
const TRIPLE_AUTOGRAPHS_DATA: { cardNumber: string; playerName: string }[] = [
  { cardNumber: '1', playerName: 'Kevin Love/Tristan Thompson/Kyrie Irving' },
  { cardNumber: '2', playerName: 'Tony Parker/David Robinson/George Gervin' },
  { cardNumber: '3', playerName: 'Brandon Ingram/Julius Randle/Jordan Clarkson' },
  { cardNumber: '4', playerName: 'Evan Fournier/Nicolas Batum/Tony Parker' },
  { cardNumber: '5', playerName: 'Domantas Sabonis/Mindaugas Kuzminskas/Jonas Valanciunas' },
  { cardNumber: '6', playerName: 'Allan Houston/Bernard King/Tobias Harris' },
  { cardNumber: '7', playerName: 'John Starks/Latrell Sprewell/Patrick Ewing' },
  { cardNumber: '8', playerName: 'Grant Hill/Justise Winslow/Luol Deng' },
  { cardNumber: '10', playerName: 'Grant Hill/Jerry Stackhouse/Joe Dumars' },
  { cardNumber: '13', playerName: 'Brandon Ingram/Buddy Hield/Jaylen Brown' },
  { cardNumber: '14', playerName: 'Jamal Murray/Brandon Ingram/Kris Dunn' },
  { cardNumber: '15', playerName: 'Clyde Drexler/Hakeem Olajuwon/Yao Ming' },
  { cardNumber: '16', playerName: 'Caris LeVert/Isaiah Whitehead/Jeremy Lin' },
  { cardNumber: '17', playerName: 'Anthony Davis/Karl-Anthony Towns/Kristaps Porzingis' },
  { cardNumber: '18', playerName: 'Anthony Davis/Kevin Durant/Kyrie Irving' },
  { cardNumber: '19', playerName: 'Bernard King/Kristaps Porzingis/Patrick Ewing' },
  { cardNumber: '21', playerName: 'Ryan Anderson/Jason Kidd/Jaylen Brown' },
  { cardNumber: '22', playerName: 'Chris Paul/Blake Griffin/JJ Redick' },
  { cardNumber: '23', playerName: 'Jimmy Butler/Nikola Mirotic/Dwyane Wade' },
  { cardNumber: '24', playerName: 'Chauncey Billups/Ben Wallace/Richard Hamilton' },
  { cardNumber: '25', playerName: 'Anthony Davis/David Robinson/Hakeem Olajuwon' },
  { cardNumber: '26', playerName: 'Gary Payton/Ray Allen/Shawn Kemp' },
  { cardNumber: '28', playerName: 'Brandon Ingram/Kobe Bryant/Magic Johnson' },
  { cardNumber: '29', playerName: 'DeMar DeRozan/DeMarre Carroll/Jonas Valanciunas' },
  { cardNumber: '30', playerName: 'Dario Saric/Joel Embiid/Timothe Luwawu-Cabarrot' },
  { cardNumber: '31', playerName: 'Juan Hernangomez/Malik Beasley/Jamal Murray' },
  { cardNumber: '32', playerName: 'Dragan Bender/Marquese Chriss/Tyler Ulis' },
];

// Generate Triple Autographs cards (missing from CSV)
function generateTripleAutographsCards(): CardRow[] {
  return TRIPLE_AUTOGRAPHS_DATA.map(card => ({
    setName: 'Triple Autographs',
    cardNumber: card.cardNumber,
    playerName: card.playerName,
    team: '',
    printRun: 25,
  }));
}

// Generate missing rookie cards for Base Set AND all parallels
// All Base sets should have 139 cards (1-100 veterans + 101-140 rookies, #138 DNE)
function generateMissingRookieCards(): CardRow[] {
  const cards: CardRow[] = [];
  const sets = ['Base Set', 'Base Set Blue', 'Base Set Red', 'Base Set Gold', 'Base Set Emerald Special', 'Base Set Platinum'];

  for (const setName of sets) {
    for (const rookie of ROOKIE_DATA) {
      let printRun: number;

      if (setName === 'Base Set') {
        // Base set uses specific print runs per card
        printRun = BASE_ROOKIE_PRINT_RUNS[rookie.cardNumber] || 99;
      } else {
        // Parallels use their fixed print run
        const variant = setName.replace('Base Set ', '');
        printRun = BASE_PARALLEL_PRINT_RUNS[variant];
      }

      cards.push({
        setName,
        cardNumber: rookie.cardNumber,
        playerName: rookie.playerName,
        team: rookie.team,
        printRun,
      });
    }
  }

  return cards;
}

function parseCSV(content: string): CardRow[] {
  const lines = content.trim().split('\n');
  const cards: CardRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Remove leading/trailing quotes and handle the CSV format with embedded quotes
    // Format: "Card Set,""Number"",""Player"",""Team"",""Seq."""
    const cleanLine = line.replace(/^"|"$/g, '');

    // Split by ,"" pattern (the quote-comma-quote separator)
    const parts = cleanLine.split(',""');

    if (parts.length >= 4) {
      const setName = parts[0].replace(/"/g, '').trim();
      const cardNumber = parts[1].replace(/"/g, '').trim();
      const playerName = parts[2].replace(/"/g, '').trim();
      const team = parts[3].replace(/"/g, '').trim();
      const seq = parts[4]?.replace(/"/g, '').trim();
      const printRun = seq && !isNaN(Number(seq)) ? Number(seq) : null;

      if (setName && cardNumber && playerName) {
        cards.push({ setName, cardNumber, playerName, team, printRun });
      }
    }
  }

  return cards;
}

function determineSetType(setName: string, originalSetName: string): SetType {
  const lower = setName.toLowerCase();
  const originalLower = originalSetName.toLowerCase();

  // Autograph sets - check first since some have both auto and mem keywords
  if (lower.includes('autograph') || lower.includes('signature') ||
      lower.includes('scripts') || lower.includes('modern marks') ||
      lower.includes('historical significance') || lower.includes('immaculate moments') ||
      lower.includes('marks of greatness') || lower.includes('milestones') ||
      lower.includes('triple autographs')) {
    return 'Autograph';
  }

  // Memorabilia sets - check both base name and original name
  // (handles cases like "Prime Jersey Number" where "Jersey Number" is extracted as variant)
  if (lower.includes('materials') || lower.includes('patch') ||
      lower.includes('jersey') || lower.includes('logoman') ||
      lower.includes('swatch') || lower.includes('laces') ||
      lower.includes('memorabilia') || lower.includes('nobility') ||
      lower.includes('prime') || lower.includes('sneak peek') ||
      lower.includes('the standard') ||
      originalLower.includes('jersey')) {
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
  // Check for parallel variants - check longer names first
  const orderedVariants = Object.keys(PARALLEL_VARIANTS).sort((a, b) => b.length - a.length);

  for (const variant of orderedVariants) {
    // Only match if variant is at the end of the set name
    if (setName.endsWith(variant)) {
      const baseSetName = setName.slice(0, -variant.length).trim();
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
  console.log('🏀 Starting import for 2016-17 Panini Immaculate Collection Basketball\n');

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
  let cards = parseCSV(csvContent);
  console.log(`📊 Parsed ${cards.length} card rows from checklist`);

  // Add rookies 101-140 for Base Set and all parallels (missing from CSV)
  const missingRookies = generateMissingRookieCards();
  cards = [...cards, ...missingRookies];
  console.log(`📊 Added ${missingRookies.length} rookie cards (101-140) for Base Set and parallels`);

  // Add Triple Autographs set (missing from CSV)
  const tripleAutos = generateTripleAutographsCards();
  cards = [...cards, ...tripleAutos];
  console.log(`📊 Added ${tripleAutos.length} Triple Autographs cards`);

  console.log(`📊 Total cards: ${cards.length}\n`);

  // Upload source document
  const originalFilename = 'checklist.csv';

  const existingDoc = await getExistingChecklist(release.id, originalFilename);

  if (!existingDoc) {
    await uploadChecklistToRelease(ORIGINAL_FILE_PATH, release.id, 'Checklist');
    console.log(`📎 Uploaded source document: ${originalFilename}\n`);
  } else {
    console.log(`📎 Source document already exists: ${originalFilename}\n`);
  }

  // Apply fixed print runs for Base Set parallels (cards 1-100 only)
  cards = cards.map(card => {
    if (card.setName.startsWith('Base Set ')) {
      const variant = card.setName.replace('Base Set ', '');
      if (BASE_PARALLEL_PRINT_RUNS[variant]) {
        return { ...card, printRun: BASE_PARALLEL_PRINT_RUNS[variant] };
      }
    }
    return card;
  });

  // Group cards by set
  const cardsBySet = new Map<string, CardRow[]>();

  for (const card of cards) {
    if (!cardsBySet.has(card.setName)) {
      cardsBySet.set(card.setName, []);
    }
    cardsBySet.get(card.setName)!.push(card);
  }

  console.log(`📦 Grouped into ${cardsBySet.size} sets\n`);

  // Process each set
  let totalCardsCreated = 0;
  let setsCreated = 0;

  for (const [setName, setCards] of cardsBySet) {
    const { baseSetName, variantName, isParallel } = extractParallelInfo(setName);
    const setType = determineSetType(baseSetName, setName);

    // Detect uniform print run - if all cards have the same print run, use it for the set
    const printRuns = setCards.map(c => c.printRun).filter(p => p !== null);
    const uniquePrintRuns = [...new Set(printRuns)];
    const setPrintRun: number | null = uniquePrintRuns.length === 1 ? uniquePrintRuns[0] : null;

    // Generate set slug (include print run for parallels with uniform print runs)
    const setSlug = generateSetSlug('2016-17', 'immaculate-collection', baseSetName, variantName, setPrintRun);

    // Generate base set slug for parallels
    const baseSetSlug = isParallel
      ? generateSetSlug('2016-17', 'immaculate-collection', baseSetName, null, null)
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
        printRun: setPrintRun,
        expectedCardCount: setCards.length,
      }
    });

    setsCreated++;
    const printRunDisplay = setPrintRun ? (setPrintRun === 1 ? ' [1/1]' : ` [/${setPrintRun}]`) : '';
    console.log(`  📁 ${isParallel ? '↳' : '•'} ${displayName} (${setType})${printRunDisplay} - ${setCards.length} cards`);

    // Create cards
    for (const card of setCards) {
      const cardSlug = generateCardSlug(
        '2016-17',
        'immaculate-collection',
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
            printRun: card.printRun,
            numbered,
            slug: cardSlug,
          },
          update: {
            playerName: card.playerName,
            team: card.team || null,
            variant: variantName,
            printRun: card.printRun,
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
