import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function debugBaseCards() {
  // Find the Base set
  const baseSets = await prisma.set.findMany({
    where: {
      name: {
        contains: 'Base',
        mode: 'insensitive'
      }
    },
    include: {
      release: {
        include: { manufacturer: true }
      }
    }
  });

  console.log('\n=== Found Base Sets ===');
  baseSets.forEach(set => {
    console.log(`- ${set.release.year} ${set.release.manufacturer.name} ${set.release.name} - ${set.name} (ID: ${set.id})`);
  });

  // Find cards in Base sets
  const baseSetIds = baseSets.map(s => s.id);

  console.log('\n=== Looking for Balogun #4 in Base sets ===');
  const balogun = await prisma.card.findMany({
    where: {
      AND: [
        { setId: { in: baseSetIds } },
        { playerName: { contains: 'Balogun', mode: 'insensitive' } },
        { cardNumber: '4' }
      ]
    },
    include: {
      set: {
        include: {
          release: {
            include: { manufacturer: true }
          }
        }
      }
    }
  });

  if (balogun.length > 0) {
    balogun.forEach(card => {
      console.log('\nFound Balogun card:');
      console.log('- Player:', card.playerName);
      console.log('- Card #:', card.cardNumber);
      console.log('- Parallel:', card.parallelType);
      console.log('- Variant:', card.variant);
      console.log('- Color Variant:', card.colorVariant);
      console.log('- Print Run:', card.printRun);
      console.log('- Is Numbered:', card.isNumbered);
      console.log('- Set:', card.set.name);
      console.log('- Release:', card.set.release.name);
      console.log('- Year:', card.set.release.year);
    });
  } else {
    console.log('No Balogun #4 found in Base sets');
  }

  console.log('\n=== Looking for Tyler Adams #5 in Base sets ===');
  const adams = await prisma.card.findMany({
    where: {
      AND: [
        { setId: { in: baseSetIds } },
        { playerName: { contains: 'Adams', mode: 'insensitive' } },
        { cardNumber: '5' }
      ]
    },
    include: {
      set: {
        include: {
          release: {
            include: { manufacturer: true }
          }
        }
      }
    }
  });

  if (adams.length > 0) {
    adams.forEach(card => {
      console.log('\nFound Adams card:');
      console.log('- Player:', card.playerName);
      console.log('- Card #:', card.cardNumber);
      console.log('- Parallel:', card.parallelType);
      console.log('- Variant:', card.variant);
      console.log('- Color Variant:', card.colorVariant);
      console.log('- Print Run:', card.printRun);
      console.log('- Is Numbered:', card.isNumbered);
      console.log('- Set:', card.set.name);
      console.log('- Release:', card.set.release.name);
      console.log('- Year:', card.set.release.year);
    });
  } else {
    console.log('No Tyler Adams #5 found in Base sets');
  }

  // Check what parallels exist for these cards
  console.log('\n=== All Balogun #4 cards (any set, any parallel) ===');
  const allBalogun = await prisma.card.findMany({
    where: {
      AND: [
        { playerName: { contains: 'Balogun', mode: 'insensitive' } },
        { cardNumber: '4' }
      ]
    },
    include: {
      set: {
        include: {
          release: {
            include: { manufacturer: true }
          }
        }
      }
    },
    take: 20
  });

  allBalogun.forEach(card => {
    console.log(`- ${card.set.name} | Parallel: ${card.parallelType || 'none'} | Player: ${card.playerName}`);
  });

  await prisma.$disconnect();
}

debugBaseCards().catch(console.error);
