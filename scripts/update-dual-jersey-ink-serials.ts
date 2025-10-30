import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Card data with serial numbers from the checklist
const cardData = [
  { cardNumber: '2', playerName: 'Giovani Lo Celso', serialNumber: '/199', printRun: 199 },
  { cardNumber: '3', playerName: 'Lautaro Martinez', serialNumber: '/99', printRun: 99 },
  { cardNumber: '7', playerName: 'Antoine Griezmann', serialNumber: '/49', printRun: 49 },
  { cardNumber: '8', playerName: 'Reinildo Mandava', serialNumber: '/99', printRun: 99 },
  { cardNumber: '9', playerName: 'Rodrigo de Paul', serialNumber: '/199', printRun: 199 },
  { cardNumber: '10', playerName: 'Douglas Costa', serialNumber: '/12', printRun: 12 },
  { cardNumber: '11', playerName: 'Luiz Henrique', serialNumber: '/99', printRun: 99 },
  { cardNumber: '12', playerName: 'Marquinhos (D)', serialNumber: '/49', printRun: 49 },
  { cardNumber: '15', playerName: 'Harry Kane', serialNumber: '/25', printRun: 25 },
  { cardNumber: '16', playerName: 'Fermin Lopez', serialNumber: '/199', printRun: 199 },
  { cardNumber: '17', playerName: 'Marc Bernal', serialNumber: '/199', printRun: 199 },
  { cardNumber: '18', playerName: 'Pau Victor', serialNumber: '/199', printRun: 199 },
  { cardNumber: '19', playerName: 'Robert Lewandowski', serialNumber: '/25', printRun: 25 },
  { cardNumber: '20', playerName: 'Sergi Dominguez', serialNumber: '/199', printRun: 199 },
  { cardNumber: '21', playerName: 'Bradley Barcola', serialNumber: '/199', printRun: 199 },
  { cardNumber: '24', playerName: 'Moise Kean', serialNumber: '/199', printRun: 199 },
  { cardNumber: '25', playerName: 'Joan Martinez', serialNumber: null, printRun: null }, // NO BASE
  { cardNumber: '26', playerName: 'Kylian Mbappe', serialNumber: '/49', printRun: 49 },
  { cardNumber: '27', playerName: 'David Raya', serialNumber: '/199', printRun: 199 },
  { cardNumber: '28', playerName: 'Inigo Martinez', serialNumber: '/199', printRun: 199 },
  { cardNumber: '29', playerName: 'Paxten Aaronson', serialNumber: '/199', printRun: 199 },
  { cardNumber: '30', playerName: 'Timothy Weah', serialNumber: '/59', printRun: 59 },
  { cardNumber: '31', playerName: 'Lily Yohannes', serialNumber: '/199', printRun: 199 },
  { cardNumber: '32', playerName: 'Naomi Girma', serialNumber: '/117', printRun: 117 },
  { cardNumber: '33', playerName: 'Trinity Rodman', serialNumber: '/59', printRun: 59 },
];

async function updateDualJerseyInkSerials() {
  console.log('Updating Dual Jersey Ink base cards with serial numbers...\n');

  // Find the Dual Jersey Ink set
  const set = await prisma.set.findFirst({
    where: {
      name: 'Dual Jersey Ink',
      release: {
        slug: '2024-25-panini-obsidian-soccer',
      },
    },
    include: {
      cards: true,
    },
  });

  if (!set) {
    console.error('Dual Jersey Ink set not found!');
    return;
  }

  console.log(`Found set: ${set.name} with ${set.cards.length} cards\n`);

  let updatedCount = 0;

  for (const data of cardData) {
    // Find the BASE card by card number and player name (parallelType: null)
    const card = set.cards.find(
      (c) => c.cardNumber === data.cardNumber && c.playerName === data.playerName && c.parallelType === null
    );

    if (!card) {
      console.log(`❌ Card not found: ${data.cardNumber} ${data.playerName}`);
      continue;
    }

    // Update the card with serial number and print run
    await prisma.card.update({
      where: { id: card.id },
      data: {
        serialNumber: data.serialNumber,
        printRun: data.printRun,
        isNumbered: data.printRun ? true : false,
      },
    });

    console.log(`✓ Updated: ${data.cardNumber} ${data.playerName} ${data.serialNumber || '(NO BASE)'}`);
    updatedCount++;
  }

  console.log(`\n✅ Updated ${updatedCount} cards`);
}

updateDualJerseyInkSerials()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
