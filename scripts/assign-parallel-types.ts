import { prisma } from '../lib/prisma';

async function main() {
  const opticSet = await prisma.set.findFirst({
    where: {
      name: 'Optic',
      release: {
        year: '2024-25',
        name: { contains: 'Donruss', mode: 'insensitive' }
      }
    }
  });

  if (!opticSet) {
    console.log('Optic set not found');
    return;
  }

  const parallels = Array.isArray(opticSet.parallels) ? opticSet.parallels.filter((p): p is string => p !== null) : [];
  
  // Add "Optic" as the base parallel
  const allParallels = ['Optic', ...parallels];
  
  console.log('Assigning parallel types to cards...');
  console.log('Parallels to assign:', allParallels.length);

  // Get all cards grouped by card number
  const cards = await prisma.card.findMany({
    where: { setId: opticSet.id },
    orderBy: [
      { cardNumber: 'asc' },
      { id: 'asc' } // Consistent ordering
    ]
  });

  console.log('Total cards to process:', cards.length);

  // Group cards by card number
  const cardsByNumber = new Map<string, typeof cards>();
  cards.forEach(card => {
    const num = card.cardNumber || 'unknown';
    if (!cardsByNumber.has(num)) {
      cardsByNumber.set(num, []);
    }
    cardsByNumber.get(num)!.push(card);
  });

  console.log('Unique card numbers:', cardsByNumber.size);

  // Assign parallel types
  let updateCount = 0;
  for (const cardGroup of cardsByNumber.values()) {
    // Assign each card in the group to a parallel type in order
    for (let i = 0; i < cardGroup.length; i++) {
      const card = cardGroup[i];
      const parallelType = allParallels[i % allParallels.length];
      
      await prisma.card.update({
        where: { id: card.id },
        data: { parallelType }
      });
      
      updateCount++;
      if (updateCount % 100 === 0) {
        console.log(`Updated ${updateCount} cards...`);
      }
    }
  }

  console.log(`\nDone! Updated ${updateCount} cards with parallel types.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
