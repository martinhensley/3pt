import { prisma } from '../lib/prisma';

async function main() {
  const set = await prisma.set.findFirst({
    where: {
      name: 'Optic',
      release: {
        year: '2024-25',
        name: {
          contains: 'Donruss',
          mode: 'insensitive'
        }
      }
    },
    include: {
      cards: {
        select: {
          cardNumber: true,
          variant: true,
          parallelType: true
        },
        orderBy: { cardNumber: 'asc' },
        take: 20
      }
    }
  });

  console.log('First 20 cards in Optic set:');
  set?.cards.forEach(c => {
    console.log(`  #${c.cardNumber} - variant: ${c.variant || 'none'} - parallel: ${c.parallelType || 'null'}`);
  });

  // Check if there are duplicates
  const cardNumbers = await prisma.card.groupBy({
    by: ['cardNumber'],
    where: { setId: set?.id },
    _count: { cardNumber: true },
    orderBy: { _count: { cardNumber: 'desc' } },
    take: 10
  });

  console.log('\nCard numbers with most duplicates:');
  cardNumbers.forEach(cn => {
    console.log(`  #${cn.cardNumber}: ${cn._count.cardNumber} cards`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
