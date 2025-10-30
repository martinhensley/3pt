import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDualJerseyParallels() {
  console.log('Checking Dual Jersey Ink parallel cards...\n');

  const set = await prisma.set.findFirst({
    where: {
      name: 'Dual Jersey Ink',
      release: {
        slug: '2024-25-panini-obsidian-soccer'
      }
    },
    include: {
      cards: {
        orderBy: [
          { parallelType: 'asc' },
          { cardNumber: 'asc' }
        ]
      }
    }
  });

  if (!set) {
    console.log('Set not found');
    return;
  }

  console.log(`Set: ${set.name}`);
  console.log(`Total cards: ${set.cards.length}\n`);

  // Group cards by parallel type
  const cardsByParallel = new Map<string, typeof set.cards>();

  for (const card of set.cards) {
    const parallelKey = card.parallelType || 'BASE';
    if (!cardsByParallel.has(parallelKey)) {
      cardsByParallel.set(parallelKey, []);
    }
    cardsByParallel.get(parallelKey)!.push(card);
  }

  // Show summary by parallel
  console.log('Cards by parallel type:\n');
  for (const [parallel, cards] of Array.from(cardsByParallel.entries()).sort()) {
    console.log(`${parallel}: ${cards.length} cards`);

    // Show first 3 cards as sample
    console.log('  Sample cards:');
    cards.slice(0, 3).forEach(card => {
      console.log(`    #${card.cardNumber} ${card.playerName} - Serial: ${card.serialNumber || 'none'}, PrintRun: ${card.printRun || 'none'}`);
    });
    console.log('');
  }

  // Check for Electric Etch Orange specifically
  const orangeCards = set.cards.filter(c =>
    c.parallelType?.includes('Electric Etch Orange')
  );

  if (orangeCards.length > 0) {
    console.log(`\nElectric Etch Orange cards: ${orangeCards.length}`);
    console.log('First 5:');
    orangeCards.slice(0, 5).forEach(card => {
      console.log(`  #${card.cardNumber} ${card.playerName}`);
      console.log(`    ParallelType: ${card.parallelType}`);
      console.log(`    Serial: ${card.serialNumber}, PrintRun: ${card.printRun}`);
    });
  }

  await prisma.$disconnect();
}

checkDualJerseyParallels();
