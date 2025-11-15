import * as XLSX from 'xlsx';
import { PrismaClient, SetType } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '@/lib/slugGenerator';

const prisma = new PrismaClient();

/**
 * Simplified import: Each set in Excel becomes a database set with its own cards
 * NO parent-child relationships - all 147 sets are independent
 * This creates 15,201 individual card records from the start
 */

interface ExcelCard {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
}

/**
 * Determine set type based on set name
 */
function determineSetType(setName: string): SetType {
  const lower = setName.toLowerCase();

  if (lower.includes('autograph')) return 'Autograph';
  if (lower === 'kit kings' || lower === 'kit series') return 'Memorabilia';
  if (lower.includes('base') || lower.includes('optic') || lower.includes('rated rookies')) {
    return 'Base';
  }

  return 'Insert';
}

/**
 * Determine print run from set name
 */
function getPrintRun(setName: string): number | null {
  // Known print runs based on parallel names
  const printRunMap: Record<string, number> = {
    'Black': 1,
    'Green': 5,
    'Gold': 10,
    'Purple': 25,
    'Pink Diamond': 25,
    'Blue': 49,
    'Red': 99,
    'Blue Cubic': 99,
    'Pink Cubic': 99,
    'Red Cubic': 99,
    'Teal': 199,
  };

  // Check if set name ends with any parallel name
  for (const [parallelName, printRun] of Object.entries(printRunMap)) {
    if (setName.endsWith(parallelName)) {
      return printRun;
    }
  }

  return null;
}

