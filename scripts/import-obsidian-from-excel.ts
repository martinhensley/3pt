/**
 * Import Obsidian release from Excel checklist
 *
 * This script uses Claude (via Genkit) to intelligently analyze the Excel checklist
 * and create all sets, parallels, and cards automatically.
 */

import { prisma } from '../lib/prisma';
import { generateSetSlug, generateCardSlug } from '../lib/slugGenerator';
import * as xlsx from 'xlsx';
import { ai } from '../lib/genkit';
import { claude4Sonnet } from 'genkitx-anthropic';
import { z } from 'zod';

const EXCEL_FILE_PATH = '/Users/mh/Desktop/2024-25-Panini-Obsidian-Soccer-Cards-Checklist.xls';
const RELEASE_SLUG = '2024-25-panini-obsidian-soccer';

// Schema for Claude's analysis
const SetAnalysisSchema = z.object({
  baseSets: z.array(z.object({
    name: z.string(),
    type: z.enum(['Base', 'Insert', 'Autograph', 'Memorabilia']),
    description: z.string(),
  })),
});

interface Card {
  cardNumber: string;
  setName: string;
  playerName: string;
  team: string;
  position: string;
  printRun: number;
}

async function main() {
  console.log('🚀 Starting Obsidian import...\n');

  // Step 1: Read Excel file
  console.log('📖 Reading Excel file...');
  const workbook = xlsx.readFile(EXCEL_FILE_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<any>(sheet, { header: 1 });

  console.log(`Found ${rows.length} rows\n`);

  // Step 2: Parse cards from CSV structure
  console.log('🔍 Parsing cards...');
  const cards: Card[] = [];

  // Find header row (row with "CARD #")
  const headerRow = rows.findIndex((row: any[]) =>
    row && row[0] === 'CARD #'
  );

  if (headerRow === -1) {
    throw new Error('Header row not found');
  }

  // Parse data rows (skip header + 1)
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

  console.log(`Parsed ${cards.length} cards\n`);

  // Step 3: Group by set name
  const cardsBySet = new Map<string, Card[]>();
  for (const card of cards) {
    if (!cardsBySet.has(card.setName)) {
      cardsBySet.set(card.setName, []);
    }
    cardsBySet.get(card.setName)!.push(card);
  }

  console.log(`Found ${cardsBySet.size} unique set names\n`);

  // Step 4: Analyze sets with Claude
  console.log('🤖 Analyzing sets with Claude...');
  const setNames = Array.from(cardsBySet.keys());
  const analysisPrompt = `Analyze these card set names from a 2024-25 Panini Obsidian Soccer release and categorize them.

Set names:
${setNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

For each BASE set (not parallels), determine:
1. The base set name (without "Electric Etch" or other parallel indicators)
2. The set type: Base, Insert, Autograph, or Memorabilia
3. A brief description

Rules:
- Sets with "Electric Etch" + color are PARALLELS of a base set
- "Atomic Material" is a Memorabilia set (has jersey/patch pieces)
- "Dual Jersey Ink" is an Autograph set
- "Equinox" is likely an Insert set
- Base sets typically don't have special features in the name
- Group all parallels under their base set

Return ONLY the base sets (not the parallels).`;

  const analysis = await ai.generate({
    model: claude4Sonnet,
    prompt: analysisPrompt,
    output: {
      schema: SetAnalysisSchema,
    },
  });

  const { baseSets } = analysis.output as z.infer<typeof SetAnalysisSchema>;

  console.log(`Claude identified ${baseSets.length} base sets:\n`);
  baseSets.forEach((set, i) => {
    console.log(`${i + 1}. ${set.name} (${set.type})`);
    console.log(`   ${set.description}\n`);
  });

  // Step 5: Get release
  const release = await prisma.release.findUnique({
    where: { slug: RELEASE_SLUG },
    include: { manufacturer: true },
  });

  if (!release) {
    throw new Error(`Release not found: ${RELEASE_SLUG}`);
  }

  console.log(`\n✅ Found release: ${release.name}\n`);

  // Step 6: Create sets and cards
  console.log('📝 Creating sets and cards...\n');

  for (const baseSetInfo of baseSets) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${baseSetInfo.name}`);
    console.log(`${'='.repeat(60)}\n`);

    // Find all variations of this set (base + parallels)
    const setVariations = setNames.filter(name => {
      // Match exact base name OR starts with base name + "Electric Etch"
      return name === baseSetInfo.name ||
             name.startsWith(baseSetInfo.name + ' Electric Etch');
    });

    console.log(`Found ${setVariations.length} variations (1 base + ${setVariations.length - 1} parallels)`);

    // Create parent set
    const baseCards = cardsBySet.get(baseSetInfo.name) || [];
    const baseSetPrintRun = baseCards.length > 0 ? baseCards[0].printRun : null;

    const cleanReleaseName = release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');
    const parentSetSlug = generateSetSlug(
      release.year || '',
      cleanReleaseName,
      baseSetInfo.name,
      baseSetInfo.type
    );

    console.log(`\n1. Creating parent set: ${baseSetInfo.name}`);
    console.log(`   Slug: ${parentSetSlug}`);
    console.log(`   Cards: ${baseCards.length}`);
    console.log(`   Print run: /${baseSetPrintRun || '?'}`);

    // Check if parent set already exists
    let parentSet = await prisma.set.findUnique({
      where: { slug: parentSetSlug },
    });

    if (parentSet) {
      console.log(`   ⚠️  Parent set already exists, using existing set`);
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
      console.log(`   ✅ Created parent set`);
    }

    // Create base cards
    console.log(`   Creating ${baseCards.length} base cards...`);
    let baseCardsCreated = 0;
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

      // Check if card already exists
      const existingCard = await prisma.card.findUnique({
        where: { slug },
      });

      if (existingCard) {
        // Skip duplicate
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

    console.log(`   ✅ Created ${baseCardsCreated} base cards (${baseCards.length - baseCardsCreated} duplicates skipped)`);

    // Create parallel sets
    const parallelVariations = setVariations.filter(name => name !== baseSetInfo.name);

    for (const parallelName of parallelVariations) {
      const parallelCards = cardsBySet.get(parallelName) || [];

      // Extract parallel type from name (e.g., "Electric Etch Gold Flood")
      const parallelType = parallelName.replace(baseSetInfo.name, '').trim();

      // Determine if this is a variable checklist (different players than base)
      const basePlayerSet = new Set(baseCards.map(c => c.cardNumber));
      const parallelPlayerSet = new Set(parallelCards.map(c => c.cardNumber));
      const hasVariableChecklist = !([...parallelPlayerSet].every(num => basePlayerSet.has(num)));

      // Get typical print run for slug
      const typicalPrintRun = parallelCards.length > 0 ? parallelCards[0].printRun : null;

      const parallelSlug = generateSetSlug(
        release.year || '',
        cleanReleaseName,
        baseSetInfo.name,
        baseSetInfo.type,
        `${parallelType} /${typicalPrintRun}`
      );

      console.log(`\n2. Creating parallel: ${parallelType}`);
      console.log(`   Slug: ${parallelSlug}`);
      console.log(`   Cards: ${parallelCards.length}`);
      console.log(`   Variable checklist: ${hasVariableChecklist ? 'YES' : 'NO'}`);

      // Check if parallel set already exists
      let parallelSet = await prisma.set.findUnique({
        where: { slug: parallelSlug },
      });

      if (parallelSet) {
        console.log(`   ⚠️  Parallel set already exists, using existing set`);
      } else {
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
        console.log(`   ✅ Created parallel set`);
      }

      // Create parallel cards
      console.log(`   Creating ${parallelCards.length} parallel cards...`);
      let parallelCardsCreated = 0;
      for (const card of parallelCards) {
        const slug = generateCardSlug(
          release.manufacturer.name,
          release.name,
          release.year || '',
          baseSetInfo.name,
          card.cardNumber,
          card.playerName,
          `${parallelType} /${card.printRun}`,
          card.printRun
        );

        // Check if card already exists
        const existingCard = await prisma.card.findUnique({
          where: { slug },
        });

        if (existingCard) {
          // Skip duplicate
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

      console.log(`   ✅ Created ${parallelCardsCreated} parallel cards (${parallelCards.length - parallelCardsCreated} duplicates skipped)`);
    }

    console.log(`\n✅ Completed: ${baseSetInfo.name}`);
  }

  console.log(`\n\n🎉 Import complete!`);
  console.log(`Created ${baseSets.length} parent sets with all their parallels and cards.`);
}

main()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
