import { PrismaClient } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';
import { uploadChecklistToRelease, getExistingChecklist } from '../../lib/checklistUploader';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface CardData {
  cardNumber: string;
  playerName: string;
  team: string;
  printRun?: number;
}

interface SetData {
  setName: string;
  setType: 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';
  printRun: number | null;
  isParallel: boolean;
  baseSetName: string | null;
  cards: CardData[];
}

// Load the extracted data
const jsonPath = path.join(__dirname, 'Basketball2016PaniniAficionado__data.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Known parallel suffixes and their print runs
const PRINT_RUN_MAP: Record<string, number> = {
  'Artist\'s Proof Red': 1,
  'Artist\'s Proof Bronze': 25,
  'Artist\'s Proof Gold': 10,
  'Artist\'s Proof': 75,
  'Prime': 149,
  'Tip-off': 299,
};

function classifySetType(setName: string): 'Base' | 'Insert' | 'Autograph' | 'Memorabilia' {
  const lower = setName.toLowerCase();
  if (lower.includes('signature') || lower.includes('ink')) return 'Autograph';
  if (lower.includes('memorabilia') || lower.includes('jersey')) return 'Memorabilia';
  if (lower.includes('base set') || lower.includes('opening night')) return 'Base';
  return 'Insert';
}

function extractParallelInfo(setName: string): {
  baseSetName: string;
  variantName: string | null;
  printRun: number | null;
  isParallel: boolean;
} {
  for (const [suffix, printRun] of Object.entries(PRINT_RUN_MAP)) {
    if (setName.endsWith(' ' + suffix)) {
      const baseSetName = setName.substring(0, setName.length - suffix.length - 1);
      return { baseSetName, variantName: suffix, printRun, isParallel: true };
    }
  }
  return { baseSetName: setName, variantName: null, printRun: null, isParallel: false };
}

async function main() {
  console.log('🏀 2016-17 Panini Aficionado Basketball Import\n');

  // Find Panini manufacturer
  const manufacturer = await prisma.manufacturer.findUnique({
    where: { name: 'Panini' }
  });

  if (!manufacturer) {
    throw new Error('Panini manufacturer not found');
  }

  // Check if release already exists
  const existingRelease = await prisma.release.findUnique({
    where: { slug: '2016-17-panini-aficionado-basketball' }
  });

  let release;
  if (existingRelease) {
    console.log('✓ Release already exists, using existing record');
    release = existingRelease;
  } else {
    // Create release
    console.log('Creating release...');
    release = await prisma.release.create({
      data: {
        name: 'Aficionado Basketball',
        year: '2016-17',
        slug: '2016-17-panini-aficionado-basketball',
        manufacturerId: manufacturer.id,
      }
    });
    console.log('✓ Release created');
  }

  // Upload checklist
  const checklistPath = '/Users/mh/Desktop/2016-17-Panini-Aficionado-NBA-Basketball-Cards-Checklist.xls';
  const filename = path.basename(checklistPath);
  const existing = await getExistingChecklist(release.id, filename);

  if (!existing) {
    console.log('Uploading checklist...');
    await uploadChecklistToRelease(
      checklistPath,
      release.id,
      '2016-17 Panini Aficionado Basketball Checklist'
    );
    console.log('✓ Checklist uploaded');
  } else {
    console.log('✓ Checklist already uploaded');
  }

  // Group cards by set (excluding empty sets)
  const cardsBySet = new Map<string, any[]>();
  for (const row of rawData) {
    const setName = row['Card Set'];
    const cardNumber = row['#'];
    const playerName = row['Player'];

    // Skip rows with empty/missing data
    if (!setName || !cardNumber || !playerName) continue;

    if (!cardsBySet.has(setName)) {
      cardsBySet.set(setName, []);
    }
    cardsBySet.get(setName)!.push(row);
  }

  console.log(`\nProcessing ${cardsBySet.size} sets...`);

  let totalSetsCreated = 0;
  let totalCardsCreated = 0;

  for (const [fullSetName, cards] of cardsBySet.entries()) {
    const parallelInfo = extractParallelInfo(fullSetName);
    const setType = classifySetType(parallelInfo.baseSetName);

    // Generate slug
    const slug = generateSetSlug(
      '2016-17',
      'Aficionado Basketball',
      fullSetName,
      setType,
      parallelInfo.variantName,
      parallelInfo.printRun
    );

    // Skip if set already exists
    const existingSet = await prisma.set.findUnique({
      where: { slug }
    });

    if (existingSet) {
      console.log(`  ⊘ ${fullSetName} - already exists, skipping`);
      continue;
    }

    // Create set
    const dbSet = await prisma.set.create({
      data: {
        name: fullSetName,
        slug,
        type: setType,
        isParallel: parallelInfo.isParallel,
        baseSetSlug: parallelInfo.isParallel
          ? generateSetSlug(
              '2016-17',
              'Aficionado Basketball',
              parallelInfo.baseSetName,
              setType,
              null,
              null
            )
          : null,
        printRun: parallelInfo.printRun,
        releaseId: release.id
      }
    });

    totalSetsCreated++;
    let cardsInSet = 0;

    // Create cards
    for (const card of cards) {
      const cardNumber = String(card['#']);
      const playerName = card['Player'];
      const team = card['Team'] || '';

      const cardSlug = generateCardSlug(
        'Panini',
        'Aficionado Basketball',
        '2016-17',
        fullSetName,
        cardNumber,
        playerName,
        parallelInfo.variantName,
        parallelInfo.printRun,
        setType
      );

      // Skip if card already exists
      try {
        await prisma.card.create({
          data: {
            slug: cardSlug,
            cardNumber,
            playerName,
            team,
            variant: parallelInfo.variantName,
            printRun: parallelInfo.printRun,
            setId: dbSet.id
          }
        });
        cardsInSet++;
        totalCardsCreated++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint violation - card already exists
          continue;
        }
        throw error;
      }
    }

    console.log(`  ✓ ${fullSetName}: ${cardsInSet} cards`);
  }

  console.log(`\n✅ Import Complete!`);
  console.log(`   Sets created: ${totalSetsCreated}`);
  console.log(`   Cards created: ${totalCardsCreated}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
