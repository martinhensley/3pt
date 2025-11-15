import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Function to generate proper Optic card slugs
function generateOpticCardSlug(
  cardNumber: string,
  playerName: string,
  variantName: string | null,
  printRun?: number
): string {
  const cleanPlayer = playerName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const cleanVariant = variantName
    ? variantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : null;

  // For Optic cards: 2024-25-donruss-soccer-optic-1-matt-turner-variant-printrun
  const parts = [
    '2024-25-donruss-soccer-optic',
    cardNumber,
    cleanPlayer,
    cleanVariant,
    printRun?.toString()
  ].filter(Boolean);

  return parts.join('-');
}

// Function to generate Base card slugs
function generateBaseCardSlug(
  cardNumber: string,
  playerName: string,
  variantName: string | null,
  printRun?: number
): string {
  const cleanPlayer = playerName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const cleanVariant = variantName
    ? variantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : null;

  // For Base cards: 2024-25-donruss-soccer-base-1-matt-turner-variant-printrun
  // For Base parallels: 2024-25-donruss-soccer-1-matt-turner-variant-printrun
  const parts = variantName
    ? ['2024-25-donruss-soccer', cardNumber, cleanPlayer, cleanVariant, printRun?.toString()].filter(Boolean)
    : ['2024-25-donruss-soccer-base', cardNumber, cleanPlayer, printRun?.toString()].filter(Boolean);

  return parts.join('-');
}

