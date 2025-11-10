/**
 * Import a release checklist from Excel file to database
 *
 * Usage: npx tsx scripts/import-checklist.ts <path-to-excel-file> [release-slug]
 *
 * Example:
 *   npx tsx scripts/import-checklist.ts ~/Desktop/checklist.xls
 *   npx tsx scripts/import-checklist.ts ~/Desktop/checklist.xls 2024-25-panini-obsidian-soccer
 */

import { prisma } from '../lib/prisma';
import { generateSetSlug, generateCardSlug } from '../lib/slugGenerator';
import * as xlsx from 'xlsx';
import { analyzeExcelChecklistFlow } from '../lib/genkit';

interface Card {
  cardNumber: string;
  setName: string;
  playerName: string;
  team: string;
  position: string;
  printRun: number;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: Please provide path to Excel file');
    console.error('Usage: npx tsx scripts/import-checklist.ts <path-to-excel-file> [release-slug]');
    process.exit(1);
  }

  const excelPath = args[0];
  const releaseSlug = args[1];

  console.log('🚀 Starting checklist import...\n');
  console.log(`📁 File: ${excelPath}`);
  if (releaseSlug) {
    console.log(`🎯 Target release: ${releaseSlug}\n`);
  } else {
    console.log(`🎯 Will auto-detect release\n`);
  }

  // Step 1: Read Excel file
  console.log('📖 Reading Excel file...');
  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<any>(sheet, { header: 1 });
  console.log(`   Found ${rows.length} rows\n`);

  // Step 2: Parse cards
  console.log('🔍 Parsing cards...');
  const cards: Card[] = [];

  // Find header row
  const headerRow = rows.findIndex((row: any[]) => {
    if (!row || row.length === 0) return false;
    const firstCol = String(row[0] || '').toUpperCase().trim();
    return firstCol.includes('CARD');
  });

  if (headerRow === -1) {
    console.error('❌ Error: Could not find header row');
    console.error('   First 5 rows:', rows.slice(0, 5).map((r: any) => r?.[0]));
    process.exit(1);
  }

  // Parse data rows
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] as any[];
    if (!row || row.length === 0 || !row[0]) continue;

    const [cardNum, setName, playerName, team, position, sequence] = row;
    if (cardNum && setName && playerName) {
      cards.push({
        cardNumber: String(cardNum),
        setName: String(setName).trim(),
        playerName: String(playerName).trim(),
        team: String(team || '').trim(),
        position: String(position || '').trim(),
        printRun: Number(sequence) || 0,
      });
    }
  }

  console.log(`   Parsed ${cards.length} cards\n`);

  // Step 3: Group by set name
  const cardsBySet = new Map<string, Card[]>();
  for (const card of cards) {
    if (!cardsBySet.has(card.setName)) {
      cardsBySet.set(card.setName, []);
    }
    cardsBySet.get(card.setName)!.push(card);
  }

  const setNames = Array.from(cardsBySet.keys());
  console.log(`   Found ${setNames.size} unique set names\n`);

  // Step 4: Analyze with Claude
  console.log('🤖 Analyzing sets with Claude...');
  const sampleCards = cards.slice(0, 20).map(card => ({
    cardNumber: card.cardNumber,
    setName: card.setName,
    playerName: card.playerName,
    team: card.team,
    position: card.position,
    printRun: card.printRun,
  }));

  const analysis = await analyzeExcelChecklistFlow({
    setNames,
    sampleCards,
  });

  console.log(`   Claude identified ${analysis.baseSets.length} base sets\n`);

  // Step 5: Get or create release
  let release;

  if (releaseSlug) {
    release = await prisma.release.findUnique({
      where: { slug: releaseSlug },
      include: { manufacturer: true },
    });

    if (!release) {
      console.error(`❌ Error: Release not found: ${releaseSlug}`);
      process.exit(1);
    }
  } else {
    // Auto-detect release
    const { year, manufacturer: mfgName, releaseName } = analysis.release;

    let manufacturer = await prisma.manufacturer.findFirst({
      where: { name: { equals: mfgName, mode: 'insensitive' } },
    });

    if (!manufacturer) {
      manufacturer = await prisma.manufacturer.create({
        data: { name: mfgName },
      });
      console.log(`   ✅ Created manufacturer: ${mfgName}`);
    }

    const autoReleaseSlug = `${year}-${mfgName}-${releaseName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    release = await prisma.release.findUnique({
      where: { slug: autoReleaseSlug },
      include: { manufacturer: true },
    });

    if (!release) {
      release = await prisma.release.create({
        data: {
          name: releaseName,
          slug: autoReleaseSlug,
          year,
          manufacturerId: manufacturer.id,
        },
        include: { manufacturer: true },
      });
      console.log(`   ✅ Created release: ${releaseName}`);
    }
  }

  console.log(`\n✅ Target release: ${release.name} (${release.slug})\n`);

  // Step 6: Create sets and cards
  console.log('📝 Creating sets and cards...\n');
  const cleanReleaseName = release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

  let totalSetsCreated = 0;
  let totalCardsCreated = 0;
  let totalSkipped = 0;

  for (const baseSetInfo of analysis.baseSets) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Processing: ${baseSetInfo.name}`);
    console.log(`${'─'.repeat(60)}\n`);

    // Find all variations (base + parallels)
    const setVariations = setNames.filter(name => {
      return name === baseSetInfo.name ||
             baseSetInfo.parallels.includes(name);
    });

    console.log(`   Found ${setVariations.length} variations`);

    // Create parent set
    const baseCards = cardsBySet.get(baseSetInfo.name) || [];
    const baseSetPrintRun = baseCards.length > 0 ? baseCards[0].printRun : null;

    const parentSetSlug = generateSetSlug(
      release.year || '',
      cleanReleaseName,
      baseSetInfo.name,
      baseSetInfo.type
    );

    let parentSet = await prisma.set.findUnique({
      where: { slug: parentSetSlug },
    });

    if (parentSet) {
      console.log(`   ⚠️  Parent set exists: ${baseSetInfo.name}`);
    } else {
      parentSet = await prisma.set.create({
        data: {
          name: baseSetInfo.name,
          slug: parentSetSlug,
          type: baseSetInfo.type,
          isBaseSet: baseSetInfo.type === 'Base',
          releaseId: release.id,
          totalCards: String(baseCards.length),
          printRun: baseSetPrintRun,
          description: baseSetInfo.description,
          hasVariableChecklist: false,
          mirrorsParentChecklist: true,
        },
      });
      totalSetsCreated++;
      console.log(`   ✅ Created parent set: ${baseSetInfo.name}`);
    }

    // Create base cards
    let baseCardsCreated = 0;
    let baseCardsSkipped = 0;

    for (const card of baseCards) {
      const slug = generateCardSlug(
        release.manufacturer.name,
        release.name,
        release.year || '',
        baseSetInfo.name,
        card.cardNumber,
        card.playerName,
        null,
        card.printRun
      );

      const existing = await prisma.card.findUnique({ where: { slug } });
      if (existing) {
        baseCardsSkipped++;
        continue;
      }

      await prisma.card.create({
        data: {
          slug,
          playerName: card.playerName,
          team: card.team,
          cardNumber: card.cardNumber,
          printRun: card.printRun,
          isNumbered: card.printRun > 0,
          numbered: card.printRun > 0 ? `/${card.printRun}` : null,
          setId: parentSet.id,
        },
      });
      baseCardsCreated++;
    }

    totalCardsCreated += baseCardsCreated;
    totalSkipped += baseCardsSkipped;
    console.log(`   📦 Base cards: ${baseCardsCreated} created, ${baseCardsSkipped} skipped`);

    // Create parallel sets
    const parallelVariations = setVariations.filter(name => name !== baseSetInfo.name);

    for (const parallelName of parallelVariations) {
      const parallelCards = cardsBySet.get(parallelName) || [];
      const parallelType = parallelName.replace(baseSetInfo.name, '').trim();

      const basePlayerSet = new Set(baseCards.map(c => c.cardNumber));
      const parallelPlayerSet = new Set(parallelCards.map(c => c.cardNumber));
      const hasVariableChecklist = !([...parallelPlayerSet].every(num => basePlayerSet.has(num)));

      const typicalPrintRun = parallelCards.length > 0 ? parallelCards[0].printRun : null;

      const parallelSlug = generateSetSlug(
        release.year || '',
        cleanReleaseName,
        baseSetInfo.name,
        baseSetInfo.type,
        `${parallelType} /${typicalPrintRun}`
      );

      let parallelSet = await prisma.set.findUnique({
        where: { slug: parallelSlug },
      });

      if (!parallelSet) {
        parallelSet = await prisma.set.create({
          data: {
            name: parallelName,
            slug: parallelSlug,
            type: baseSetInfo.type,
            isBaseSet: false,
            releaseId: release.id,
            printRun: typicalPrintRun,
            parentSetId: parentSet.id,
            hasVariableChecklist,
            mirrorsParentChecklist: !hasVariableChecklist,
          },
        });
        totalSetsCreated++;
      }

      // Create parallel cards
      let parallelCardsCreated = 0;
      let parallelCardsSkipped = 0;

      for (const card of parallelCards) {
        const slug = generateCardSlug(
          release.manufacturer.name,
          release.name,
          release.year || '',
          baseSetInfo.name,
          card.cardNumber,
          card.playerName,
          parallelType,
          card.printRun
        );

        const existing = await prisma.card.findUnique({ where: { slug } });
        if (existing) {
          parallelCardsSkipped++;
          continue;
        }

        await prisma.card.create({
          data: {
            slug,
            playerName: card.playerName,
            team: card.team,
            cardNumber: card.cardNumber,
            parallelType: `${parallelType} /${card.printRun}`,
            printRun: card.printRun,
            isNumbered: true,
            numbered: `/${card.printRun}`,
            setId: parallelSet.id,
          },
        });
        parallelCardsCreated++;
      }

      totalCardsCreated += parallelCardsCreated;
      totalSkipped += parallelCardsSkipped;

      if (parallelCardsCreated > 0 || parallelCardsSkipped > 0) {
        console.log(`   🎨 ${parallelType}: ${parallelCardsCreated} created, ${parallelCardsSkipped} skipped`);
      }
    }

    console.log(`\n✅ Completed: ${baseSetInfo.name}`);
  }

  console.log(`\n\n${'═'.repeat(60)}`);
  console.log(`🎉 Import Complete!`);
  console.log(`${'═'.repeat(60)}\n`);
  console.log(`📊 Summary:`);
  console.log(`   • Sets created: ${totalSetsCreated}`);
  console.log(`   • Cards created: ${totalCardsCreated}`);
  console.log(`   • Items skipped (already exist): ${totalSkipped}`);
  console.log(`\n👉 View at: http://localhost:3000/releases/${release.slug}\n`);
}

main()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  });
