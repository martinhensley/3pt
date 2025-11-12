import { PrismaClient, SetType, DocumentType } from '@prisma/client';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';
import { put } from '@vercel/blob';
import { generateSetSlug, generateCardSlug } from '../lib/slugGenerator';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// Helper function to extract print run from parallel name
function extractPrintRun(parallelName: string): number | null {
  const patterns = [
    /\/(\d+)$/,           // Matches "/99", "/25", etc.
    /\s(\d+)$/,           // Matches "Gold 10", "Silver 25", etc.
    /\s-\s(\d+)$/,        // Matches "Red - 99", etc.
  ];

  for (const pattern of patterns) {
    const match = parallelName.match(pattern);
    if (match) {
      const printRun = parseInt(match[1], 10);
      if (!isNaN(printRun)) {
        return printRun;
      }
    }
  }

  // Handle 1/1 cards
  if (parallelName.match(/\b1\/1\b/i) || parallelName.match(/\b1\s+of\s+1\b/i) || parallelName.toLowerCase().includes('black')) {
    return 1;
  }

  return null;
}

// Helper function to determine set type
function determineSetType(setName: string): SetType {
  const lower = setName.toLowerCase();

  // Check for autograph sets
  if (lower.includes('autograph') || lower.includes('signature')) {
    return 'Autograph';
  }

  // Check for memorabilia sets
  if (lower.includes('kit') && (lower.includes('kings') || lower.includes('series'))) {
    return 'Memorabilia';
  }

  // Check for base sets (including Optic)
  if (lower.includes('base') || lower.includes('optic') || lower.includes('rated rookie')) {
    return 'Base';
  }

  // Everything else is an insert
  return 'Insert';
}

