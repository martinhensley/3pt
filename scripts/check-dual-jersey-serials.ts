import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDualJerseySerials() {
  const set = await prisma.set.findFirst({
    where: {
      name: 'Dual Jersey Ink',
      release: {
        slug: '2024-25-panini-obsidian-soccer'
      }
    },
    include: {
      cards: {
        where: {
          parallelType: null // Base cards only
        },
        take: 5,
        orderBy: {
          cardNumber: 'asc'
        }
      }
    }
  });

  if (!set) {
    console.log('Set not found');
    return;
  }

  console.log(`Set: ${set.name}`);
  console.log(`\nBase cards (first 5):`);

  set.cards.forEach(card => {
    console.log(`\nCard #${card.cardNumber} - ${card.playerName}`);
    console.log(`  Serial: ${card.serialNumber}`);
    console.log(`  Print Run: ${card.printRun}`);
    console.log(`  Is Numbered: ${card.isNumbered}`);
    console.log(`  Parallel Type: ${card.parallelType}`);
  });

  // Check parallel cards
  const parallelCards = await prisma.card.findMany({
    where: {
      setId: set.id,
      parallelType: {
        not: null
      }
    },
    take: 3,
    orderBy: {
      cardNumber: 'asc'
    }
  });

  console.log(`\n\nParallel cards (first 3):`);
  parallelCards.forEach(card => {
    console.log(`\nCard #${card.cardNumber} - ${card.playerName}`);
    console.log(`  Parallel Type: ${card.parallelType}`);
    console.log(`  Serial: ${card.serialNumber}`);
    console.log(`  Print Run: ${card.printRun}`);
  });

  await prisma.$disconnect();
}

checkDualJerseySerials();