async function main() {
  console.log('🎴 IMPORTING DONRUSS SOCCER - ALL CARDS VERSION');
  console.log('='.repeat(80));

  // Read Excel file
  console.log('\n1. Reading Excel file...');
  const workbook = XLSX.readFile('/Users/mh/Desktop/2024-25-Donruss-Soccer-Checklist.xlsx');
  const masterSheet = workbook.Sheets['Master'];
  const data = XLSX.utils.sheet_to_json<{
    'Card Set': string;
    'Card Number': string;
    'Athlete': string;
    'Team': string;
  }>(masterSheet);

  console.log(`   Found ${data.length} card entries`);

  // Group by set name
  const setMap = new Map<string, ExcelCard[]>();
  for (const row of data) {
    const setName = row['Card Set']?.trim();
    if (!setName) continue;

    if (!setMap.has(setName)) {
      setMap.set(setName, []);
    }

    setMap.get(setName)!.push({
      setName,
      cardNumber: row['Card Number']?.toString().trim() || '',
      playerName: row['Athlete']?.trim() || '',
      team: row['Team']?.trim() || '',
    });
  }

  console.log(`   Found ${setMap.size} unique sets\n`);

  // Merge Rated Rookies into Base/Optic sets
  console.log('2. Merging Rated Rookies into Base/Optic sets...');

  // Merge "Rated Rookies" into "Base"
  const ratedRookiesCards = setMap.get('Rated Rookies') || [];
  if (ratedRookiesCards.length > 0) {
    const baseCards = setMap.get('Base') || [];
    setMap.set('Base', [...baseCards, ...ratedRookiesCards]);
    setMap.delete('Rated Rookies');
    console.log(`   Merged ${ratedRookiesCards.length} Rated Rookies cards into Base`);
  }

  // Merge "Rated Rookies Optic" into "Base Optic"
  const ratedRookiesOpticCards = setMap.get('Rated Rookies Optic') || [];
  if (ratedRookiesOpticCards.length > 0) {
    const opticCards = setMap.get('Base Optic') || [];
    setMap.set('Base Optic', [...opticCards, ...ratedRookiesOpticCards]);
    setMap.delete('Rated Rookies Optic');
    console.log(`   Merged ${ratedRookiesOpticCards.length} Rated Rookies Optic cards into Base Optic`);
  }

  // Merge all "Rated Rookies [Parallel]" into corresponding "Base [Parallel]"
  for (const [setName, cards] of Array.from(setMap.entries())) {
    if (setName.startsWith('Rated Rookies ')) {
      const parallelName = setName.substring(14); // Remove "Rated Rookies "
      const baseSetName = `Base ${parallelName}`;

      const baseCards = setMap.get(baseSetName) || [];
      setMap.set(baseSetName, [...baseCards, ...cards]);
      setMap.delete(setName);
      console.log(`   Merged ${cards.length} cards from "${setName}" into "${baseSetName}"`);
    }
  }

  // Merge all "Rated Rookies Optic [Parallel]" into corresponding "Base Optic [Parallel]"
  for (const [setName, cards] of Array.from(setMap.entries())) {
    if (setName.startsWith('Rated Rookies Optic ')) {
      const parallelName = setName.substring(20); // Remove "Rated Rookies Optic "
      const opticSetName = `Base Optic ${parallelName}`;

      const opticCards = setMap.get(opticSetName) || [];
      setMap.set(opticSetName, [...opticCards, ...cards]);
      setMap.delete(setName);
      console.log(`   Merged ${cards.length} cards from "${setName}" into "${opticSetName}"`);
    }
  }

  console.log(`   Final set count after merging: ${setMap.size}\n`);

  // Find release
  const release = await prisma.release.findFirst({
    where: { slug: '2024-25-panini-donruss-soccer' },
  });

  if (!release) {
    throw new Error('Release not found');
  }

  console.log(`3. Found release: ${release.name}\n`);

  // Import each set
  let setsCreated = 0;
  let cardsCreated = 0;

  for (const [fullSetName, cards] of setMap.entries()) {
    const setType = determineSetType(fullSetName);
    const printRun = getPrintRun(fullSetName);

    // Clean up set name for display
    // "Base Optic" → "Optic"
    // "Base Optic Black" → "Optic Black"
    // "Rated Rookies" stays as is (will be parent set for its 200 cards)
    let displaySetName = fullSetName;
    if (fullSetName.startsWith('Base Optic ')) {
      displaySetName = fullSetName.replace('Base Optic ', 'Optic ');
    } else if (fullSetName === 'Base Optic') {
      displaySetName = 'Optic';
    }

    // Extract variant/parallel name from set name
    // "Base Black" → variant: "Black"
    // "Optic Argyle" → variant: "Argyle"
    // "Animation Silver" → variant: "Silver"
    let variantName: string | null = null;
    let baseSetName = displaySetName;

    // Order matters! Check longer/compound names FIRST (e.g., "Pink Cubic" before "Cubic")
    const knownParallels = [
      // Compound names MUST come before their substrings
      'Optic Black Pandora', 'Black Pandora',
      'Blue Cubic', 'Pink Cubic', 'Red Cubic',
      'Pink Diamond', 'Pink Ice', 'Pink Velocity',
      'Gold Power', 'Purple Mojo', 'Teal Mojo',
      'Plum Blossom', 'Dragon Scale',
      // Single word parallels
      'Argyle', 'Black', 'Blue', 'Cubic', 'Diamond',
      'Gold', 'Green', 'Holo', 'Ice', 'Purple',
      'Red', 'Silver', 'Teal', 'Velocity', 'Pink',
    ];

    // Special case: if set starts with "Optic " it's an Optic parallel
    if (displaySetName.startsWith('Optic ')) {
      variantName = displaySetName.substring(6); // Remove "Optic "
      baseSetName = 'Optic';
    } else {
      // For all other sets, check if they end with a parallel name
      for (const parallel of knownParallels) {
        if (displaySetName.endsWith(' ' + parallel)) {
          variantName = parallel;
          baseSetName = displaySetName.substring(0, displaySetName.length - parallel.length - 1).trim();
          break;
        }
      }
    }

    // Generate slug - for parallels, use baseSetName + variant to avoid collisions
    // For Insert/Auto/Mem sets, setType prefix ensures the base set name is included
    let slug: string;
    if (variantName && setType === 'Base' && baseSetName === 'Base') {
      // Base parallels: just use variant name (e.g., "2024-25-donruss-soccer-black")
      slug = generateSetSlug('2024-25', 'Donruss Soccer', 'Base', setType, variantName);
    } else if (variantName && setType === 'Base' && baseSetName === 'Optic') {
      // Optic parallels: Treat as Insert to include "Optic" in slug
      // This prevents collision with Base parallels
      slug = generateSetSlug('2024-25', 'Donruss Soccer', 'Optic', 'Insert', variantName);
    } else if (variantName) {
      // Insert/Auto/Mem parallels: include set name (e.g., "2024-25-donruss-soccer-insert-craftsmen-black")
      slug = generateSetSlug('2024-25', 'Donruss Soccer', baseSetName, setType, variantName);
    } else {
      // Non-parallel sets
      slug = generateSetSlug('2024-25', 'Donruss Soccer', displaySetName, setType);
    }

    console.log(`Creating set: ${displaySetName} (${setType})`);
    console.log(`  Cards: ${cards.length}`);
    console.log(`  Variant: ${variantName || 'Base'}`);
    console.log(`  Print run: ${printRun || 'unlimited'}`);
    console.log(`  Slug: ${slug}`);

    // Create the set
    const dbSet = await prisma.set.create({
      data: {
        name: displaySetName,
        slug,
        type: setType,
        releaseId: release.id,
        totalCards: cards.length.toString(),
        printRun,
        parentSetId: null, // No parent-child relationships
      },
    });

    setsCreated++;

    // Create cards
    for (const card of cards) {
      // Generate unique card slug by combining set slug + card number + player name
      // This ensures uniqueness across all sets and parallels
      const cardSlug = `${slug}-${card.cardNumber}-${card.playerName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      await prisma.card.create({
        data: {
          slug: cardSlug,
          playerName: card.playerName,
          team: card.team,
          cardNumber: card.cardNumber,
          variant: variantName,
          printRun,
          setId: dbSet.id,
        },
      });

      cardsCreated++;
    }

    console.log(`  ✓ Created ${cards.length} cards\n`);
  }

  console.log('='.repeat(80));
  console.log('✅ IMPORT COMPLETE!');
  console.log(`   Sets created: ${setsCreated}`);
  console.log(`   Cards created: ${cardsCreated.toLocaleString()}`);
  console.log('='.repeat(80));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
