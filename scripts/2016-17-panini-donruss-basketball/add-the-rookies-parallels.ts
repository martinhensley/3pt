import { PrismaClient } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';

const prisma = new PrismaClient();

// The Rookies parallels to add
const PARALLELS = [
  { name: 'Press Proof', printRun: null }, // Unnumbered
  { name: 'Press Proof Blue', printRun: 99 },
  { name: 'Press Proof Black', printRun: 1 },
];

async function addTheRookiesParallels() {
  try {
    console.log('Adding The Rookies parallels...\n');

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

    // 2. Find the base "The Rookies" set to get the cards
    const baseRookiesSet = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: 'The Rookies',
        isParallel: false
      },
      include: { cards: true }
    });

    if (!baseRookiesSet) {
      console.error('Base "The Rookies" set not found!');
      return;
    }

    console.log(`Found base set with ${baseRookiesSet.cards.length} cards\n`);

    let totalSetsCreated = 0;
    let totalCardsCreated = 0;

    // 3. Create each parallel set
    for (const parallel of PARALLELS) {
      const baseSetName = 'The Rookies';
      const variantName = parallel.name;
      const printRun = parallel.printRun;
      const setType = 'Insert';
      const isParallel = true;

      const fullSetName = `${baseSetName} ${variantName}`;

      console.log(`Processing: ${fullSetName} (${printRun ? '/' + printRun : 'unnumbered'})`);

      // Generate slug
      const parallelSlug = variantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const baseSlug = generateSetSlug('2016-17', 'Donruss Basketball', baseSetName, setType);
      const slug = printRun ? `${baseSlug}-${parallelSlug}-parallel-${printRun}` : `${baseSlug}-${parallelSlug}-parallel`;

      // Calculate base set slug
      const baseSetSlug = generateSetSlug('2016-17', 'Donruss Basketball', baseSetName, setType);

      console.log(`  Slug: ${slug}`);

      // Check if set already exists
      const existingSet = await prisma.set.findUnique({
        where: { slug }
      });

      if (existingSet) {
        console.log(`  ⚠️  Set already exists, skipping...\n`);
        continue;
      }

      // Create the parallel set
      const parallelSet = await prisma.set.create({
        data: {
          name: fullSetName,
          slug,
          type: setType,
          isParallel,
          baseSetSlug,
          printRun,
          releaseId: release.id,
          expectedCardCount: baseRookiesSet.cards.length.toString()
        }
      });

      totalSetsCreated++;
      console.log(`  ✅ Created set: ${parallelSet.slug}`);

      // Create cards for this parallel
      let cardsCreated = 0;
      for (const baseCard of baseRookiesSet.cards) {
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
      console.log(`  ✅ Created ${cardsCreated}/${baseRookiesSet.cards.length} cards\n`);
    }

    // 4. Summary
    console.log('='.repeat(60));
    console.log(`✅ Successfully added ${totalSetsCreated} The Rookies parallel sets`);
    console.log(`✅ Created ${totalCardsCreated} cards`);
    console.log('='.repeat(60));

    // 5. Validation
    console.log('\n===== Validation =====');
    const theRookiesSets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        name: { contains: 'The Rookies' }
      },
      include: { _count: { select: { cards: true } } },
      orderBy: [
        { isParallel: 'asc' },
        { printRun: 'desc' }
      ]
    });

    console.log(`\nTotal "The Rookies" sets: ${theRookiesSets.length}`);
    theRookiesSets.forEach(set => {
      const parallelInfo = set.isParallel ? ' (parallel)' : ' (base)';
      console.log(`  - ${set.name}: ${set._count.cards} cards ${set.printRun ? '(/' + set.printRun + ')' : ''}${parallelInfo}`);
    });

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('Error adding The Rookies parallels:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addTheRookiesParallels();
