import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { generateCardSlug, generateSetSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

interface CardRow {
  'Card Set': string;
  'Card Number': string;
  'Athlete': string;
  'Team': string;
  'Sequence'?: string;
}

async function importDonrussMaster() {
  try {
    // Get the Donruss release
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
      include: {
        manufacturer: true,
      },
    });

    if (!release) {
      console.error('❌ Release not found: 2024-25-panini-donruss-soccer');
      return;
    }

    console.log(`✅ Found release: ${release.year} ${release.manufacturer.name} ${release.name}`);

    // Read the Excel file
    const workbook = XLSX.readFile('/Users/mh/Desktop/2024-25-Donruss-Soccer-Checklist.xlsx');
    const masterSheet = workbook.Sheets['Master'];
    const cards: CardRow[] = XLSX.utils.sheet_to_json(masterSheet);

    console.log(`📊 Found ${cards.length} total cards in Master tab`);

    // Get existing sets to avoid duplicates
    const existingSets = await prisma.set.findMany({
      where: { releaseId: release.id },
      select: { name: true, slug: true },
    });

    console.log(`📋 Existing sets: ${existingSets.length}`);
    existingSets.forEach(set => console.log(`  - ${set.name}`));

    // Group cards by set name
    const cardsBySet = new Map<string, CardRow[]>();
    cards.forEach(card => {
      const setName = card['Card Set'];
      if (!cardsBySet.has(setName)) {
        cardsBySet.set(setName, []);
      }
      cardsBySet.get(setName)!.push(card);
    });

    console.log(`\n📦 Found ${cardsBySet.size} unique sets in Master tab`);

    // Identify base sets and parallels
    const setsToCreate: Array<{
      name: string;
      baseName: string;
      parallel: string | null;
      type: 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';
      cards: CardRow[];
    }> = [];

    cardsBySet.forEach((cardList, setName) => {
      // Determine set type
      let type: 'Base' | 'Insert' | 'Autograph' | 'Memorabilia' = 'Insert';
      if (setName.toLowerCase().includes('autograph') || setName.toLowerCase().includes('signature')) {
        type = 'Autograph';
      } else if (setName.toLowerCase().includes('kit kings') || setName.toLowerCase().includes('kit series')) {
        type = 'Memorabilia';
      } else if (setName.toLowerCase().startsWith('base') || setName.toLowerCase().startsWith('rated rookies')) {
        type = 'Base';
      }

      // Parse base name and parallel
      let baseName = setName;
      let parallel: string | null = null;

      // Check for common parallel patterns
      const parallelPatterns = [
        'Black', 'Blue', 'Gold', 'Green', 'Pink', 'Purple', 'Red', 'Silver', 'Teal',
        'Optic', 'Cubic', 'Diamond', 'Argyle', 'Dragon Scale', 'Holo', 'Ice',
        'Pandora', 'Pink Ice', 'Pink Velocity', 'Plum Blossom', 'Purple Mojo',
        'Teal Mojo', 'Velocity', 'Gold Power'
      ];

      for (const pattern of parallelPatterns) {
        if (setName.includes(pattern)) {
          // Extract base name by removing the parallel
          const regex = new RegExp(`\\s*${pattern}\\s*$`, 'i');
          baseName = setName.replace(regex, '').trim();
          parallel = pattern;
          break;
        }
      }

      // Handle multi-word parallels
      if (!parallel && setName.includes('Pink Cubic')) {
        baseName = setName.replace(/\s*Pink Cubic\s*$/, '').trim();
        parallel = 'Pink Cubic';
      } else if (!parallel && setName.includes('Pink Diamond')) {
        baseName = setName.replace(/\s*Pink Diamond\s*$/, '').trim();
        parallel = 'Pink Diamond';
      } else if (!parallel && setName.includes('Red Cubic')) {
        baseName = setName.replace(/\s*Red Cubic\s*$/, '').trim();
        parallel = 'Red Cubic';
      } else if (!parallel && setName.includes('Blue Cubic')) {
        baseName = setName.replace(/\s*Blue Cubic\s*$/, '').trim();
        parallel = 'Blue Cubic';
      }

      setsToCreate.push({
        name: setName,
        baseName,
        parallel,
        type,
        cards: cardList,
      });
    });

    // Group by base name
    const setsByBase = new Map<string, typeof setsToCreate>();
    setsToCreate.forEach(set => {
      if (!setsByBase.has(set.baseName)) {
        setsByBase.set(set.baseName, []);
      }
      setsByBase.get(set.baseName)!.push(set);
    });

    console.log(`\n📚 Found ${setsByBase.size} base set families`);

    let setsCreated = 0;
    let cardsCreated = 0;

    // Process each base set family
    for (const [baseName, sets] of setsByBase) {
      // Find the base set (no parallel)
      const baseSet = sets.find(s => !s.parallel);
      if (!baseSet) {
        console.log(`⚠️  No base set found for ${baseName}, skipping...`);
        continue;
      }

      // Check if base set already exists
      const baseSetSlug = generateSetSlug(release.manufacturer.name, release.name, release.year || '', baseName);
      const existingBaseSet = await prisma.set.findUnique({
        where: { slug: baseSetSlug },
      });

      let parentSet;
      if (existingBaseSet) {
        console.log(`✅ Base set already exists: ${baseName}`);
        parentSet = existingBaseSet;
      } else {
        // Create parent base set
        const parallels = sets
          .filter(s => s.parallel)
          .map(s => s.parallel!);

        parentSet = await prisma.set.create({
          data: {
            name: baseName,
            slug: baseSetSlug,
            type: baseSet.type,
            releaseId: release.id,
            isBaseSet: baseSet.type === 'Base',
            parallels: parallels.length > 0 ? parallels : undefined,
          },
        });

        console.log(`✅ Created base set: ${baseName} (${parallels.length} parallels)`);
        setsCreated++;

        // Create cards for base set
        for (const cardRow of baseSet.cards) {
          const cardSlug = generateCardSlug(
            release.manufacturer.name,
            release.name,
            release.year || '',
            baseName,
            cardRow['Card Number'],
            cardRow['Athlete'],
            null, // No variant for base cards
            null  // No print run
          );

          const existingCard = await prisma.card.findUnique({
            where: { slug: cardSlug },
          });

          if (!existingCard) {
            await prisma.card.create({
              data: {
                slug: cardSlug,
                playerName: cardRow['Athlete'],
                team: cardRow['Team'],
                cardNumber: cardRow['Card Number'],
                setId: parentSet.id,
              },
            });
            cardsCreated++;
          }
        }

        console.log(`  📇 Created ${baseSet.cards.length} cards for ${baseName}`);
      }

      // Create parallel sets
      const parallelSets = sets.filter(s => s.parallel);
      for (const parallelSetInfo of parallelSets) {
        const parallelSlug = generateSetSlug(
          release.manufacturer.name,
          release.name,
          release.year || '',
          parallelSetInfo.name
        );

        const existingParallel = await prisma.set.findUnique({
          where: { slug: parallelSlug },
        });

        if (existingParallel) {
          console.log(`  ⚠️  Parallel already exists: ${parallelSetInfo.name}`);
          continue;
        }

        const parallelSet = await prisma.set.create({
          data: {
            name: parallelSetInfo.name,
            slug: parallelSlug,
            type: parallelSetInfo.type,
            releaseId: release.id,
            parentSetId: parentSet.id,
            isBaseSet: false,
          },
        });

        console.log(`  ✅ Created parallel set: ${parallelSetInfo.name}`);
        setsCreated++;

        // Create cards for parallel set
        for (const cardRow of parallelSetInfo.cards) {
          const cardSlug = generateCardSlug(
            release.manufacturer.name,
            release.name,
            release.year || '',
            parallelSetInfo.name,
            cardRow['Card Number'],
            cardRow['Athlete'],
            parallelSetInfo.parallel, // Variant is the parallel name
            null  // No print run in this data
          );

          const existingCard = await prisma.card.findUnique({
            where: { slug: cardSlug },
          });

          if (!existingCard) {
            await prisma.card.create({
              data: {
                slug: cardSlug,
                playerName: cardRow['Athlete'],
                team: cardRow['Team'],
                cardNumber: cardRow['Card Number'],
                variant: parallelSetInfo.parallel,
                parallelType: parallelSetInfo.parallel,
                setId: parallelSet.id,
              },
            });
            cardsCreated++;
          }
        }

        console.log(`    📇 Created ${parallelSetInfo.cards.length} cards for ${parallelSetInfo.name}`);
      }
    }

    console.log(`\n🎉 Import complete!`);
    console.log(`   Sets created: ${setsCreated}`);
    console.log(`   Cards created: ${cardsCreated}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importDonrussMaster();