async function importDonrussSoccer() {
  console.log('🏈 Starting 2024-25 Donruss Soccer Import...\n');

  const sellSheetPath = '/Users/mh/Desktop/2024-25-Donruss-Soccer-Cards-Sell-Sheet.pdf';
  const checklistPath = '/Users/mh/Desktop/2024-25-Donruss-Soccer-Checklist.xlsx';

  // Step 1: Find or create Panini manufacturer
  console.log('📦 Finding manufacturer...');
  let panini = await prisma.manufacturer.findFirst({
    where: { name: 'Panini' }
  });

  if (!panini) {
    panini = await prisma.manufacturer.create({
      data: {
        name: 'Panini',
        slug: 'panini'
      }
    });
    console.log('  ✓ Created Panini manufacturer');
  } else {
    console.log(`  ✓ Found Panini manufacturer (ID: ${panini.id})`);
  }

  // Step 2: Upload sell sheet to blob storage
  console.log('\n📄 Uploading sell sheet...');
  const sellSheetBuffer = fs.readFileSync(sellSheetPath);
  const sellSheetFilename = '2024-25-donruss-soccer-sell-sheet.pdf';
  const sellSheetBlob = await put(`sell-sheets/2024-25/nov/${Date.now()}-${sellSheetFilename}`, sellSheetBuffer, {
    access: 'public',
    addRandomSuffix: false,
  });
  console.log(`  ✓ Uploaded: ${sellSheetBlob.url}`);

  // Step 3: Extract text from sell sheet (simplified - using key info from sell sheet)
  console.log('\n📖 Using sell sheet information...');
  const sellSheetText = `2024-25 Donruss Soccer features a 175-card base set and 25-card Rated Rookies subset (#176-200). The release includes Base Optic renditions with hobby-exclusive parallels. Key inserts include Kaboom!, Animation, Net Marvels, Magicians, and Night Moves. Each hobby box contains 1 autograph and 1 memorabilia card on average, featuring current stars like Kylian Mbappé and legends like David Beckham.`;
  console.log(`  ✓ Using sell sheet information`);

  // Step 4: Create SourceDocument for sell sheet
  console.log('\n💾 Creating source document record...');
  const sellSheetDoc = await prisma.sourceDocument.create({
    data: {
      filename: sellSheetFilename,
      displayName: '2024-25 Donruss Soccer Sell Sheet',
      blobUrl: sellSheetBlob.url,
      mimeType: 'application/pdf',
      fileSize: sellSheetBuffer.length,
      documentType: DocumentType.SELL_SHEET,
      tags: ['2024-25', 'Panini', 'Donruss', 'Soccer', 'sell-sheet'],
      uploadedById: 'import-script',
      usageCount: 1,
      lastUsedAt: new Date(),
    }
  });
  console.log(`  ✓ Created source document (ID: ${sellSheetDoc.id})`);

  // Step 5: Upload checklist to blob storage
  console.log('\n📊 Uploading checklist...');
  const checklistBuffer = fs.readFileSync(checklistPath);
  const checklistFilename = '2024-25-donruss-soccer-checklist.xlsx';
  const checklistBlob = await put(`checklists/2024-25/nov/${Date.now()}-${checklistFilename}`, checklistBuffer, {
    access: 'public',
    addRandomSuffix: false,
  });
  console.log(`  ✓ Uploaded: ${checklistBlob.url}`);

  // Step 6: Create SourceDocument for checklist
  const checklistDoc = await prisma.sourceDocument.create({
    data: {
      filename: checklistFilename,
      displayName: '2024-25 Donruss Soccer Checklist',
      blobUrl: checklistBlob.url,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: checklistBuffer.length,
      documentType: DocumentType.CHECKLIST,
      tags: ['2024-25', 'Panini', 'Donruss', 'Soccer', 'checklist'],
      uploadedById: 'import-script',
      usageCount: 1,
      lastUsedAt: new Date(),
    }
  });
  console.log(`  ✓ Created checklist document (ID: ${checklistDoc.id})`);

  // Step 7: Use pre-written description (AI generation temporarily skipped)
  console.log('\n📝 Using pre-written description...');
  const description = `The iconic Donruss brand returns for 2024-25 with a comprehensive 200-card checklist featuring global football talent across 20+ national teams. Base Set Optic variations provide hobby-exclusive parallels including Teal Mojo and Gold, whilst the stunning Kaboom! insert and super-rare Night Moves make welcome returns. Each hobby box delivers one autograph and one memorabilia card on average, with signers ranging from contemporary stars like Kylian Mbappé to legends such as David Beckham and Zinedine Zidane.`;
  console.log(`  ✓ Using description`);

  // Step 8: Create Release
  console.log('\n🎯 Creating release...');
  const releaseSlug = '2024-25-panini-donruss-soccer';

  // Check if release already exists
  let release = await prisma.release.findUnique({
    where: { slug: releaseSlug }
  });

  if (release) {
    console.log(`  ⚠️  Release already exists (ID: ${release.id}), updating...`);
    release = await prisma.release.update({
      where: { id: release.id },
      data: {
        description,
        sellSheetText,
      }
    });
  } else {
    release = await prisma.release.create({
      data: {
        name: 'Donruss Soccer',
        year: '2024-25',
        slug: releaseSlug,
        description,
        sellSheetText,
        manufacturerId: panini.id,
        releaseDate: new Date('2024-11-01'),
      }
    });
    console.log(`  ✓ Created release (ID: ${release.id})`);
  }

  // Step 9: Link source documents to release
  console.log('\n🔗 Linking source documents...');

  const sellSheetLink = await prisma.releaseSourceDocument.upsert({
    where: {
      releaseId_documentId: {
        releaseId: release.id,
        documentId: sellSheetDoc.id,
      }
    },
    create: {
      releaseId: release.id,
      documentId: sellSheetDoc.id,
      usageContext: 'Primary sell sheet for release',
      linkedById: 'import-script',
    },
    update: {}
  });

  const checklistLink = await prisma.releaseSourceDocument.upsert({
    where: {
      releaseId_documentId: {
        releaseId: release.id,
        documentId: checklistDoc.id,
      }
    },
    create: {
      releaseId: release.id,
      documentId: checklistDoc.id,
      usageContext: 'Complete checklist for import',
      linkedById: 'import-script',
    },
    update: {}
  });

  console.log(`  ✓ Linked ${2} source documents`);

  // Step 10: Read checklist Excel file
  console.log('\n📊 Reading checklist...');
  const workbook = xlsx.readFile(checklistPath);
  const masterSheet = workbook.Sheets['Master'];
  const allCards = xlsx.utils.sheet_to_json(masterSheet) as Array<{
    'Card Set': string;
    'Card Number': number;
    'Athlete': string;
    'Team': string;
  }>;
  console.log(`  ✓ Loaded ${allCards.length} total card entries`);

  // Step 11: Group cards by parent set (excluding parallels)
  console.log('\n🗂️  Analyzing set structure...');

  const setGroups = new Map<string, typeof allCards>();

  allCards.forEach(card => {
    const setName = card['Card Set'];

    // Determine if this is a parent set or parallel
    // Parent sets: "Base", "Base Optic", "Rated Rookies", "Animation", "Kit Kings", etc.
    // Parallels: "Base Red", "Base Optic Gold", "Rated Rookies Blue", "Animation Silver", etc.

    const isParallel = /\s(Red|Blue|Gold|Silver|Green|Purple|Black|Teal|Pink|Cubic|Diamond|Holo|Velocity|Ice|Mojo|Power|Scale|Pandora|Argyle|Plum|Blossom)\s*\d*$/i.test(setName);

    if (!isParallel) {
      if (!setGroups.has(setName)) {
        setGroups.set(setName, []);
      }
      setGroups.get(setName)!.push(card);
    }
  });

  console.log(`  ✓ Found ${setGroups.size} unique parent sets`);

  // Step 12: Import sets and cards
  console.log('\n🎴 Importing sets and cards...\n');

  let totalSetsCreated = 0;
  let totalCardsCreated = 0;
  const parentSetMap = new Map<string, string>(); // setName -> setId

  // Process each parent set
  for (const [setName, cards] of setGroups.entries()) {
    console.log(`📦 Processing: ${setName} (${cards.length} cards)`);

    const setType = determineSetType(setName);
    const setSlug = generateSetSlug('2024-25', 'Panini Donruss Soccer', setName, setType);

    // Check if set already exists
    let parentSet = await prisma.set.findUnique({
      where: { slug: setSlug }
    });

    if (parentSet) {
      console.log(`  ⚠️  Set already exists, using existing (ID: ${parentSet.id})`);
    } else {
      parentSet = await prisma.set.create({
        data: {
          name: setName,
          slug: setSlug,
          type: setType,
          releaseId: release.id,
          parentSetId: null, // This is a parent set
          totalCards: cards.length.toString(),
        }
      });
      console.log(`  ✓ Created set (ID: ${parentSet.id}, Type: ${setType})`);
      totalSetsCreated++;
    }

    parentSetMap.set(setName, parentSet.id);

    // Import cards for this set
    let cardsCreated = 0;
    for (const cardData of cards) {
      const cardSlug = generateCardSlug(
        'Panini',
        'Donruss Soccer',
        '2024-25',
        setName,
        cardData['Card Number'].toString(),
        cardData['Athlete'],
        null, // No variant for parent set cards
        null  // No print run for parent set cards
      );

      // Check if card already exists
      const existingCard = await prisma.card.findUnique({
        where: { slug: cardSlug }
      });

      if (existingCard) {
        continue; // Skip duplicate
      }

      await prisma.card.create({
        data: {
          slug: cardSlug,
          playerName: cardData['Athlete'],
          team: cardData['Team'],
          cardNumber: cardData['Card Number'].toString(),
          setId: parentSet.id,
        }
      });
      cardsCreated++;
      totalCardsCreated++;
    }

    console.log(`  ✓ Created ${cardsCreated} cards\n`);
  }

  // Step 13: Import parallel sets
  console.log('\n🌈 Importing parallel sets...\n');

  const parallelGroups = new Map<string, { parentSet: string; parallelName: string; cards: typeof allCards }>();

  allCards.forEach(card => {
    const setName = card['Card Set'];

    // Check if this is a parallel
    const parallelMatch = setName.match(/^(.+?)\s+(Red|Blue|Gold|Silver|Green|Purple|Black|Teal|Pink|Cubic|Diamond|Holo|Velocity|Ice|Mojo|Power|Scale|Pandora|Argyle|Plum|Blossom)(\s+.+)?$/i);

    if (parallelMatch) {
      const parentSetName = parallelMatch[1].trim();
      const parallelName = parallelMatch[2] + (parallelMatch[3] || '');
      const fullParallelName = `${parentSetName} ${parallelName}`.trim();

      if (!parallelGroups.has(fullParallelName)) {
        parallelGroups.set(fullParallelName, {
          parentSet: parentSetName,
          parallelName: parallelName.trim(),
          cards: []
        });
      }
      parallelGroups.get(fullParallelName)!.cards.push(card);
    }
  });

  console.log(`  ✓ Found ${parallelGroups.size} parallel variations\n`);

  for (const [fullName, data] of parallelGroups.entries()) {
    const { parentSet: parentSetName, parallelName, cards } = data;

    const parentSetId = parentSetMap.get(parentSetName);
    if (!parentSetId) {
      console.log(`  ⚠️  Skipping parallel "${fullName}" - parent set "${parentSetName}" not found`);
      continue;
    }

    console.log(`🎨 Processing parallel: ${fullName} (${cards.length} cards)`);

    const parentSetData = await prisma.set.findUnique({
      where: { id: parentSetId }
    });

    if (!parentSetData) continue;

    const printRun = extractPrintRun(parallelName);
    const parallelSlug = generateSetSlug('2024-25', 'Panini Donruss Soccer', parentSetName, parentSetData.type, parallelName);

    // Check if parallel set already exists
    let parallelSet = await prisma.set.findUnique({
      where: { slug: parallelSlug }
    });

    if (parallelSet) {
      console.log(`  ⚠️  Parallel set already exists (ID: ${parallelSet.id})`);
    } else {
      parallelSet = await prisma.set.create({
        data: {
          name: parallelName,
          slug: parallelSlug,
          type: parentSetData.type,
          releaseId: release.id,
          parentSetId: parentSetId,
          printRun: printRun,
          totalCards: cards.length.toString(),
        }
      });
      console.log(`  ✓ Created parallel set (ID: ${parallelSet.id}, Print Run: ${printRun || 'N/A'})`);
      totalSetsCreated++;
    }

    // Note: Cards for parallels mirror the parent set, so we don't create separate card records
    console.log(`  ℹ️  Parallel mirrors parent set cards\n`);
  }

  // Summary
  console.log('\n✅ Import Complete!\n');
  console.log('📊 Summary:');
  console.log(`   Release: ${release.year} ${release.name}`);
  console.log(`   Sets created: ${totalSetsCreated}`);
  console.log(`   Cards created: ${totalCardsCreated}`);
  console.log(`   Source documents: 2 (sell sheet + checklist)`);
  console.log(`\n🔗 View release: http://localhost:3000/releases/${releaseSlug}`);
}

// Run the import
importDonrussSoccer()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
