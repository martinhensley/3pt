import * as xlsx from 'xlsx';
import { prisma } from '/Users/mh/footy/lib/prisma';
import { generateCardSlug } from '/Users/mh/footy/lib/slugGenerator';

// Missing sets with their types predefined
const SET_TYPE_MAP: Record<string, 'Base' | 'Insert' | 'Memorabilia' | 'Autograph'> = {
  'Black Color Blast': 'Insert',
  'Iridescent': 'Insert',
  'White Night': 'Insert',
  'Trifecta Material Electric Etch Red Flood': 'Memorabilia',
  'Trifecta Material Electric Etch Red Pulsar': 'Memorabilia',
  'Trifecta Material Electric Etch Taiga': 'Memorabilia',
  'USWNT Class of 19': 'Insert',
  'USWNT Class of 19 Electric Etch Blue Finite': 'Insert',
  'USWNT Class of 19 Electric Etch Blue Flood': 'Insert',
  'USWNT Class of 19 Electric Etch Blue Pulsar': 'Insert',
  'USWNT Class of 19 Electric Etch Gold Flood': 'Insert',
  'USWNT Class of 19 Electric Etch Green': 'Insert',
  'USWNT Class of 19 Electric Etch Green Flood': 'Insert',
  'USWNT Class of 19 Electric Etch Green Pulsar': 'Insert',
  'USWNT Class of 19 Electric Etch Orange': 'Insert',
  'USWNT Class of 19 Electric Etch Purple': 'Insert',
  'USWNT Class of 19 Electric Etch Purple Flood': 'Insert',
  'USWNT Class of 19 Electric Etch Purple Pulsar': 'Insert',
  'USWNT Class of 19 Electric Etch Red Flood': 'Insert',
  'USWNT Class of 19 Electric Etch Red Pulsar': 'Insert',
  'USWNT Class of 19 Electric Etch Red White and Blue Flood': 'Insert',
  'USWNT Class of 99': 'Insert',
  'USWNT Class of 99 Electric Etch Blue Finite': 'Insert',
  'USWNT Class of 99 Electric Etch Blue Flood': 'Insert',
  'USWNT Class of 99 Electric Etch Blue Pulsar': 'Insert',
  'USWNT Class of 99 Electric Etch Gold Flood': 'Insert',
  'USWNT Class of 99 Electric Etch Green': 'Insert',
  'USWNT Class of 99 Electric Etch Green Flood': 'Insert',
  'USWNT Class of 99 Electric Etch Green Pulsar': 'Insert',
  'USWNT Class of 99 Electric Etch Orange': 'Insert',
  'USWNT Class of 99 Electric Etch Purple': 'Insert',
  'USWNT Class of 99 Electric Etch Purple Flood': 'Insert',
  'USWNT Class of 99 Electric Etch Purple Pulsar': 'Insert',
  'USWNT Class of 99 Electric Etch Red Flood': 'Insert',
  'USWNT Class of 99 Electric Etch Red Pulsar': 'Insert',
  'USWNT Class of 99 Electric Etch Red White and Blue Flood': 'Insert',
  'Volcanic Material Signatures': 'Autograph',
  'Volcanic Material Signatures Electric Etch Blue Finite': 'Autograph',
  'Volcanic Material Signatures Electric Etch Blue Flood': 'Autograph',
  'Volcanic Material Signatures Electric Etch Blue Pulsar': 'Autograph',
  'Volcanic Material Signatures Electric Etch Gold Flood': 'Autograph',
  'Volcanic Material Signatures Electric Etch Green': 'Autograph',
  'Volcanic Material Signatures Electric Etch Green Flood': 'Autograph',
  'Volcanic Material Signatures Electric Etch Green Pulsar': 'Autograph',
  'Volcanic Material Signatures Electric Etch Orange': 'Autograph',
  'Volcanic Material Signatures Electric Etch Purple': 'Autograph',
  'Volcanic Material Signatures Electric Etch Purple Flood': 'Autograph',
  'Volcanic Material Signatures Electric Etch Purple Pulsar': 'Autograph',
  'Volcanic Material Signatures Electric Etch Red Flood': 'Autograph',
  'Volcanic Material Signatures Electric Etch Red Pulsar': 'Autograph',
  'Volcanic Material Signatures Electric Etch Taiga': 'Autograph',
};

const MISSING_SETS = Object.keys(SET_TYPE_MAP);

function extractPrintRun(setName: string): number | null {
  // Match patterns like "Red Flood 10" or "Purple 50"
  const match = setName.match(/(\d+)\s*$/);
  return match ? parseInt(match[1]) : null;
}

function getParentSetName(setName: string): string | null {
  // Extract base set name from parallel names

  // USWNT Class of patterns
  if (setName.includes('USWNT Class of 19')) {
    return 'USWNT Class of 19';
  }
  if (setName.includes('USWNT Class of 99')) {
    return 'USWNT Class of 99';
  }

  // Volcanic Material Signatures patterns
  if (setName.includes('Volcanic Material Signatures')) {
    return 'Volcanic Material Signatures';
  }

  // Trifecta Material patterns
  if (setName.includes('Trifecta Material')) {
    return 'Trifecta Material';
  }

  return null;
}

function isParallelSet(setName: string): boolean {
  return setName.toLowerCase().includes('electric etch');
}

