import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SAMPLE RESTORED COLLEGE TICKET CARDS ===\n');

  const release = await prisma.release.findFirst({
    where: {
      slug: '2016-panini-contenders-draft-picks-basketball'
    }
  });

  if (!release) {
    throw new Error('Release not found');
  }

  // Get sample cards from newly created sets
  const newSets = [
    'College Ticket',
    'College Championship Ticket',
    'College Cracked Ice Ticket',
    'College Draft Ticket'
  ];

  for (const setName of newSets) {
    const set = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: setName
      },
      include: {
        cards: {
          orderBy: {
            cardNumber: 'asc'
          },
          take: 5
        }
      }
    });

    if (!set) {
      console.log(`Set not found: ${setName}\n`);
      continue;
    }

    console.log(`\n=== ${setName} ===`);
    console.log(`Slug: ${set.slug}`);
    console.log(`Type: ${set.type}`);
    console.log(`isParallel: ${set.isParallel}`);
    console.log(`printRun: ${set.printRun || 'null'}`);
    console.log(`Total cards: ${set.cards.length} (showing first 5)\n`);

    set.cards.forEach(card => {
      console.log(`  #${card.cardNumber}: ${card.playerName} - ${card.team}`);
      console.log(`    Slug: ${card.slug}`);
      console.log(`    hasAutograph: ${card.hasAutograph}`);
      console.log(`    isNumbered: ${card.isNumbered}`);
      console.log(`    printRun: ${card.printRun || 'null'}`);
      console.log(`    numbered: ${card.numbered || 'null'}`);
      console.log('');
    });
  }

  // Show card number distribution
  console.log('\n=== CARD NUMBER DISTRIBUTION ===\n');

  const baseSet = await prisma.set.findFirst({
    where: {
      releaseId: release.id,
      name: 'College Ticket'
    },
    include: {
      cards: {
        select: {
          cardNumber: true
        },
        orderBy: {
          cardNumber: 'asc'
        }
      }
    }
  });

  if (baseSet) {
    const numbers = baseSet.cards.map(c => parseInt(c.cardNumber || '0')).filter(n => n > 0);
    const missingNumbers = [];

    for (let i = 102; i <= 184; i++) {
      if (!numbers.includes(i)) {
        missingNumbers.push(i);
      }
    }

    console.log(`Total cards: ${numbers.length}`);
    console.log(`Range: ${numbers[0]}-${numbers[numbers.length - 1]}`);
    console.log(`Missing numbers: ${missingNumbers.join(', ')}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
