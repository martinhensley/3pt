import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Function to generate proper Optic card slugs
function generateOpticCardSlug(
  year: string,
  releaseName: string,
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

  // For Optic cards, use format: 2024-25-donruss-soccer-optic-1-matt-turner-variant-printrun
  const parts = [
    year,
    'donruss-soccer',
    'optic',
    cardNumber,
    cleanPlayer,
    cleanVariant,
    printRun?.toString()
  ].filter(Boolean);

  return parts.join('-');
}

async function fixOpticSlugs() {
  try {
    console.log('Fixing Optic card slugs and adding missing cards...\n');

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

    // Find all Optic sets
    const opticSets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        slug: {
          contains: 'optic'
        }
      }
    });

    console.log(`Found ${opticSets.length} Optic sets to process\n`);

    // Process each Optic set
    for (const set of opticSets) {
      console.log(`Processing: ${set.name}`);

      // Delete existing cards with incorrect slugs
      const deletedCount = await prisma.card.deleteMany({
        where: { setId: set.id }
      });
      console.log(`  Deleted ${deletedCount.count} existing cards`);

      // Determine the Excel set name
      let excelSetName = set.name;
      if (set.name === 'Optic') {
        excelSetName = 'Base Optic';
      } else if (set.name.startsWith('Optic ')) {
        excelSetName = 'Base ' + set.name;
      }

      // Extract variant from set name
      let variantName: string | null = null;
      if (set.name.includes(' Black Pandora')) variantName = 'Black Pandora';
      else if (set.name.includes(' Black')) variantName = 'Black';
      else if (set.name.includes(' Blue')) variantName = 'Blue';
      else if (set.name.includes(' Gold')) variantName = 'Gold';
      else if (set.name.includes(' Green')) variantName = 'Green';
      else if (set.name.includes(' Red')) variantName = 'Red';
      else if (set.name.includes(' Purple')) variantName = 'Purple';
      else if (set.name.includes(' Teal')) variantName = 'Teal';
      else if (set.name.includes(' Pink Diamond')) variantName = 'Pink Diamond';
      else if (set.name.includes(' Pink Ice')) variantName = 'Pink Ice';
      else if (set.name.includes(' Pink Velocity')) variantName = 'Pink Velocity';
      else if (set.name.includes(' Dragon Scale')) variantName = 'Dragon Scale';
      else if (set.name.includes(' Plum Blossom')) variantName = 'Plum Blossom';
      else if (set.name.includes(' Argyle')) variantName = 'Argyle';
      else if (set.name.includes(' Diamond')) variantName = 'Diamond';
      else if (set.name.includes(' Holo')) variantName = 'Holo';
      else if (set.name.includes(' Ice')) variantName = 'Ice';
      else if (set.name.includes(' Orange')) variantName = 'Orange';
      else if (set.name.includes(' Pink')) variantName = 'Pink';
      else if (set.name.includes(' Silver')) variantName = 'Silver';
      else if (set.name.includes(' Velocity')) variantName = 'Velocity';

      console.log(`  Looking for Excel set: ${excelSetName}`);
      console.log(`  Variant: ${variantName || 'Base'}`);
      console.log(`  Print Run: ${set.printRun || 'N/A'}`);

      // Collect cards for this set
      const cards = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row[0]) continue;

        const cardSet = String(row[0]).trim();
        if (cardSet === excelSetName) {
          cards.push({
            cardNumber: row[1] ? String(row[1]).trim() : '',
            playerName: row[2] ? String(row[2]).trim() : '',
            team: row[3] ? String(row[3]).trim() : ''
          });
        }
      }

      console.log(`  Found ${cards.length} cards to create`);

      // Create cards with proper Optic slugs
      let createdCount = 0;
      for (const card of cards) {
        const cardSlug = generateOpticCardSlug(
          '2024-25',
          'donruss-soccer',
          card.cardNumber,
          card.playerName,
          variantName,
          set.printRun || undefined
        );

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
              setId: set.id,
            },
          });
          createdCount++;
        } catch (error: any) {
          console.log(`    ⚠️ Error creating card: ${cardSlug}`, error.message);
        }
      }

      console.log(`  ✅ Created ${createdCount} cards\n`);
    }

    // Also fix Base Red set (from Rated Rookies Red)
    console.log('Fixing Base Red set...');
    const baseRedSet = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        slug: '2024-25-donruss-soccer-base-red-parallel-99'
      }
    });

    if (baseRedSet) {
      // Delete any existing cards
      await prisma.card.deleteMany({
        where: { setId: baseRedSet.id }
      });

      // Add Rated Rookies Red cards (176-200)
      const ratedRookiesRed = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row[0]) continue;

        const cardSet = String(row[0]).trim();
        if (cardSet === 'Rated Rookies Red') {
          ratedRookiesRed.push({
            cardNumber: row[1] ? String(row[1]).trim() : '',
            playerName: row[2] ? String(row[2]).trim() : '',
            team: row[3] ? String(row[3]).trim() : ''
          });
        }
      }

      console.log(`  Found ${ratedRookiesRed.length} Rated Rookies Red cards`);

      // Also add Base Red cards (1-175)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row[0]) continue;

        const cardSet = String(row[0]).trim();
        if (cardSet === 'Base Red') {
          ratedRookiesRed.push({
            cardNumber: row[1] ? String(row[1]).trim() : '',
            playerName: row[2] ? String(row[2]).trim() : '',
            team: row[3] ? String(row[3]).trim() : ''
          });
        }
      }

      console.log(`  Total Base Red cards to create: ${ratedRookiesRed.length}`);

      for (const card of ratedRookiesRed) {
        const cleanPlayer = card.playerName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        const cardSlug = `2024-25-donruss-soccer-base-${card.cardNumber}-${cleanPlayer}-red-99`;

        try {
          await prisma.card.create({
            data: {
              slug: cardSlug,
              playerName: card.playerName || null,
              team: card.team || null,
              cardNumber: card.cardNumber || null,
              variant: 'Red',
              printRun: 99,
              isNumbered: true,
              numbered: '/99',
              rarity: 'rare',
              setId: baseRedSet.id,
            },
          });
        } catch (error: any) {
          // Ignore duplicates
        }
      }

      console.log(`  ✅ Base Red set fixed\n`);
    }

    // Final validation
    const totalCards = await prisma.card.count({
      where: { set: { releaseId: release.id } }
    });

    const totalSets = await prisma.set.count({
      where: { releaseId: release.id }
    });

    console.log('=' * 60);
    console.log(`Total sets: ${totalSets}`);
    console.log(`Total cards: ${totalCards}`);
    console.log('Expected: 8,977 cards across 116 sets');

    if (totalCards === 8977) {
      console.log('\n✅ SUCCESS! All 8,977 cards imported correctly!');
    } else {
      console.log(`\n⚠️ Still have ${totalCards} cards (missing ${8977 - totalCards})`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOpticSlugs();