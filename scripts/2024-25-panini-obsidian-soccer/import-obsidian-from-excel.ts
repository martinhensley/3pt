import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { generateSetSlug, generateCardSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

// Define set types
type SetType = 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';

// Known Electric Etch variants
const ELECTRIC_ETCH_VARIANTS = [
  'Electric Etch Blue',
  'Electric Etch Blue Finite',
  'Electric Etch Contra',
  'Electric Etch Gold Flood',
  'Electric Etch Green',
  'Electric Etch Imperial Jade',
  'Electric Etch Marble Flood',
  'Electric Etch Neon Blue Flood',
  'Electric Etch Neon Green Flood',
  'Electric Etch Orange',
  'Electric Etch Purple',
  'Electric Etch Purple Flood',
  'Electric Etch Red',
  'Electric Etch Red Crystals',
  'Electric Etch Red Flood',
  'Electric Etch Red Pulsar',
  'Electric Etch Red White and Blue Flood',
  'Electric Etch Taiga',
  'Electric Etch Talavera',
  'Electric Etch White Pulsar',
  'Electric Etch Yellow',
];

function determineSetType(setName: string): SetType {
  const lowerName = setName.toLowerCase();

  // Check for autograph sets
  if (lowerName.includes('autograph') || lowerName.includes('ink') || lowerName.includes('signature')) {
    return 'Autograph';
  }

  // Check for memorabilia sets
  if (lowerName.includes('material') || lowerName.includes('jersey') ||
      lowerName.includes('patch') || lowerName.includes('memorabilia') ||
      lowerName.includes('swatches') || lowerName.includes('gear') ||
      lowerName.includes('trifecta')) {
    return 'Memorabilia';
  }

  // Check for base sets
  if (lowerName === 'base' || lowerName.includes('base set')) {
    return 'Base';
  }

  // Everything else is an insert
  return 'Insert';
}

function extractParallelInfo(setName: string): {
  baseSetName: string;
  variantName: string | null;
  isParallel: boolean;
} {
  // Check for Electric Etch parallels (longest matches first)
  const sortedVariants = [...ELECTRIC_ETCH_VARIANTS].sort((a, b) => b.length - a.length);

  for (const variant of sortedVariants) {
    if (setName.endsWith(' ' + variant)) {
      const baseSetName = setName.substring(0, setName.length - variant.length - 1);
      return {
        baseSetName,
        variantName: variant,
        isParallel: true
      };
    }
  }

  // Not a parallel
  return {
    baseSetName: setName,
    variantName: null,
    isParallel: false
  };
}

interface CardData {
  setName: string;
  cardNumber: string;
  playerName: string;
  team: string;
  position: string;
  printRun: number | null;
}

async function importObsidianSoccer() {
  try {
    console.log('Starting 2024-25 Panini Obsidian Soccer import...\n');

    // 1. Verify release exists
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-obsidian-soccer' },
      include: { manufacturer: true }
    });

    if (!release) {
      console.error('Release not found! Please create 2024-25 Panini Obsidian Soccer release first.');
      return;
    }

    console.log(`Found release: ${release.name} (${release.id})`);
    console.log(`Manufacturer: ${release.manufacturer.name}\n`);

    // 2. Read Excel file (.xls format)
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile('/Users/mh/Desktop/2024-25-Panini-Obsidian-Soccer-Cards-Checklist.xls');

    // Find the sheet (it's named "2024 Panini Obsidian (24-25) (S")
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      console.error('Sheet not found in Excel file!');
      return;
    }

    console.log(`Using sheet: ${sheetName}`);

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
    console.log(`Found ${jsonData.length} rows in sheet\n`);

    // 3. Parse cards and group by set
    // Expected columns: CARD_NUM, CARD_SET, ATHLETE, TEAM, POSITION, SEQUENCE
    const setMap = new Map<string, CardData[]>();
    let totalCards = 0;
    let skippedRows = 0;

    // Skip header row (row 0)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Skip if row is empty or missing critical data
      if (!row || !row[0] || !row[1] || !row[2]) {
        skippedRows++;
        continue;
      }

      const cardNumber = row[0] ? String(row[0]).trim() : '';
      const cardSet = String(row[1]).trim();
      const athlete = String(row[2]).trim();
      const team = row[3] ? String(row[3]).trim() : '';
      const position = row[4] ? String(row[4]).trim() : '';
      const sequence = row[5] ? parseInt(String(row[5]).trim()) : null;

      const cardData: CardData = {
        setName: cardSet,
        cardNumber,
        playerName: athlete,
        team,
        position,
        printRun: sequence
      };

      if (!setMap.has(cardSet)) {
        setMap.set(cardSet, []);
      }
      setMap.get(cardSet)!.push(cardData);
      totalCards++;
    }

    console.log(`Parsed ${totalCards} cards across ${setMap.size} unique sets`);
    console.log(`Skipped ${skippedRows} empty/incomplete rows\n`);

    // 4. Process each set
    console.log('Creating sets and cards...\n');
    let setCount = 0;
    let cardCount = 0;

    for (const [fullSetName, cards] of setMap.entries()) {
      console.log(`Processing: ${fullSetName} (${cards.length} cards)`);

      // Extract parallel info
      const { baseSetName, variantName, isParallel } = extractParallelInfo(fullSetName);

      // Determine set type from base set name
      const setType = determineSetType(baseSetName);

      // Calculate print run for the set (use the most common print run, or null if varied)
      const printRuns = cards.map(c => c.printRun).filter(pr => pr !== null);
      const uniquePrintRuns = [...new Set(printRuns)];
      const setPrintRun = uniquePrintRuns.length === 1 ? uniquePrintRuns[0] : null;

      console.log(`  Type: ${setType}`);
      console.log(`  Is Parallel: ${isParallel}`);
      console.log(`  Base Set: ${baseSetName}`);
      console.log(`  Variant: ${variantName || 'N/A'}`);
      console.log(`  Set Print Run: ${setPrintRun || 'Varied'}`);
      console.log(`  Print Run Range: ${printRuns.length > 0 ? Math.min(...printRuns) + '-' + Math.max(...printRuns) : 'N/A'}`);

      // Generate slug using the slug generator
      let slug: string;
      if (isParallel && variantName) {
        // For parallels, use the parallel naming convention
        slug = generateSetSlug('2024-25', 'Obsidian Soccer', baseSetName, setType, variantName, setPrintRun);
      } else {
        // For base sets
        slug = generateSetSlug('2024-25', 'Obsidian Soccer', baseSetName, setType);
      }

      // Calculate base set slug for parallels
      let baseSetSlug: string | null = null;
      if (isParallel) {
        baseSetSlug = generateSetSlug('2024-25', 'Obsidian Soccer', baseSetName, setType);
      }

      console.log(`  Slug: ${slug}`);
      console.log(`  Base Set Slug: ${baseSetSlug || 'N/A'}`);

      // Check if set already exists
      const existingSet = await prisma.set.findUnique({
        where: { slug }
      });

      if (existingSet) {
        console.log(`  ⚠️  Set already exists, skipping...`);
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
        // Generate card slug
        const cardSlug = generateCardSlug(
          release.manufacturer.name,
          release.name,
          release.year || '2024-25',
          baseSetName,
          card.cardNumber,
          card.playerName,
          variantName,
          card.printRun || undefined,
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
              printRun: card.printRun,
              isNumbered: card.printRun !== null,
              numbered: card.printRun ? (card.printRun === 1 ? '1 of 1' : `/${card.printRun}`) : null,
              rarity: card.printRun === 1 ? 'one_of_one' :
                      card.printRun && card.printRun <= 10 ? 'ultra_rare' :
                      card.printRun && card.printRun <= 50 ? 'super_rare' :
                      card.printRun && card.printRun <= 199 ? 'rare' : 'base',
              setId: dbSet.id,
            },
          });
          createdCards++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`    ⚠️  Card slug already exists: ${cardSlug}`);
          } else {
            throw error;
          }
        }
      }

      cardCount += createdCards;
      console.log(`  ✅ Created ${createdCards}/${cards.length} cards\n`);
    }

    // 5. Final summary
    console.log('='.repeat(60));
    console.log('IMPORT COMPLETE!');
    console.log('='.repeat(60));
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

    // Breakdown by type
    const baseCount = await prisma.set.count({
      where: { releaseId: release.id, type: 'Base' }
    });
    const insertCount = await prisma.set.count({
      where: { releaseId: release.id, type: 'Insert' }
    });
    const autoCount = await prisma.set.count({
      where: { releaseId: release.id, type: 'Autograph' }
    });
    const memCount = await prisma.set.count({
      where: { releaseId: release.id, type: 'Memorabilia' }
    });

    console.log(`\nBreakdown by type:`);
    console.log(`  Base: ${baseCount} sets`);
    console.log(`  Insert: ${insertCount} sets`);
    console.log(`  Autograph: ${autoCount} sets`);
    console.log(`  Memorabilia: ${memCount} sets`);

  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importObsidianSoccer();
