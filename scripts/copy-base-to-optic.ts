import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function copyBaseToOptic() {
  try {
    // Find the 2024-25 Donruss Soccer release
    const release = await prisma.release.findFirst({
      where: {
        name: { contains: 'Donruss Soccer', mode: 'insensitive' },
        year: '2024-25',
      },
      include: {
        sets: true,
      },
    });

    if (!release) {
      console.error('Release not found');
      return;
    }

    console.log('Found release:', release.name);
    console.log('Sets:', release.sets.map(s => s.name));

    // Find the Base Set and Optic Base set
    const baseSet = release.sets.find(s => s.name === 'Base Set');
    const opticSet = release.sets.find(s => s.name === 'Optic Base');

    if (!baseSet || !opticSet) {
      console.error('Base Set or Optic Base set not found');
      console.log('Base Set:', baseSet?.name);
      console.log('Optic Set:', opticSet?.name);
      return;
    }

    console.log('Base Set ID:', baseSet.id);
    console.log('Optic Set ID:', opticSet.id);

    // Get all cards from Base Set
    const baseCards = await prisma.card.findMany({
      where: { setId: baseSet.id },
      orderBy: { cardNumber: 'asc' },
    });

    console.log(`Found ${baseCards.length} cards in Base Set`);

    // Check if Optic set already has cards
    const existingOpticCards = await prisma.card.findMany({
      where: { setId: opticSet.id },
    });

    if (existingOpticCards.length > 0) {
      console.log(`Optic set already has ${existingOpticCards.length} cards. Skipping.`);
      return;
    }

    // Define the Optic parallels
    const opticParallels = [
      'Base', // Base Optic version
      'Holo',
      'Argyle',
      'Ice',
      'Pink Velocity /99',
      'Purple /75',
      'Blue Velocity /49',
      'Orange /25',
      'Gold /10',
      'Red /5',
      'Green /1',
      // Add more parallels as needed
    ];

    console.log(`Creating Optic cards with ${opticParallels.length} parallels for each of ${baseCards.length} players...`);

    let createdCount = 0;

    // For each base card, create Optic versions with all parallels
    for (const baseCard of baseCards) {
      for (const parallel of opticParallels) {
        // Determine if numbered and print run
        let isNumbered = false;
        let printRun = null;

        const printRunMatch = parallel.match(/\/(\d+)/);
        if (printRunMatch) {
          isNumbered = true;
          printRun = parseInt(printRunMatch[1]);
        }

        await prisma.card.create({
          data: {
            setId: opticSet.id,
            cardNumber: baseCard.cardNumber,
            playerName: baseCard.playerName,
            team: baseCard.team,
            parallelType: parallel,
            isNumbered,
            printRun,
            hasAutograph: false,
            hasMemorabilia: false,
          },
        });

        createdCount++;
        if (createdCount % 100 === 0) {
          console.log(`Created ${createdCount} cards...`);
        }
      }
    }

    console.log(`✅ Successfully created ${createdCount} Optic cards!`);
    console.log(`   ${baseCards.length} players × ${opticParallels.length} parallels = ${createdCount} cards`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

copyBaseToOptic();
