import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBaseSetCards() {
  // Get the Base Set ID first
  const baseSet = await prisma.set.findFirst({
    where: {
      name: {
        contains: 'Base',
        mode: 'insensitive'
      },
      release: {
        year: '2024-25',
        name: {
          contains: 'Donruss Soccer',
          mode: 'insensitive'
        }
      }
    }
  });

  if (!baseSet) {
    console.log('Base Set not found');
    await prisma.$disconnect();
    return;
  }

  console.log('Base Set ID:', baseSet.id);
  console.log('Base Set name:', baseSet.name);

  // Count total cards
  const totalCards = await prisma.card.count({
    where: { setId: baseSet.id }
  });
  console.log('\nTotal cards in Base Set:', totalCards);

  // Count cards with null parallelType
  const nullParallelCards = await prisma.card.count({
    where: {
      setId: baseSet.id,
      parallelType: null
    }
  });
  console.log('Cards with null parallelType:', nullParallelCards);

  // Count cards with non-null parallelType
  const nonNullParallelCards = await prisma.card.count({
    where: {
      setId: baseSet.id,
      parallelType: { not: null }
    }
  });
  console.log('Cards with non-null parallelType:', nonNullParallelCards);

  // Get unique parallel types
  const cards = await prisma.card.findMany({
    where: { setId: baseSet.id },
    select: { parallelType: true },
    distinct: ['parallelType']
  });

  console.log('\nUnique parallel types in database:');
  cards.forEach(card => {
    console.log('  -', card.parallelType || 'NULL');
  });

  await prisma.$disconnect();
}

checkBaseSetCards().catch(console.error);