async function fixCompleteDonrussImport() {
  try {
    console.log('Fixing complete Donruss Soccer import with proper 200-card sets...\n');

    // Find the release
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
      include: { manufacturer: true }
    });

    if (!release) {
      console.error('Release not found!');
      return;
    }

    // Read Excel file
    const workbook = XLSX.readFile('/Users/mh/Desktop/2024-25-Donruss-Soccer-Checklist.xlsx');
    const masterSheet = workbook.Sheets['Master'];
    const jsonData = XLSX.utils.sheet_to_json<any>(masterSheet, { header: 1 });

    // Build a map of all cards by set name
    const cardsBySet = new Map<string, any[]>();

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row[0]) continue;

      const cardSet = String(row[0]).trim();
      const card = {
        cardNumber: row[1] ? String(row[1]).trim() : '',
        playerName: row[2] ? String(row[2]).trim() : '',
        team: row[3] ? String(row[3]).trim() : ''
      };

      if (!cardsBySet.has(cardSet)) {
        cardsBySet.set(cardSet, []);
      }
      cardsBySet.get(cardSet)!.push(card);
    }

    console.log(`Loaded ${cardsBySet.size} sets from Excel\n`);

    // Process all Base and Optic sets
    const sets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        OR: [
          { slug: { contains: 'base' } },
          { slug: { contains: 'optic' } }
        ]
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Processing ${sets.length} Base and Optic sets...\n`);

    for (const set of sets) {
      console.log(`Processing: ${set.name}`);

      // Delete existing cards
      const deletedCount = await prisma.card.deleteMany({
        where: { setId: set.id }
      });
      console.log(`  Deleted ${deletedCount.count} existing cards`);

      // Determine if this is an Optic set
      const isOptic = set.slug.includes('optic');

      // Extract variant from set name
      let variantName: string | null = null;
      if (set.name.includes(' Black Pandora')) variantName = 'Black Pandora';
      else if (set.name.includes(' Black')) variantName = 'Black';
      else if (set.name.includes(' Blue Cubic')) variantName = 'Blue Cubic';
      else if (set.name.includes(' Pink Cubic')) variantName = 'Pink Cubic';
      else if (set.name.includes(' Red Cubic')) variantName = 'Red Cubic';
      else if (set.name.includes(' Blue')) variantName = 'Blue';
      else if (set.name.includes(' Gold Power')) variantName = 'Gold Power';
      else if (set.name.includes(' Gold')) variantName = 'Gold';
      else if (set.name.includes(' Green')) variantName = 'Green';
      else if (set.name.includes(' Red')) variantName = 'Red';
      else if (set.name.includes(' Purple Mojo')) variantName = 'Purple Mojo';
      else if (set.name.includes(' Teal Mojo')) variantName = 'Teal Mojo';
      else if (set.name.includes(' Purple')) variantName = 'Purple';
      else if (set.name.includes(' Teal')) variantName = 'Teal';
      else if (set.name.includes(' Pink Diamond')) variantName = 'Pink Diamond';
      else if (set.name.includes(' Pink Ice')) variantName = 'Pink Ice';
      else if (set.name.includes(' Pink Velocity')) variantName = 'Pink Velocity';
      else if (set.name.includes(' Dragon Scale')) variantName = 'Dragon Scale';
      else if (set.name.includes(' Plum Blossom')) variantName = 'Plum Blossom';
      else if (set.name.includes(' Argyle')) variantName = 'Argyle';
      else if (set.name.includes(' Cubic')) variantName = 'Cubic';
      else if (set.name.includes(' Diamond')) variantName = 'Diamond';
      else if (set.name.includes(' Holo')) variantName = 'Holo';
      else if (set.name.includes(' Ice')) variantName = 'Ice';
      else if (set.name.includes(' Orange')) variantName = 'Orange';
      else if (set.name.includes(' Pink')) variantName = 'Pink';
      else if (set.name.includes(' Silver')) variantName = 'Silver';
      else if (set.name.includes(' Velocity')) variantName = 'Velocity';

      // Build Excel set names to look for
      const excelSetNames: string[] = [];

      if (isOptic) {
        // For Optic sets, we need "Base Optic" or "Base Optic [Variant]" and "Rated Rookies Optic" or "Rated Rookies Optic [Variant]"
        if (variantName) {
          excelSetNames.push(`Base Optic ${variantName}`);
          excelSetNames.push(`Rated Rookies Optic ${variantName}`);
        } else {
          excelSetNames.push('Base Optic');
          excelSetNames.push('Rated Rookies Optic');
        }
      } else {
        // For Base sets, we need "Base" or "Base [Variant]" and "Rated Rookies" or "Rated Rookies [Variant]"
        if (variantName) {
          excelSetNames.push(`Base ${variantName}`);
          excelSetNames.push(`Rated Rookies ${variantName}`);
        } else {
          excelSetNames.push('Base');
          excelSetNames.push('Rated Rookies');
        }
      }

      console.log(`  Looking for Excel sets: ${excelSetNames.join(', ')}`);

      // Collect all cards for this set (both base 1-175 and Rated Rookies 176-200)
      const allCards = [];
      for (const excelSetName of excelSetNames) {
        const cards = cardsBySet.get(excelSetName) || [];
        allCards.push(...cards);
      }

      console.log(`  Found ${allCards.length} total cards (should be 200)`);

      // Create all cards
      let createdCount = 0;
      let errors = 0;

      for (const card of allCards) {
        // Generate appropriate slug based on set type
        const cardSlug = isOptic
          ? generateOpticCardSlug(card.cardNumber, card.playerName, variantName, set.printRun || undefined)
          : generateBaseCardSlug(card.cardNumber, card.playerName, variantName, set.printRun || undefined);

        try {
          await prisma.card.create({
            data: {
              slug: cardSlug,
              playerName: card.playerName || null,
              team: card.team || null,
              cardNumber: card.cardNumber || null,
              variant: variantName,
              printRun: set.printRun,
              isNumbered: set.printRun !== null,
              numbered: set.printRun ? (set.printRun === 1 ? '1 of 1' : `/${set.printRun}`) : null,
              rarity: set.printRun === 1 ? 'one_of_one' :
                      set.printRun && set.printRun <= 10 ? 'ultra_rare' :
                      set.printRun && set.printRun <= 50 ? 'super_rare' :
                      set.printRun && set.printRun <= 199 ? 'rare' : 'base',
              // Mark cards 176-200 as Rated Rookies
              specialFeatures: parseInt(card.cardNumber) >= 176 && parseInt(card.cardNumber) <= 200
                ? ['rated_rookie']
                : [],
              setId: set.id,
            },
          });
          createdCount++;
        } catch (error: any) {
          errors++;
          if (error.code !== 'P2002') { // Ignore duplicate key errors
            console.log(`    ⚠️ Error creating card ${cardSlug}: ${error.message}`);
          }
        }
      }

      console.log(`  ✅ Created ${createdCount} cards (${errors} errors)\n`);
    }

    // Final validation
    const totalCards = await prisma.card.count({
      where: { set: { releaseId: release.id } }
    });

    const totalSets = await prisma.set.count({
      where: { releaseId: release.id }
    });

    const setDetails = await prisma.set.findMany({
      where: { releaseId: release.id },
      include: {
        _count: {
          select: { cards: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Check for sets with incorrect card counts
    const incorrectSets = setDetails.filter(s => {
      if (s.slug.includes('base') || s.slug.includes('optic')) {
        return s._count.cards !== 200;
      }
      return false;
    });

    console.log('=' * 60);
    console.log('FINAL RESULTS');
    console.log('=' * 60);
    console.log(`Total sets: ${totalSets}`);
    console.log(`Total cards: ${totalCards}`);
    console.log('Expected: 8,977 cards across 116 sets');

    if (incorrectSets.length > 0) {
      console.log('\n⚠️ Sets with incorrect card counts:');
      incorrectSets.forEach(s => {
        console.log(`  ${s.name}: ${s._count.cards} cards (expected 200)`);
      });
    }

    if (totalCards === 8977 && incorrectSets.length === 0) {
      console.log('\n✅ SUCCESS! All 8,977 cards imported correctly!');
      console.log('All Base and Optic sets have exactly 200 cards (1-175 base + 176-200 Rated Rookies)');
    } else {
      console.log(`\n⚠️ Total cards: ${totalCards} (missing ${8977 - totalCards})`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompleteDonrussImport();