import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLegacyHoloParallels() {
  try {
    console.log('Fixing legacy Holo Laser parallel sets...\n');

    // The legacy sets that need to be deleted or updated
    const legacyIssues = [
      {
        slug: 'panini-donruss-basketball-2016-17-base-parallel-holo-blue-laser',
        correctPrintRun: 49,
        action: 'delete' // We have the correct /49 version already
      },
      {
        slug: 'panini-donruss-basketball-2016-17-base-parallel-holo-green-laser',
        correctPrintRun: 99,
        action: 'delete' // We have the correct /99 version already
      },
      {
        slug: '2016-17-donruss-basketball-base-holo-green-laser-parallel',
        correctPrintRun: 99,
        action: 'delete' // Duplicate - wrong slug format
      }
    ];

    let deletedSets = 0;
    let deletedCards = 0;

    for (const issue of legacyIssues) {
      console.log(`Processing: ${issue.slug}`);

      const set = await prisma.set.findUnique({
        where: { slug: issue.slug },
        include: { _count: { select: { cards: true } } }
      });

      if (!set) {
        console.log(`  ⚠️  Set not found, skipping...`);
        continue;
      }

      console.log(`  Found set with ${set._count.cards} cards`);
      console.log(`  Current print run: ${set.printRun || 'null'}`);
      console.log(`  Correct print run: ${issue.correctPrintRun}`);

      if (issue.action === 'delete') {
        // Delete all cards first
        const deleteCardsResult = await prisma.card.deleteMany({
          where: { setId: set.id }
        });
        console.log(`  🗑️  Deleted ${deleteCardsResult.count} cards`);
        deletedCards += deleteCardsResult.count;

        // Delete the set
        await prisma.set.delete({
          where: { id: set.id }
        });
        console.log(`  🗑️  Deleted set`);
        deletedSets++;
      }

      console.log('');
    }

    console.log('='.repeat(60));
    console.log(`✅ Deleted ${deletedSets} legacy sets`);
    console.log(`✅ Deleted ${deletedCards} cards`);
    console.log('='.repeat(60));

    // Validation - check what's left
    console.log('\n===== Validation =====\n');

    const remainingHoloSets = await prisma.set.findMany({
      where: {
        slug: { contains: '2016-17' },
        AND: [
          { slug: { contains: 'donruss' } },
          { slug: { contains: 'basketball' } },
          { name: { contains: 'Holo' } },
          { name: { contains: 'Laser' } },
        ]
      },
      select: {
        name: true,
        slug: true,
        printRun: true,
        _count: { select: { cards: true } }
      },
      orderBy: [
        { printRun: 'desc' },
        { name: 'asc' }
      ]
    });

    console.log(`Remaining Holo Laser sets: ${remainingHoloSets.length}\n`);

    const unnumbered = remainingHoloSets.filter(s => s.printRun === null);
    const numbered = remainingHoloSets.filter(s => s.printRun !== null);

    console.log(`Unnumbered: ${unnumbered.length} (should be 2)`);
    unnumbered.forEach(s => {
      console.log(`  - ${s.name} (${s._count.cards} cards)`);
    });

    console.log(`\nNumbered: ${numbered.length}`);
    numbered.forEach(s => {
      console.log(`  - ${s.name} /${s.printRun} (${s._count.cards} cards)`);
    });

    if (unnumbered.length !== 2) {
      console.warn(`\n⚠️  WARNING: Expected 2 unnumbered parallels, found ${unnumbered.length}`);
    } else {
      console.log('\n✅ Correct number of unnumbered parallels!');
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixLegacyHoloParallels();
