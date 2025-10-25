import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateBaseParallels() {
  // Get the Base Set
  const baseSet = await prisma.set.findFirst({
    where: {
      name: { contains: 'Base', mode: 'insensitive' },
      release: {
        year: '2024-25',
        name: { contains: 'Donruss Soccer', mode: 'insensitive' }
      }
    }
  });

  if (!baseSet) {
    console.log('Base Set not found');
    await prisma.$disconnect();
    return;
  }

  console.log('Found Base Set:', baseSet.name);
  console.log('Parallels:', baseSet.parallels);

  // Extract parallels array from Json type
  const parallelsArray = (baseSet.parallels as string[] | null) || [];
  const parallels = parallelsArray.filter((p): p is string => p !== null);

  if (parallels.length === 0) {
    console.log('No parallels defined for Base Set');
    await prisma.$disconnect();
    return;
  }

  // Get all existing base cards (with null parallelType)
  const baseCards = await prisma.card.findMany({
    where: {
      setId: baseSet.id,
      parallelType: null
    },
    orderBy: { cardNumber: 'asc' }
  });

  console.log(`\nFound ${baseCards.length} base cards`);
  console.log(`Will create ${baseCards.length * parallels.length} parallel cards\n`);

  // Create parallel cards for each base card
  let createdCount = 0;

  for (const parallel of parallels) {
    console.log(`Creating ${parallel} parallel cards...`);

    for (const baseCard of baseCards) {
      // Create a new card with the parallel type
      await prisma.card.create({
        data: {
          playerName: baseCard.playerName,
          team: baseCard.team,
          cardNumber: baseCard.cardNumber,
          variant: baseCard.variant,
          parallelType: parallel,
          serialNumber: baseCard.serialNumber,
          isNumbered: baseCard.isNumbered,
          printRun: baseCard.printRun,
          rarity: baseCard.rarity,
          finish: baseCard.finish,
          hasAutograph: baseCard.hasAutograph,
          hasMemorabilia: baseCard.hasMemorabilia,
          specialFeatures: baseCard.specialFeatures,
          colorVariant: baseCard.colorVariant,
          detectionConfidence: baseCard.detectionConfidence,
          detectionMethods: baseCard.detectionMethods,
          detectedText: baseCard.detectedText,
          imageFront: baseCard.imageFront,
          imageBack: baseCard.imageBack,
          footyNotes: baseCard.footyNotes,
          setId: baseCard.setId,
        }
      });

      createdCount++;
    }

    console.log(`  Created ${baseCards.length} ${parallel} cards (Total: ${createdCount})`);
  }

  console.log(`\n✓ Successfully created ${createdCount} parallel cards`);

  // Update the existing base cards to have parallelType = "Base"
  console.log('\nUpdating base cards to have parallelType = "Base"...');
  const updateResult = await prisma.card.updateMany({
    where: {
      setId: baseSet.id,
      parallelType: null
    },
    data: {
      parallelType: 'Base'
    }
  });

  console.log(`✓ Updated ${updateResult.count} base cards`);

  // Verify final count
  const finalCount = await prisma.card.count({
    where: { setId: baseSet.id }
  });

  console.log(`\n✓ Base Set now has ${finalCount} total cards`);
  console.log(`  Expected: ${baseCards.length * (parallels.length + 1)} cards (200 base × 15 variations)`);

  await prisma.$disconnect();
}

populateBaseParallels().catch(console.error);
