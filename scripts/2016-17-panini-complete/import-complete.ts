/**
 * Import script for 2016-17 Panini Complete Basketball
 *
 * This script imports all sets and cards from the official checklist:
 * - Base Set (400 cards) with parallels: Silver, Gold, No Back
 * - Autographs (30 cards)
 * - Complete Players (15 cards)
 * - First Steps (15 cards)
 * - Home and Away (40 cards - 20 players x 2 versions)
 */

import { prisma } from '@/lib/prisma';
import { generateSetSlug, generateCardSlug } from '@/lib/slugGenerator';
import * as fs from 'fs';
import * as path from 'path';

// Parse CSV with proper handling of double-escaped quotes
// This CSV has rows like: "1,""Joel Embiid"",""Philadelphia 76ers"",""TRUE"""
// Which needs special handling
function parseCSV(text: string): string[][] {
  const lines = text.split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this is a quoted row (most data rows)
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      // Remove outer quotes
      const innerContent = trimmed.slice(1, -1);

      // Split by comma, but need to handle doubled quotes
      // Format is: cardNum,""Field1"",""Field2"",""Field3""
      const fields: string[] = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < innerContent.length; i++) {
        const char = innerContent[i];
        const nextChar = innerContent[i + 1];

        if (char === '"' && nextChar === '"') {
          // Escaped quote - this is a quote character within a field
          currentField += '"';
          i++; // Skip next quote
        } else if (char === '"') {
          // Toggle quote mode
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          // End of field
          fields.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }

      // Don't forget the last field
      if (currentField || fields.length > 0) {
        fields.push(currentField.trim());
      }

      // Clean up fields - remove surrounding quotes if present
      const cleanedFields = fields.map(f => {
        const trimmed = f.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      });

      if (cleanedFields.length > 0 && cleanedFields.some(f => f !== '')) {
        rows.push(cleanedFields);
      }
    } else {
      // Non-quoted row (headers, section titles, etc.)
      rows.push([trimmed]);
    }
  }

  return rows;
}

