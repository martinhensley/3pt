import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGiovaniCard() {
  console.log('Checking Giovani Lo Celso #2 card...\n');

  // Find all cards for Giovani Lo Celso #2 in Dual Jersey Ink
  const cards = await prisma.card.findMany({
    where: {
      cardNumber: '2',
      playerName: 'Giovani Lo Celso',
      set: {
        name: 'Dual Jersey Ink',
        release: {
          slug: '2024-25-panini-obsidian-soccer',
        },
      },
    },
    include: {
      set: true,
    },
    orderBy: {
      parallelType: 'asc',
    },
  });

  console.log(`Found ${cards.length} cards for Giovani Lo Celso #2:\n`);

  for (const card of cards) {
    console.log(`Parallel: ${card.parallelType || 'null'}`);
    console.log(`  Serial: ${card.serialNumber || 'none'}`);
    console.log(`  PrintRun: ${card.printRun || 'none'}`);
    console.log(`  Slug: ${card.slug}`);
    console.log('');
  }

  await prisma.$disconnect();
}

checkGiovaniCard()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
