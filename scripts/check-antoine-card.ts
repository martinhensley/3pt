import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAntoineCard() {
  const card = await prisma.card.findFirst({
    where: {
      cardNumber: '7',
      playerName: 'Antoine Griezmann',
      set: {
        name: 'Dual Jersey Ink',
        release: {
          slug: '2024-25-panini-obsidian-soccer',
        },
      },
      OR: [
        { parallelType: null },
        { parallelType: 'Base' },
      ],
    },
  });

  if (card) {
    console.log('Antoine Griezmann #7 (Base):');
    console.log(`  parallelType: ${card.parallelType}`);
    console.log(`  serialNumber: ${card.serialNumber}`);
    console.log(`  printRun: ${card.printRun}`);
    console.log(`  numbered: ${card.numbered}`);
    console.log(`  isNumbered: ${card.isNumbered}`);
  } else {
    console.log('Card not found');
  }

  await prisma.$disconnect();
}

checkAntoineCard();
