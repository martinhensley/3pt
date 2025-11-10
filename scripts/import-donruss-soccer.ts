import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { generateCardSlug, generateSetSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

// Print run mapping for parallels
const PRINT_RUNS: Record<string, number | null> = {
  'Teal': 199,
  'Blue Cubic': 99,
  'Pink Cubic': 99,
  'Red': 99,
  'Red Cubic': 99,
  'Blue': 49,
  'Pink Diamond': 25,
  'Purple': 25,
  'Gold': 10,
  'Green': 5,
  'Black': 1,
  // Base Donruss parallels (no print runs listed)
  'Cubic': null,
  'Diamond': null,
  'Silver': null,
  // Base Optic parallels (no print runs listed)
  'Optic': null,
  'Optic Argyle': null,
  'Optic Black': null,
  'Optic Black Pandora': null,
  'Optic Blue': null,
  'Optic Dragon Scale': null,
  'Optic Gold': null,
  'Optic Gold Power': null,
  'Optic Green': null,
  'Optic Holo': null,
  'Optic Ice': null,
  'Optic Pink Ice': null,
  'Optic Pink Velocity': null,
  'Optic Plum Blossom': null,
  'Optic Purple Mojo': null,
  'Optic Red': null,
  'Optic Teal Mojo': null,
  'Optic Velocity': null,
};

interface CardRow {
  'Card Set': string;
  'Card Number': number;
  'Athlete': string;
  'Team': string;
  'Sequence': any;
}

// Determine set type based on name
function determineSetType(setName: string): 'Base' | 'Insert' | 'Autograph' | 'Memorabilia' {
  const lower = setName.toLowerCase();

  if (lower.includes('autograph') || lower.includes('signature')) {
    return 'Autograph';
  }

  if (lower.includes('kit kings') || lower.includes('kit series')) {
    return 'Memorabilia';
  }

  if (setName === 'Base' || setName === 'Base Optic' || setName === 'Rated Rookies') {
    return 'Base';
  }

  return 'Insert';
}

// Extract parallel name from full set name
function extractParallelName(fullSetName: string, baseSetName: string): string | null {
  // Remove base set name from the beginning
  let parallel = fullSetName.replace(baseSetName, '').trim();

  if (!parallel || parallel === fullSetName) {
    return null; // This is the base set itself
  }

  return parallel;
}

// Get print run for a parallel
function getParallelPrintRun(parallelName: string): number | null {
  // Check direct match first
  if (PRINT_RUNS.hasOwnProperty(parallelName)) {
    return PRINT_RUNS[parallelName];
  }

  // Check without "Optic" prefix for Optic parallels
  const withoutOptic = parallelName.replace('Optic ', '');
  if (PRINT_RUNS.hasOwnProperty(withoutOptic)) {
    return PRINT_RUNS[withoutOptic];
  }

  return null;
}

async function main() {
  console.log('🏈 Starting Donruss Soccer import...\n');

  // Find the release
  const release = await prisma.release.findFirst({
    where: {
      slug: '2024-25-panini-donruss-soccer',
    },
  });

  if (!release) {
    throw new Error('Release not found! Please create "2024-25 Panini Donruss Soccer" first.');
  }

  console.log(`✅ Found release: ${release.name}\n`);

  // Read Excel file
  const workbook = XLSX.readFile('/Users/mh/Desktop/2024-25-Donruss-Soccer-Checklist.xlsx');
  const worksheet = workbook.Sheets['Master'];
  const data = XLSX.utils.sheet_to_json<CardRow>(worksheet);

  console.log(`📊 Read ${data.length} total card entries\n`);

  // Group cards by set
  const cardsBySet = new Map<string, CardRow[]>();
  for (const card of data) {
    const setName = card['Card Set'];
    if (!cardsBySet.has(setName)) {
      cardsBySet.set(setName, []);
    }
    cardsBySet.get(setName)!.push(card);
  }

  console.log(`📦 Found ${cardsBySet.size} unique sets\n`);

  // Identify parent sets and their parallels
  const parentSets = new Set<string>(['Base', 'Base Optic']);

  // Add other parent sets (inserts, autos, memorabilia)
  for (const setName of cardsBySet.keys()) {
    // Check if this is a base set variant (has a parallel suffix)
    let isParallel = false;
    for (const parent of parentSets) {
      if (setName.startsWith(parent + ' ') && setName !== parent) {
        isParallel = true;
        break;
      }
    }

    if (!isParallel && setName !== 'Base' && setName !== 'Base Optic') {
      // Check if there are colored variants of this set
      const hasVariants = Array.from(cardsBySet.keys()).some(
        name => name.startsWith(setName + ' ') && name !== setName
      );

      if (hasVariants) {
        parentSets.add(setName);
      }
    }
  }

  console.log('🎯 Parent sets identified:');
  for (const parent of parentSets) {
    const parallelCount = Array.from(cardsBySet.keys()).filter(
      name => name.startsWith(parent + ' ') && name !== parent
    ).length;
    console.log(`   - ${parent} (${parallelCount} parallels)`);
  }
  console.log();

  const createdSets = new Map<string, any>();
  let totalSetsCreated = 0;
  let totalCardsCreated = 0;

  // First pass: Create all parent sets
  console.log('📝 Creating parent sets...\n');

  for (const parentSetName of parentSets) {
    const cards = cardsBySet.get(parentSetName);
    if (!cards || cards.length === 0) continue;

    const setType = determineSetType(parentSetName);
    const slug = generateSetSlug('2024-25', 'Panini Donruss Soccer', parentSetName, setType);

    // Check if set already exists
    let set = await prisma.set.findUnique({ where: { slug } });

    if (!set) {
      set = await prisma.set.create({
        data: {
          name: parentSetName,
          slug,
          type: setType,
          releaseId: release.id,
          totalCards: cards.length.toString(),
        },
      });
      console.log(`✅ Created parent set: ${parentSetName} (${setType})`);
      totalSetsCreated++;
    } else {
      console.log(`⚠️  Parent set already exists: ${parentSetName}`);
    }

    createdSets.set(parentSetName, set);

    // Create cards for parent set in batches
    const cardsToCreate = [];
    for (const card of cards) {
      const cardSlug = generateCardSlug(
        'Panini',
        'Donruss Soccer',
        '2024-25',
        parentSetName,
        card['Card Number'].toString(),
        card['Athlete'],
        null, // No variant for base cards
        null  // No print run for base cards
      );

      cardsToCreate.push({
        playerName: card['Athlete'],
        team: card['Team'],
        cardNumber: card['Card Number'].toString(),
        setId: set.id,
        slug: cardSlug,
      });
    }

    // Use createMany with skipDuplicates
    const result = await prisma.card.createMany({
      data: cardsToCreate,
      skipDuplicates: true,
    });

    totalCardsCreated += result.count;
    console.log(`   📇 Created ${result.count} cards for ${parentSetName}`);
  }

  console.log();

  // Second pass: Create parallel sets
  console.log('🎨 Creating parallel sets...\n');

  for (const [fullSetName, cards] of cardsBySet.entries()) {
    // Skip if this is a parent set
    if (parentSets.has(fullSetName)) continue;

    // Find the parent set
    let parentSetName: string | null = null;
    for (const parent of parentSets) {
      if (fullSetName.startsWith(parent + ' ')) {
        parentSetName = parent;
        break;
      }
    }

    if (!parentSetName) {
      // This is a standalone set (like Night Moves)
      const setType = determineSetType(fullSetName);
      const slug = generateSetSlug('2024-25', 'Panini Donruss Soccer', fullSetName, setType);

      let set = await prisma.set.findUnique({ where: { slug } });

      if (!set) {
        set = await prisma.set.create({
          data: {
            name: fullSetName,
            slug,
            type: setType,
            releaseId: release.id,
            totalCards: cards.length.toString(),
          },
        });
        console.log(`✅ Created standalone set: ${fullSetName} (${setType})`);
        totalSetsCreated++;
      } else {
        console.log(`⚠️  Standalone set already exists: ${fullSetName}`);
      }

      createdSets.set(fullSetName, set);

      // Create cards in batch
      const cardsToCreate = cards.map(card => {
        const cardSlug = generateCardSlug(
          'Panini',
          'Donruss Soccer',
          '2024-25',
          fullSetName,
          card['Card Number'].toString(),
          card['Athlete'],
          null,
          null
        );

        return {
          playerName: card['Athlete'],
          team: card['Team'],
          cardNumber: card['Card Number'].toString(),
          setId: set.id,
          slug: cardSlug,
        };
      });

      const result = await prisma.card.createMany({
        data: cardsToCreate,
        skipDuplicates: true,
      });

      totalCardsCreated += result.count;
      console.log(`   📇 Created ${result.count} cards for ${fullSetName}`);
      continue;
    }

    // This is a parallel set
    const parallelName = extractParallelName(fullSetName, parentSetName);
    if (!parallelName) continue;

    const parentSet = createdSets.get(parentSetName);
    if (!parentSet) {
      console.log(`⚠️  Warning: Parent set not found for ${fullSetName}`);
      continue;
    }

    const setType = determineSetType(fullSetName);
    const slug = generateSetSlug('2024-25', 'Panini Donruss Soccer', fullSetName, setType, parallelName);
    const printRun = getParallelPrintRun(parallelName);

    let parallelSet = await prisma.set.findUnique({ where: { slug } });

    if (!parallelSet) {
      parallelSet = await prisma.set.create({
        data: {
          name: fullSetName,
          slug,
          type: setType,
          releaseId: release.id,
          parentSetId: parentSet.id,
          totalCards: cards.length.toString(),
          printRun: printRun,
        },
      });
      console.log(`✅ Created parallel: ${fullSetName}${printRun ? ` (/${printRun})` : ''}`);
      totalSetsCreated++;
    } else {
      console.log(`⚠️  Parallel already exists: ${fullSetName}`);
    }

    createdSets.set(fullSetName, parallelSet);

    // Create cards for parallel in batch
    const cardsToCreate = cards.map(card => {
      const cardSlug = generateCardSlug(
        'Panini',
        'Donruss Soccer',
        '2024-25',
        fullSetName,
        card['Card Number'].toString(),
        card['Athlete'],
        parallelName,
        printRun
      );

      return {
        playerName: card['Athlete'],
        team: card['Team'],
        cardNumber: card['Card Number'].toString(),
        variant: parallelName,
        parallelType: parallelName,
        printRun: printRun,
        numbered: printRun ? `/${printRun}` : null,
        setId: parallelSet.id,
        slug: cardSlug,
      };
    });

    const result = await prisma.card.createMany({
      data: cardsToCreate,
      skipDuplicates: true,
    });

    totalCardsCreated += result.count;
    console.log(`   📇 Created ${result.count} cards for ${fullSetName}`);
  }

  console.log('\n✅ Import complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Sets created: ${totalSetsCreated}`);
  console.log(`   - Cards created: ${totalCardsCreated}`);
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
