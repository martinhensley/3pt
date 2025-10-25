import { prisma } from '../lib/prisma';

async function main() {
  // Find the Optic set
  const opticSet = await prisma.set.findFirst({
    where: {
      name: 'Optic',
      release: {
        year: '2024-25',
        name: {
          contains: 'Donruss',
          mode: 'insensitive'
        }
      }
    }
  });

  console.log('Optic Set ID:', opticSet?.id);

  // Find card #200 in the Optic set
  const card = await prisma.card.findFirst({
    where: {
      setId: opticSet?.id,
      cardNumber: '200'
    },
    include: {
      set: {
        include: {
          release: {
            include: {
              manufacturer: true
            }
          }
        }
      }
    }
  });

  if (!card) {
    console.log('Card #200 not found in Optic set');
    
    // Count total cards in Optic set
    const count = await prisma.card.count({
      where: { setId: opticSet?.id }
    });
    console.log('Total cards in Optic set:', count);
    
    return;
  }

  console.log('\nCard info:');
  console.log('  Player:', card.playerName);
  console.log('  Number:', card.cardNumber);
  console.log('  Set:', card.set.name);
  console.log('  ParallelType:', card.parallelType);
  console.log('  Variant:', card.variant);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
