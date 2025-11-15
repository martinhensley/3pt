import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { generateCardSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function fixMissingOpticCards() {
  try {
    console.log('Fixing missing Optic parallel cards...\n');

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

    // Find sets with 0 cards
    const emptySets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        slug: {
          in: [
            '2024-25-donruss-soccer-base-red-parallel-99',
            '2024-25-donruss-soccer-optic-black-parallel-1',
            '2024-25-donruss-soccer-optic-blue-parallel-49',
            '2024-25-donruss-soccer-optic-gold-parallel-10',
            '2024-25-donruss-soccer-optic-green-parallel-5'
          ]
        }
      }
    });

    console.log(`Found ${emptySets.length} sets to fix:\n`);

    for (const set of emptySets) {
      console.log(`Processing: ${set.name}`);

      // Determine the original set name from Excel
      let excelSetName = set.name;

      // Map display names back to Excel names
      if (set.name.startsWith('Optic ')) {
        excelSetName = 'Base ' + set.name; // "Optic Black" -> "Base Optic Black"
      } else if (set.name === 'Base Red') {
        // Special case for Base Red which should be mapped from Rated Rookies Red
        excelSetName = 'Rated Rookies Red';
      }

      console.log(`  Looking for Excel set: ${excelSetName}`);

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

      console.log(`  Found ${cards.length} cards`);

      // Extract variant and print run from set
      let variantName: string | null = null;
      let printRun: number | null = set.printRun;

      // Extract variant from set name
      if (set.name.includes(' Black')) variantName = 'Black';
      else if (set.name.includes(' Blue')) variantName = 'Blue';
      else if (set.name.includes(' Gold')) variantName = 'Gold';
      else if (set.name.includes(' Green')) variantName = 'Green';
      else if (set.name.includes(' Red')) variantName = 'Red';

      // Special handling for Optic variants - include "Optic" in the variant name for slug generation
      if (set.slug.includes('optic') && variantName) {
        variantName = `Optic ${variantName}`;
      }

      // Create cards
      let createdCount = 0;
      for (const card of cards) {
        // Generate card slug with modified variant for Optic cards
        const cardSlug = generateCardSlug(
          release.manufacturer.name,
          release.name,
          release.year || '2024-25',
          set.name.includes('Optic') ? 'Base Optic' : 'Base',
          card.cardNumber,
          card.playerName,
          variantName,
          printRun || undefined
        );

        try {
          await prisma.card.create({
            data: {
              slug: cardSlug,
              playerName: card.playerName || null,
              team: card.team || null,
              cardNumber: card.cardNumber || null,
              variant: variantName ? variantName.replace('Optic ', '') : null, // Store without "Optic" prefix
              printRun,
              isNumbered: printRun !== null,
              numbered: printRun ? (printRun === 1 ? '1 of 1' : `/${printRun}`) : null,
              rarity: printRun === 1 ? 'one_of_one' :
                      printRun && printRun <= 10 ? 'ultra_rare' :
                      printRun && printRun <= 50 ? 'super_rare' :
                      printRun && printRun <= 199 ? 'rare' : 'base',
              setId: set.id,
            },
          });
          createdCount++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`    ⚠️ Card already exists: ${cardSlug}`);
          } else {
            throw error;
          }
        }
      }

      console.log(`  ✅ Created ${createdCount} cards\n`);
    }

    // Final validation
    const totalCards = await prisma.card.count({
      where: { set: { releaseId: release.id } }
    });

    console.log('=' * 60);
    console.log(`Total cards now: ${totalCards}`);
    console.log('Expected: 8,977');

    if (totalCards === 8977) {
      console.log('✅ All cards successfully imported!');
    } else {
      console.log(`⚠️ Still missing ${8977 - totalCards} cards`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingOpticCards();