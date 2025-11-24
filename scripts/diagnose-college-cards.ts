import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseCollegeCards() {
  try {
    // Get all cards from both Championship Ticket sets
    const allCards = await prisma.card.findMany({
      where: {
        OR: [
          { set: { name: 'College Championship Ticket' } },
          { set: { name: 'College Championship Ticket Variation' } }
        ],
        set: {
          release: { slug: '2016-panini-contenders-draft-picks-basketball' }
        }
      },
      select: {
        cardNumber: true,
        playerName: true,
        set: { select: { name: true } }
      },
      orderBy: { cardNumber: 'asc' }
    });

    console.log('Total cards:', allCards.length);
    console.log('\nCards by set:');

    const nonVariation = allCards.filter(c => !c.set.name.includes('Variation'));
    const variation = allCards.filter(c => c.set.name.includes('Variation'));

    console.log(`Non-Variation: ${nonVariation.length} cards`);
    if (nonVariation.length > 0) {
      console.log(`  Range: ${nonVariation[0].cardNumber} - ${nonVariation[nonVariation.length-1].cardNumber}`);
      console.log(`  Numbers:`, nonVariation.map(c => c.cardNumber).join(', '));
    }

    console.log(`\nVariation: ${variation.length} cards`);
    if (variation.length > 0) {
      console.log(`  Range: ${variation[0].cardNumber} - ${variation[variation.length-1].cardNumber}`);
      console.log(`  Numbers:`, variation.map(c => c.cardNumber).join(', '));
    }

    // Check if there's a pattern
    console.log('\n=== Analysis ===');
    const allNumbers = allCards.map(c => parseInt(c.cardNumber)).sort((a, b) => a - b);
    console.log('All card numbers present:', allNumbers.join(', '));

    // Find gaps
    const gaps = [];
    for (let i = 0; i < allNumbers.length - 1; i++) {
      if (allNumbers[i + 1] - allNumbers[i] > 1) {
        gaps.push(`${allNumbers[i]} to ${allNumbers[i + 1]}`);
      }
    }
    console.log('Gaps in numbering:', gaps.join(', ') || 'None');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseCollegeCards();
