import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addKaboom() {
  try {
    // Find the release
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
    });

    if (!release) {
      throw new Error('Release not found');
    }

    console.log('Found release:', release.name);

    // Kaboom checklist
    const kaboomCards = [
      { cardNumber: '1', playerName: 'Kylian Mbappe', team: 'France' },
      { cardNumber: '2', playerName: 'Florian Wirtz', team: 'Germany' },
      { cardNumber: '3', playerName: 'Christian Pulisic', team: 'United States' },
      { cardNumber: '4', playerName: 'Darwin Nunez', team: 'Uruguay' },
      { cardNumber: '5', playerName: 'Santiago Gimenez', team: 'Mexico' },
      { cardNumber: '6', playerName: 'Jude Bellingham', team: 'England' },
      { cardNumber: '7', playerName: 'Julian Alvarez', team: 'Argentina' },
      { cardNumber: '8', playerName: 'Dusan Vlahovic', team: 'Serbia' },
      { cardNumber: '9', playerName: 'Victor Osimhen', team: 'Nigeria' },
      { cardNumber: '10', playerName: 'Lionel Messi', team: 'Argentina' },
      { cardNumber: '11', playerName: 'Cole Palmer', team: 'England' },
      { cardNumber: '12', playerName: 'Lautaro Martinez', team: 'Argentina' },
      { cardNumber: '13', playerName: 'Erling Haaland', team: 'Norway' },
      { cardNumber: '14', playerName: 'Cristiano Ronaldo', team: 'Portugal' },
      { cardNumber: '15', playerName: 'Phil Foden', team: 'England' },
      { cardNumber: '16', playerName: 'Andrea Pirlo', team: 'Italy' },
      { cardNumber: '17', playerName: 'Gareth Bale', team: 'Cymru' },
      { cardNumber: '18', playerName: 'Gianluigi Buffon', team: 'Italy' },
      { cardNumber: '19', playerName: 'Michael Ballack', team: 'Germany' },
      { cardNumber: '20', playerName: 'Paolo Maldini', team: 'Italy' },
      { cardNumber: '21', playerName: 'Steven Gerrard', team: 'England' },
      { cardNumber: '22', playerName: 'Toni Kroos', team: 'Germany' },
      { cardNumber: '23', playerName: 'Zinedine Zidane', team: 'France' },
      { cardNumber: '24', playerName: 'Diego Maradona', team: 'Argentina' },
      { cardNumber: '25', playerName: 'Zlatan Ibrahimovic', team: 'Sweden' },
    ];

    // Check if Kaboom already exists
    const existingKaboom = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: 'Kaboom',
        parentSetId: null,
      },
    });

    if (existingKaboom) {
      console.log('Kaboom set already exists, skipping...');
      return;
    }

    // Create parent Kaboom set
    console.log('Creating Kaboom parent set...');
    const kaboomParent = await prisma.set.create({
      data: {
        name: 'Kaboom',
        slug: '2024-25-panini-donruss-soccer-insert-kaboom',
        type: 'Insert',
        releaseId: release.id,
        totalCards: '25',
        description: 'High-impact insert featuring explosive designs',
      },
    });

    console.log('Created Kaboom parent set');

    // Create parallel sets
    console.log('Creating Kaboom parallel sets...');

    const kaboomGold = await prisma.set.create({
      data: {
        name: 'Kaboom Gold',
        slug: '2024-25-panini-donruss-soccer-insert-kaboom-gold-10',
        type: 'Insert',
        releaseId: release.id,
        parentSetId: kaboomParent.id,
        printRun: 10,
        totalCards: '25',
        mirrorsParentChecklist: true,
      },
    });

    const kaboomBlack = await prisma.set.create({
      data: {
        name: 'Kaboom Black',
        slug: '2024-25-panini-donruss-soccer-insert-kaboom-black-1-of-1',
        type: 'Insert',
        releaseId: release.id,
        parentSetId: kaboomParent.id,
        printRun: 1,
        totalCards: '25',
        mirrorsParentChecklist: true,
      },
    });

    console.log('Created Kaboom parallel sets');

    // Add cards to parent set
    console.log('Adding cards to Kaboom parent set...');
    let cardCount = 0;

    for (const cardData of kaboomCards) {
      const slug = `2024-25-donruss-soccer-kaboom-${cardData.cardNumber}-${cardData.playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      await prisma.card.create({
        data: {
          slug,
          playerName: cardData.playerName,
          team: cardData.team,
          cardNumber: cardData.cardNumber,
          setId: kaboomParent.id,
        },
      });

      cardCount++;
      if (cardCount % 5 === 0) {
        console.log(`Added ${cardCount}/${kaboomCards.length} cards...`);
      }
    }

    console.log(`✅ Successfully added Kaboom set with ${cardCount} cards`);
    console.log(`   Parent set: ${kaboomParent.slug}`);
    console.log(`   Gold parallel (/10): ${kaboomGold.slug}`);
    console.log(`   Black parallel (1/1): ${kaboomBlack.slug}`);

  } catch (error) {
    console.error('Error adding Kaboom:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addKaboom();
