import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOpticParallel() {
  console.log('Finding Optic cards with incorrect parallel type...\n');

  // Find all cards in Optic set with parallelType = "Optic"
  const cards = await prisma.card.findMany({
    where: {
      set: {
        name: {
          contains: 'Optic',
          mode: 'insensitive'
        }
      },
      parallelType: 'Optic'
    },
    include: {
      set: {
        include: {
          release: true
        }
      }
    }
  });

  console.log(`Found ${cards.length} Optic cards with parallelType = 'Optic'\n`);

  if (cards.length === 0) {
    console.log('No cards to fix!');
    await prisma.$disconnect();
    return;
  }

  // Show sample
  console.log('Sample cards to fix:');
  cards.slice(0, 5).forEach(card => {
    console.log(`  - ${card.playerName} #${card.cardNumber} (${card.set.release.name} - ${card.set.name})`);
  });

  console.log('\nUpdating cards...\n');

  // Update all these cards to have null parallelType (base cards)
  const result = await prisma.card.updateMany({
    where: {
      set: {
        name: {
          contains: 'Optic',
          mode: 'insensitive'
        }
      },
      parallelType: 'Optic'
    },
    data: {
      parallelType: null
    }
  });

  console.log(`✅ Successfully updated ${result.count} cards!`);
  console.log('\nThese cards are now marked as base Optic cards (no parallel type).');

  await prisma.$disconnect();
}

fixOpticParallel().catch(console.error);
