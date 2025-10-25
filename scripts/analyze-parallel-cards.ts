import { prisma } from '../lib/prisma';

async function main() {
  const opticSet = await prisma.set.findFirst({
    where: {
      name: 'Optic',
      release: {
        year: '2024-25',
        name: { contains: 'Donruss', mode: 'insensitive' }
      }
    },
    include: {
      _count: { select: { cards: true } }
    }
  });

  console.log('Optic Set:');
  console.log('  Total cards:', opticSet?._count.cards);
  console.log('  Parallels defined:', opticSet?.parallels);
  console.log('  Expected cards per parallel:', opticSet?.totalCards);

  // Check how many unique card numbers we have
  const uniqueCardNumbers = await prisma.card.groupBy({
    by: ['cardNumber'],
    where: { setId: opticSet?.id },
    _count: { cardNumber: true }
  });

  console.log('\nUnique card numbers:', uniqueCardNumbers.length);
  console.log('Total cards / unique numbers:', opticSet?._count.cards, '/', uniqueCardNumbers.length, '=', 
    opticSet?._count.cards ? Math.round(opticSet._count.cards / uniqueCardNumbers.length) : 0, 'cards per number');

  // The cards should be divided among the parallels
  const parallelsCount = Array.isArray(opticSet?.parallels) ? opticSet.parallels.length : 0;
  console.log('Number of parallels:', parallelsCount);
  console.log('Expected: base checklist has', opticSet?.totalCards, 'cards × ', parallelsCount, 'parallels =', 
    Number(opticSet?.totalCards || 0) * parallelsCount, 'total cards');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
