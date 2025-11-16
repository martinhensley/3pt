import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.card.findMany({
    where: {
      set: {
        release: {
          slug: '2024-25-panini-donruss-soccer'
        }
      }
    },
    include: {
      set: true
    },
    orderBy: [
      { set: { name: 'asc' } },
      { cardNumber: 'asc' }
    ]
  });

  const nullPrintRunCards = cards.filter(c => c.printRun === null);
  const setBreakdown = new Map();
  
  nullPrintRunCards.forEach(card => {
    const setName = card.set.name;
    if (!setBreakdown.has(setName)) {
      setBreakdown.set(setName, {
        count: 0,
        setType: card.set.type,
        setPrintRun: card.set.printRun,
        sampleCards: []
      });
    }
    const data = setBreakdown.get(setName);
    data.count++;
    if (data.sampleCards.length < 3) {
      data.sampleCards.push({
        cardNumber: card.cardNumber,
        player: card.playerName,
        variant: card.variant
      });
    }
  });

  console.log('=== DONRUSS SOCCER - CARDS WITH NULL PRINT RUNS ===\n');
  console.log('Total cards with NULL printRun:', nullPrintRunCards.length);
  console.log('\nBreakdown by Set:\n');
  
  Array.from(setBreakdown.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([setName, data]) => {
      console.log('Set:', setName);
      console.log('  Type:', data.setType);
      console.log('  Set-level printRun:', data.setPrintRun);
      console.log('  Cards with NULL:', data.count);
      console.log('  Sample cards:', JSON.stringify(data.sampleCards, null, 2));
      console.log('---');
    });

  await prisma.$disconnect();
}

main();