async function main() {
  console.log('🔍 Importing missing Obsidian Soccer cards...\n');

  // 1. Read Excel file
  const filePath = '/Users/mh/Desktop/2024-25-Panini-Obsidian-Soccer-Cards-Checklist.xls';
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = xlsx.utils.sheet_to_json(sheet);

  const totalExcelCards = data.length - 1; // Subtract header row
  console.log(`📊 Total cards in Excel: ${totalExcelCards}\n`);

  // 2. Get release
  const release = await prisma.release.findUnique({
    where: { slug: '2024-25-panini-obsidian-soccer' }
  });

  if (!release) {
    throw new Error('Release not found');
  }

  // 3. Group cards by set
  const cardsBySet = new Map<string, any[]>();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const setName = row['__EMPTY'];

    if (setName && MISSING_SETS.includes(setName)) {
      if (!cardsBySet.has(setName)) {
        cardsBySet.set(setName, []);
      }
      cardsBySet.get(setName)!.push(row);
    }
  }

  console.log(`📦 Found ${cardsBySet.size} missing sets to import\n`);

  // 4. Create sets and cards
  const createdSets: string[] = [];
  const parentSets = new Map<string, any>();
  let totalCardsCreated = 0;

  for (const [setName, cards] of cardsBySet.entries()) {
    console.log(`\n🎯 Processing: ${setName} (${cards.length} cards)`);

    const isParallel = isParallelSet(setName);
    const parentSetName = getParentSetName(setName);

    let parentSet = null;

    // Create or get parent set if this is a parallel
    if (isParallel && parentSetName) {
      // Check if parent exists in DB
      parentSet = await prisma.set.findFirst({
        where: {
          name: parentSetName,
          releaseId: release.id
        }
      });

      // If not in DB, check if we created it in this run
      if (!parentSet && parentSets.has(parentSetName)) {
        parentSet = parentSets.get(parentSetName);
      }

      // If still not found, create it
      if (!parentSet) {
        console.log(`  📌 Creating parent set: ${parentSetName}`);
        const parentSetType = SET_TYPE_MAP[parentSetName] || 'Insert';

        const parentSlug = `${release.year}-${release.slug.replace(`${release.year}-`, '')}-${parentSetName}`
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        parentSet = await prisma.set.create({
          data: {
            name: parentSetName,
            slug: parentSlug,
            type: parentSetType,
            releaseId: release.id,
            totalCards: null,
            parallels: []
          }
        });

        parentSets.set(parentSetName, parentSet);
        createdSets.push(parentSetName);
        console.log(`  ✅ Created parent set: ${parentSetName} (${parentSetType})`);
      }
    }

    // Determine set type
    const setType = SET_TYPE_MAP[setName] || 'Insert';

    // Check if set already exists
    const existingSet = await prisma.set.findFirst({
      where: {
        name: setName,
        releaseId: release.id
      }
    });

    let set;
    if (existingSet) {
      console.log(`  ℹ️  Set already exists: ${setName}`);
      set = existingSet;
    } else {
      // Create the set
      const printRun = extractPrintRun(setName);

      const setSlug = `${release.year}-${release.slug.replace(`${release.year}-`, '')}-${setName}`
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      set = await prisma.set.create({
        data: {
          name: setName,
          slug: setSlug,
          type: setType,
          releaseId: release.id,
          parentSetId: parentSet?.id || null,
          printRun: printRun,
          totalCards: cards.length.toString(),
          parallels: []
        }
      });

      createdSets.push(setName);
      console.log(`  ✅ Created set: ${setName} (${setType}${printRun ? ` /${printRun}` : ''})`);
    }

    // Create cards
    let createdCount = 0;

    for (const card of cards) {
      const playerName = card['__EMPTY_1'] || 'Unknown';
      const cardNumber = card['__EMPTY_2'] || '';

      // Determine parallel type
      let parallelType = 'Base';
      if (isParallel) {
        // Extract parallel name from set name
        parallelType = setName.replace(parentSetName || '', '').trim();
      }

      const printRun = extractPrintRun(setName);

      const slug = generateCardSlug(
        'Panini',
        'Obsidian Soccer',
        release.year || '2024-25',
        setName,
        cardNumber,
        playerName,
        parallelType !== 'Base' ? parallelType : null,
        printRun || undefined
      );

      // Check if card already exists
      const existing = await prisma.card.findUnique({
        where: { slug }
      });

      if (existing) {
        console.log(`  ⏭️  Skipped duplicate: ${playerName} #${cardNumber}`);
        continue;
      }

      await prisma.card.create({
        data: {
          slug,
          playerName,
          cardNumber,
          parallelType,
          printRun: printRun,
          numbered: printRun ? `/${printRun}` : null,
          setId: set.id
        }
      });

      createdCount++;
      totalCardsCreated++;
    }

    console.log(`  ✅ Created ${createdCount} cards`);
  }

  // 5. Validation - Check total card count
  console.log('\n\n🔍 VALIDATION CHECK\n');
  console.log('━'.repeat(50));

  const dbCardCount = await prisma.card.count({
    where: {
      set: {
        release: {
          slug: '2024-25-panini-obsidian-soccer'
        }
      }
    }
  });

  console.log(`\n📊 Excel file: ${totalExcelCards} cards`);
  console.log(`📊 Database:   ${dbCardCount} cards`);
  console.log(`📊 Difference: ${totalExcelCards - dbCardCount} cards`);
  console.log(`📊 Created in this run: ${totalCardsCreated} cards`);

  if (totalExcelCards === dbCardCount) {
    console.log('\n✅ SUCCESS: All cards have been imported!');
  } else {
    console.log('\n⚠️  WARNING: Card count mismatch!');
    console.log(`   ${totalExcelCards - dbCardCount} cards are still missing.`);
  }

  console.log('\n📦 Created/Updated Sets:');
  createdSets.forEach(name => console.log(`  - ${name}`));
}

main()
  .then(() => {
    console.log('\n✅ Import complete');
    process.exit(0);
  })
  .catch(e => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  });
