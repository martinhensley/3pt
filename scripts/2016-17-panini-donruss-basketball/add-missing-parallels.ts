import { PrismaClient } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';

const prisma = new PrismaClient();

// Missing parallels with their print runs
const MISSING_PARALLELS = [
  { name: 'Holo Green and Yellow Laser', printRun: null },
  { name: 'Holo Orange Laser', printRun: null },
  { name: 'Press Proof Silver', printRun: 299 },
  { name: 'Press Proof Purple', printRun: 199 },
  { name: 'Holo Green Laser', printRun: 99 },
  { name: 'Holo Red Laser', printRun: 99 },
  { name: 'Press Proof Red', printRun: 75 },
  { name: 'Holo Blue Laser', printRun: 49 },
  { name: 'Holo Yellow Laser', printRun: 25 },
  { name: 'Press Proof Blue', printRun: 25 },
  { name: 'Holo Red and Blue Laser', printRun: 15 },
  { name: 'Holo Purple Laser', printRun: 15 },
  { name: 'Press Proof Gold', printRun: 10 },
  { name: 'Press Proof Black', printRun: 1 },
];

async function addMissingParallels() {
  try {
    console.log('Adding missing parallels for 2016-17 Panini Donruss Basketball...\n');

    // 1. Find the release
    const release = await prisma.release.findUnique({
      where: { slug: '2016-17-panini-donruss-basketball' },
      include: { manufacturer: true }
    });

    if (!release) {
      console.error('Release not found!');
      return;
    }

    console.log(`Found release: ${release.name} (${release.id})\n`);

    // 2. Get the base set to copy cards from
    const baseSet = await prisma.set.findUnique({
      where: { slug: 'panini-donruss-basketball-2016-17-base-parallel' },
      include: { cards: true }
    });

    if (!baseSet) {
      console.error('Base set not found!');
      return;
    }

    console.log(`Found base set with ${baseSet.cards.length} cards\n`);

    // 3. For each missing parallel
    let totalSetsCreated = 0;
    let totalCardsCreated = 0;

    for (const parallel of MISSING_PARALLELS) {
      console.log(`Processing: Base ${parallel.name} (${parallel.printRun ? '/' + parallel.printRun : 'unnumbered'})`);

      const variantName = parallel.name;
      const printRun = parallel.printRun;
      const isParallel = true;
      const baseSetName = 'Base';
      const setType = 'Base';

      // Generate slug for the parallel set (using legacy format)
      const parallelSlug = variantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const baseSlug = 'panini-donruss-basketball-2016-17-base';
      const slug = printRun
        ? `${baseSlug}-${parallelSlug}-parallel-${printRun}`
        : `${baseSlug}-${parallelSlug}-parallel`;

      // Check if set already exists
      const existingSet = await prisma.set.findUnique({
        where: { slug }
      });

      if (existingSet) {
        console.log(`  ⚠️  Set already exists, skipping...`);
        continue;
      }

      // Create the parallel set
      const parallelSet = await prisma.set.create({
        data: {
          name: `Base ${variantName}`,
          slug,
          type: setType,
          isParallel,
          baseSetSlug: baseSlug,
          printRun,
          releaseId: release.id,
          expectedCardCount: baseSet.cards.length.toString()
        }
      });

      totalSetsCreated++;
      console.log(`  ✅ Created set: ${parallelSet.slug}`);

      // Create cards for this parallel
      let cardsCreated = 0;
      for (const baseCard of baseSet.cards) {
        const cardSlug = generateCardSlug(
          release.manufacturer.name,
          release.name,
          release.year || '2016-17',
          baseSetName,
          baseCard.cardNumber!,
          baseCard.playerName!,
          variantName,
          printRun || undefined,
          setType as any
        );

        try {
          await prisma.card.create({
            data: {
              slug: cardSlug,
              playerName: baseCard.playerName,
              team: baseCard.team,
              cardNumber: baseCard.cardNumber,
              variant: variantName,
              printRun,
              isNumbered: printRun !== null,
              numbered: printRun ? (printRun === 1 ? '1 of 1' : `/${printRun}`) : null,
              rarity: printRun === 1 ? 'one_of_one' :
                      printRun && printRun <= 10 ? 'ultra_rare' :
                      printRun && printRun <= 50 ? 'super_rare' :
                      printRun && printRun <= 199 ? 'rare' : 'base',
              setId: parallelSet.id
            }
          });
          cardsCreated++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`    ⚠️  Card already exists: ${cardSlug}`);
          } else {
            throw error;
          }
        }
      }

      totalCardsCreated += cardsCreated;
      console.log(`  ✅ Created ${cardsCreated}/${baseSet.cards.length} cards\n`);
    }

    // 4. Summary
    console.log('='.repeat(60));
    console.log(`✅ Successfully added ${totalSetsCreated} parallel sets`);
    console.log(`✅ Created ${totalCardsCreated} parallel cards`);
    console.log('='.repeat(60));

    // 5. Validation
    console.log('\n===== Validation =====');
    const allSets = await prisma.set.findMany({
      where: { releaseId: release.id },
      include: { _count: { select: { cards: true } } },
      orderBy: { name: 'asc' }
    });

    console.log(`\nTotal sets for release: ${allSets.length}`);
    console.log('\nBase sets and parallels:');
    const baseSets = allSets.filter(s => s.type === 'Base');
    for (const set of baseSets) {
      console.log(`  - ${set.name}: ${set._count.cards} cards ${set.printRun ? '(/' + set.printRun + ')' : ''}`);
    }

    const expectedCardCount = await prisma.card.count({
      where: { set: { releaseId: release.id } }
    });
    console.log(`\nTotal cards across all sets: ${totalCards}`);

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('Error adding parallels:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addMissingParallels();
