import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseCollegeTicketBase() {
  try {
    console.log('=== Understanding College Ticket Structure ===\n');

    // Get the two sets
    const collegeTicket = await prisma.set.findFirst({
      where: {
        name: 'College Ticket',
        release: { slug: '2016-panini-contenders-draft-picks-basketball' }
      },
      include: {
        cards: {
          orderBy: { cardNumber: 'asc' },
          select: { cardNumber: true, playerName: true }
        }
      }
    });

    const collegeTicketVariation = await prisma.set.findFirst({
      where: {
        name: 'College Ticket Variation',
        release: { slug: '2016-panini-contenders-draft-picks-basketball' }
      },
      include: {
        cards: {
          orderBy: { cardNumber: 'asc' },
          select: { cardNumber: true, playerName: true }
        }
      }
    });

    console.log('College Ticket:');
    console.log(`  Total: ${collegeTicket?.cards.length || 0} cards`);
    if (collegeTicket && collegeTicket.cards.length > 0) {
      console.log(`  Range: ${collegeTicket.cards[0].cardNumber} - ${collegeTicket.cards[collegeTicket.cards.length - 1].cardNumber}`);
      console.log(`  Card numbers: ${collegeTicket.cards.map(c => c.cardNumber).join(', ')}`);
    }

    console.log('\nCollege Ticket Variation:');
    console.log(`  Total: ${collegeTicketVariation?.cards.length || 0} cards`);
    if (collegeTicketVariation && collegeTicketVariation.cards.length > 0) {
      console.log(`  Range: ${collegeTicketVariation.cards[0].cardNumber} - ${collegeTicketVariation.cards[collegeTicketVariation.cards.length - 1].cardNumber}`);
      console.log(`  Card numbers: ${collegeTicketVariation.cards.map(c => c.cardNumber).join(', ')}`);
    }

    // Check for overlap
    if (collegeTicket && collegeTicketVariation) {
      const ticketNums = new Set(collegeTicket.cards.map(c => c.cardNumber));
      const variationNums = new Set(collegeTicketVariation.cards.map(c => c.cardNumber));

      const overlap = collegeTicket.cards.filter(c => variationNums.has(c.cardNumber));
      const ticketOnly = collegeTicket.cards.filter(c => !variationNums.has(c.cardNumber));
      const variationOnly = collegeTicketVariation.cards.filter(c => !ticketNums.has(c.cardNumber));

      console.log('\n=== Overlap Analysis ===');
      console.log(`Overlapping cards (in BOTH sets): ${overlap.length}`);
      if (overlap.length > 0) {
        console.log(`  Example: ${overlap.slice(0, 3).map(c => `${c.cardNumber} - ${c.playerName}`).join(', ')}`);
      }

      console.log(`\nCollege Ticket ONLY: ${ticketOnly.length}`);
      if (ticketOnly.length > 0) {
        console.log(`  Range: ${ticketOnly[0].cardNumber} - ${ticketOnly[ticketOnly.length - 1].cardNumber}`);
        console.log(`  Numbers: ${ticketOnly.map(c => c.cardNumber).join(', ')}`);
      }

      console.log(`\nCollege Ticket Variation ONLY: ${variationOnly.length}`);
      if (variationOnly.length > 0) {
        console.log(`  Numbers: ${variationOnly.map(c => c.cardNumber).join(', ')}`);
      }
    }

    console.log('\n=== Recommendation ===');
    console.log('Based on the parallel pattern (Championship, Draft, Playoff all have 75 cards in Variation):');
    console.log('College Ticket Variation should have ALL cards 102-184 (75 cards total)');
    console.log('College Ticket (base) should have NO cards (it should be deleted or renamed)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseCollegeTicketBase();
