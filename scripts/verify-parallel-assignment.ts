import { prisma } from '../lib/prisma';

async function main() {
  // Check Gold Power 1 of 1 cards
  const goldPowerCards = await prisma.card.findMany({
    where: {
      parallelType: 'Gold Power – 1 of 1',
      set: {
        name: 'Optic',
        release: {
          year: '2024-25'
        }
      }
    },
    select: {
      id: true,
      cardNumber: true,
      playerName: true,
      parallelType: true
    },
    orderBy: { cardNumber: 'asc' },
    take: 5
  });

  console.log('Gold Power – 1 of 1 cards (first 5):');
  goldPowerCards.forEach(c => {
    console.log(`  #${c.cardNumber} ${c.playerName} - ${c.parallelType}`);
  });

  // Count cards by parallel type
  const counts = await prisma.card.groupBy({
    by: ['parallelType'],
    where: {
      set: {
        name: 'Optic',
        release: { year: '2024-25' }
      }
    },
    _count: { parallelType: true }
  });

  console.log('\nCards per parallel type:');
  counts.forEach(c => {
    console.log(`  ${c.parallelType}: ${c._count.parallelType} cards`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
