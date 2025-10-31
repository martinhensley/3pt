import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample test data - updating a few Dual Jersey Ink base cards
const testData = [
  { cardNumber: '10', playerName: 'Douglas Costa', serialNumber: '/12', printRun: 12 },
  { cardNumber: '11', playerName: 'Luiz Henrique', serialNumber: '/99', printRun: 99 },
];

async function testBaseUpdate() {
  console.log('Testing base card update workflow...\n');

  // Find the Dual Jersey Ink set
  const set = await prisma.set.findFirst({
    where: {
      name: 'Dual Jersey Ink',
      release: {
        slug: '2024-25-panini-obsidian-soccer',
      },
    },
  });

  if (!set) {
    console.error('Dual Jersey Ink set not found!');
    return;
  }

  console.log(`Found set: ${set.name} (ID: ${set.id})\n`);

  // Show current state of cards before update
  console.log('BEFORE UPDATE:');
  for (const data of testData) {
    // Check for both null and "Base" parallelType (legacy data)
    const card = await prisma.card.findFirst({
      where: {
        setId: set.id,
        cardNumber: data.cardNumber,
        playerName: data.playerName,
        OR: [
          { parallelType: null },
          { parallelType: 'Base' },
        ],
      },
    });

    if (card) {
      console.log(`  #${card.cardNumber} ${card.playerName}: parallel=${card.parallelType}, serial=${card.serialNumber}, printRun=${card.printRun}`);
    } else {
      console.log(`  #${data.cardNumber} ${data.playerName}: NOT FOUND`);
    }
  }

  console.log('\nUPDATING...');

  // Simulate the API call
  let updated = 0;
  for (const data of testData) {
    const card = await prisma.card.findFirst({
      where: {
        setId: set.id,
        cardNumber: data.cardNumber,
        playerName: data.playerName,
        OR: [
          { parallelType: null },
          { parallelType: 'Base' },
        ],
      },
    });

    if (card) {
      await prisma.card.update({
        where: { id: card.id },
        data: {
          serialNumber: data.serialNumber,
          printRun: data.printRun,
          isNumbered: true,
        },
      });
      updated++;
      console.log(`  ✓ Updated #${data.cardNumber} ${data.playerName}`);
    }
  }

  console.log(`\nUpdated ${updated} cards\n`);

  // Show state after update
  console.log('AFTER UPDATE:');
  for (const data of testData) {
    const card = await prisma.card.findFirst({
      where: {
        setId: set.id,
        cardNumber: data.cardNumber,
        playerName: data.playerName,
        OR: [
          { parallelType: null },
          { parallelType: 'Base' },
        ],
      },
    });

    if (card) {
      console.log(`  #${card.cardNumber} ${card.playerName}: parallel=${card.parallelType}, serial=${card.serialNumber}, printRun=${card.printRun}`);
    }
  }

  await prisma.$disconnect();
}

testBaseUpdate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