async function main() {
  console.log('Starting 2016-17 Panini Complete Basketball import...\n');

  // 1. Find the release
  const release = await prisma.release.findUnique({
    where: { slug: '2016-17-panini-complete-basketball' },
    include: { manufacturer: true }
  });

  if (!release) {
    throw new Error('Release not found! Please create the release first.');
  }

  console.log(`Found release: ${release.name} (${release.year})`);
  console.log(`Manufacturer: ${release.manufacturer.name}\n`);

  // 2. Read and parse the CSV file
  const csvPath = '/Users/mh/Desktop/2016-17 Panini Complete Basketball Cards/2016-17 Panini Complete Basketball Set Checklist.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // 3. Upload source file to release if not already present
  const sourceFileName = '2016-17 Panini Complete Basketball Set Checklist.csv';
  const existingSourceFiles = (release.sourceFiles as any[]) || [];

  if (!existingSourceFiles.some((f: any) => f.filename === sourceFileName)) {
    console.log('Uploading source CSV to release...');
    const csvBase64 = fs.readFileSync(csvPath).toString('base64');

    await prisma.release.update({
      where: { id: release.id },
      data: {
        sourceFiles: [
          ...existingSourceFiles,
          {
            type: 'text/csv',
            filename: sourceFileName,
            url: `data:text/csv;base64,${csvBase64}`
          }
        ]
      }
    });
    console.log('Source file uploaded.\n');
  }

  // Parse the CSV
  const rows = parseCSV(csvContent);

  // 4. Process Base Set (cards 1-400)
  console.log('Processing Base Set...');
  const baseSetSlug = generateSetSlug(
    '2016-17',
    'complete-basketball',
    'Base',
    'Base'
  );

  const baseSet = await prisma.set.upsert({
    where: { slug: baseSetSlug },
    create: {
      name: 'Base Set',
      slug: baseSetSlug,
      type: 'Base',
      releaseId: release.id,
      isParallel: false,
      baseSetSlug: null,
      printRun: null
    },
    update: {}
  });

  console.log(`Created/found Base Set: ${baseSet.slug}`);

  // Find base set cards in CSV (between header and "Autographs Set Checklist")
  let baseStartIdx = -1;
  let baseEndIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    // First row with 4 fields where first field is a number (actual data starts)
    if (rows[i].length === 4 && !isNaN(parseInt(rows[i][0])) && baseStartIdx === -1) {
      baseStartIdx = i;
    }
    if (rows[i][0] === 'Autographs Set Checklist') {
      baseEndIdx = i;
      break;
    }
  }

  console.log(`Found ${baseEndIdx - baseStartIdx} base cards to import...`);

  // Import base cards
  const baseCards = [];
  for (let i = baseStartIdx; i < baseEndIdx; i++) {
    const row = rows[i];
    if (row.length < 3 || row[0] === '') continue;

    const cardNumber = row[0];
    const playerName = row[1];
    const team = row[2];
    const isRookie = row[3] === 'TRUE';

    const slug = generateCardSlug(
      release.manufacturer.name,
      release.name,
      release.year || '',
      'Base',
      cardNumber,
      playerName,
      null,
      null,
      'Base'
    );

    baseCards.push({
      slug,
      cardNumber,
      playerName,
      team,
      specialFeatures: isRookie ? ['rookie'] : [],
      setId: baseSet.id,
      variant: null,
      printRun: null,
      numbered: null
    });
  }

  // Bulk insert base cards using createMany with skipDuplicates
  // Delete existing cards first, then batch insert
  await prisma.card.deleteMany({ where: { setId: baseSet.id } });

  // Use createMany for batch insertion (much faster than individual upserts)
  await prisma.card.createMany({
    data: baseCards,
    skipDuplicates: true
  });

  console.log(`Imported ${baseCards.length} base cards.\n`);

  // 5. Create parallel sets for Base Set
  const parallels = [
    { name: 'Silver', printRun: null },
    { name: 'Gold', printRun: null },
    { name: 'No Back', printRun: null }
  ];

  for (const parallel of parallels) {
    console.log(`Processing ${parallel.name} parallel...`);

    const parallelSlug = generateSetSlug(
      '2016-17',
      'complete-basketball',
      'Base',
      'Base',
      parallel.name,
      parallel.printRun
    );

    const parallelSet = await prisma.set.upsert({
      where: { slug: parallelSlug },
      create: {
        name: `Base Set - ${parallel.name} Parallel`,
        slug: parallelSlug,
        type: 'Base',
        releaseId: release.id,
        isParallel: true,
        baseSetSlug: baseSet.slug,
        printRun: parallel.printRun
      },
      update: {}
    });

    // Create parallel cards for each base card
    const parallelCards = baseCards.map(baseCard => {
      const slug = generateCardSlug(
        release.manufacturer.name,
        release.name,
        release.year || '',
        'Base',
        baseCard.cardNumber,
        baseCard.playerName,
        parallel.name,
        parallel.printRun,
        'Base'
      );

      return {
        slug,
        cardNumber: baseCard.cardNumber,
        playerName: baseCard.playerName,
        team: baseCard.team,
        specialFeatures: baseCard.specialFeatures,
        setId: parallelSet.id,
        variant: parallel.name,
        printRun: parallel.printRun,
        numbered: parallel.printRun ? `/${parallel.printRun}` : null
      };
    });

    // Delete existing cards and batch insert
    await prisma.card.deleteMany({ where: { setId: parallelSet.id } });
    await prisma.card.createMany({
      data: parallelCards,
      skipDuplicates: true
    });

    console.log(`Imported ${parallelCards.length} ${parallel.name} parallel cards.\n`);
  }

  // 6. Process Autographs Set
  console.log('Processing Autographs Set...');
  const autographsSlug = generateSetSlug(
    '2016-17',
    'complete-basketball',
    'Autographs',
    'Autograph'
  );

  const autographsSet = await prisma.set.upsert({
    where: { slug: autographsSlug },
    create: {
      name: 'Autographs',
      slug: autographsSlug,
      type: 'Autograph',
      releaseId: release.id,
      isParallel: false,
      baseSetSlug: null,
      printRun: null
    },
    update: {}
  });

  // Find autographs cards in CSV
  let autoStartIdx = -1;
  let autoEndIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'Autographs Set Checklist') {
      // Find first data row after the section header (numeric first field)
      for (let j = i + 1; j < rows.length; j++) {
        if (rows[j].length >= 3 && !isNaN(parseInt(rows[j][0]))) {
          autoStartIdx = j;
          break;
        }
      }
    }
    if (rows[i][0] === 'Complete Players Set Checklist') {
      autoEndIdx = i;
      break;
    }
  }

  const autographCards = [];
  for (let i = autoStartIdx; i < autoEndIdx; i++) {
    const row = rows[i];
    if (row.length < 3 || row[0] === '') continue;

    const cardNumber = row[0];
    const playerName = row[1];
    const team = row[2];
    const isRewards = row[3] === 'TRUE';

    const slug = generateCardSlug(
      release.manufacturer.name,
      release.name,
      release.year || '',
      'Autographs',
      cardNumber,
      playerName,
      null,
      null,
      'Autograph'
    );

    autographCards.push({
      slug,
      cardNumber,
      playerName,
      team,
      setId: autographsSet.id,
      variant: isRewards ? 'Panini Rewards' : null,
      printRun: null,
      numbered: null
    });
  }

  // Delete existing and batch insert autograph cards
  await prisma.card.deleteMany({ where: { setId: autographsSet.id } });
  await prisma.card.createMany({
    data: autographCards,
    skipDuplicates: true
  });

  console.log(`Imported ${autographCards.length} autograph cards.\n`);

  // 7. Process Complete Players Set
  console.log('Processing Complete Players Set...');
  const completePlayersSlug = generateSetSlug(
    '2016-17',
    'complete-basketball',
    'Complete Players',
    'Insert'
  );

  const completePlayersSet = await prisma.set.upsert({
    where: { slug: completePlayersSlug },
    create: {
      name: 'Complete Players',
      slug: completePlayersSlug,
      type: 'Insert',
      releaseId: release.id,
      isParallel: false,
      baseSetSlug: null,
      printRun: null
    },
    update: {}
  });

  // Find Complete Players cards
  let cpStartIdx = -1;
  let cpEndIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'Complete Players Set Checklist') {
      for (let j = i + 1; j < rows.length; j++) {
        if (rows[j].length >= 3 && !isNaN(parseInt(rows[j][0]))) {
          cpStartIdx = j;
          break;
        }
      }
    }
    if (rows[i][0] === 'First Steps Set Checklist') {
      cpEndIdx = i;
      break;
    }
  }

  const completePlayersCards = [];
  for (let i = cpStartIdx; i < cpEndIdx; i++) {
    const row = rows[i];
    if (row.length < 3 || row[0] === '') continue;

    const cardNumber = row[0];
    const playerName = row[1];
    const team = row[2];

    const slug = generateCardSlug(
      release.manufacturer.name,
      release.name,
      release.year || '',
      'Complete Players',
      cardNumber,
      playerName,
      null,
      null,
      'Insert'
    );

    completePlayersCards.push({
      slug,
      cardNumber,
      playerName,
      team,
      setId: completePlayersSet.id,
      variant: null,
      printRun: null,
      numbered: null
    });
  }

  // Delete existing and batch insert
  await prisma.card.deleteMany({ where: { setId: completePlayersSet.id } });
  await prisma.card.createMany({
    data: completePlayersCards,
    skipDuplicates: true
  });

  console.log(`Imported ${completePlayersCards.length} Complete Players cards.\n`);

  // 8. Process First Steps Set
  console.log('Processing First Steps Set...');
  const firstStepsSlug = generateSetSlug(
    '2016-17',
    'complete-basketball',
    'First Steps',
    'Insert'
  );

  const firstStepsSet = await prisma.set.upsert({
    where: { slug: firstStepsSlug },
    create: {
      name: 'First Steps',
      slug: firstStepsSlug,
      type: 'Insert',
      releaseId: release.id,
      isParallel: false,
      baseSetSlug: null,
      printRun: null
    },
    update: {}
  });

  // Find First Steps cards
  let fsStartIdx = -1;
  let fsEndIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'First Steps Set Checklist') {
      for (let j = i + 1; j < rows.length; j++) {
        if (rows[j].length >= 3 && !isNaN(parseInt(rows[j][0]))) {
          fsStartIdx = j;
          break;
        }
      }
    }
    if (rows[i][0] === 'Home and Away Set Checklist') {
      fsEndIdx = i;
      break;
    }
  }

  const firstStepsCards = [];
  for (let i = fsStartIdx; i < fsEndIdx; i++) {
    const row = rows[i];
    if (row.length < 3 || row[0] === '') continue;

    const cardNumber = row[0];
    const playerName = row[1];
    const team = row[2];

    const slug = generateCardSlug(
      release.manufacturer.name,
      release.name,
      release.year || '',
      'First Steps',
      cardNumber,
      playerName,
      null,
      null,
      'Insert'
    );

    firstStepsCards.push({
      slug,
      cardNumber,
      playerName,
      team,
      setId: firstStepsSet.id,
      variant: null,
      printRun: null,
      numbered: null
    });
  }

  // Delete existing and batch insert
  await prisma.card.deleteMany({ where: { setId: firstStepsSet.id } });
  await prisma.card.createMany({
    data: firstStepsCards,
    skipDuplicates: true
  });

  console.log(`Imported ${firstStepsCards.length} First Steps cards.\n`);

  // 9. Process Home and Away Set
  console.log('Processing Home and Away Set...');
  const homeAwaySlug = generateSetSlug(
    '2016-17',
    'complete-basketball',
    'Home and Away',
    'Insert'
  );

  const homeAwaySet = await prisma.set.upsert({
    where: { slug: homeAwaySlug },
    create: {
      name: 'Home and Away',
      slug: homeAwaySlug,
      type: 'Insert',
      releaseId: release.id,
      isParallel: false,
      baseSetSlug: null,
      printRun: null
    },
    update: {}
  });

  // Find Home and Away cards
  let haStartIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'Home and Away Set Checklist') {
      for (let j = i + 1; j < rows.length; j++) {
        // Home and Away cards have card numbers like "1-home" and "1-away"
        if (rows[j].length >= 3 && rows[j][0].includes('-')) {
          haStartIdx = j;
          break;
        }
      }
      break;
    }
  }

  const homeAwayCards = [];
  for (let i = haStartIdx; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3 || row[0] === '') continue;

    const cardNumber = row[0]; // e.g., "1-home" or "1-away"
    const playerName = row[1];
    const team = row[2];

    const variant = cardNumber.includes('-home') ? 'Home' : 'Away';

    const slug = generateCardSlug(
      release.manufacturer.name,
      release.name,
      release.year || '',
      'Home and Away',
      cardNumber,
      playerName,
      variant,
      null,
      'Insert'
    );

    homeAwayCards.push({
      slug,
      cardNumber,
      playerName,
      team,
      setId: homeAwaySet.id,
      variant,
      printRun: null,
      numbered: null
    });
  }

  // Delete existing and batch insert
  await prisma.card.deleteMany({ where: { setId: homeAwaySet.id } });
  await prisma.card.createMany({
    data: homeAwayCards,
    skipDuplicates: true
  });

  console.log(`Imported ${homeAwayCards.length} Home and Away cards.\n`);

  // 10. Summary
  console.log('Import complete!\n');
  console.log('Summary:');
  console.log(`- Base Set: ${baseCards.length} cards`);
  console.log(`- Silver Parallel: ${baseCards.length} cards`);
  console.log(`- Gold Parallel: ${baseCards.length} cards`);
  console.log(`- No Back Parallel: ${baseCards.length} cards`);
  console.log(`- Autographs: ${autographCards.length} cards`);
  console.log(`- Complete Players: ${completePlayersCards.length} cards`);
  console.log(`- First Steps: ${firstStepsCards.length} cards`);
  console.log(`- Home and Away: ${homeAwayCards.length} cards`);
  console.log(`\nTotal cards: ${baseCards.length * 4 + autographCards.length + completePlayersCards.length + firstStepsCards.length + homeAwayCards.length}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error during import:', error);
  process.exit(1);
});
