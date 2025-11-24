import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCollegeFix() {
  try {
    console.log('=== Verification of College Ticket Fix ===\n');

    const setsToCheck = [
      'College Ticket',
      'College Ticket Variation',
      'College Championship Ticket',
      'College Championship Ticket Variation',
      'College Cracked Ice Ticket',
      'College Cracked Ice Ticket Variation',
      'College Draft Ticket',
      'College Draft Ticket Variation',
      'College Draft Ticket Blue Foil',
      'College Draft Ticket Red Foil',
      'College Draft Ticket Variation Blue Foil',
      'College Draft Ticket Variation Red Foil',
      'College Playoff Ticket',
      'College Playoff Ticket Variation',
      'College Ticket Printing Plate - Black',
      'College Ticket Printing Plate - Cyan',
      'College Ticket Printing Plate - Magenta',
      'College Ticket Printing Plate - Yellow',
      'College Ticket Printing Plate Black Variation',
      'College Ticket Printing Plate Cyan Variation',
      'College Ticket Printing Plate Magenta Variation',
      'College Ticket Printing Plate Yellow Variation'
    ];

    for (const setName of setsToCheck) {
      const cards = await prisma.card.findMany({
        where: {
          set: {
            name: setName,
            release: { slug: '2016-panini-contenders-draft-picks-basketball' }
          }
        },
        select: { cardNumber: true },
        orderBy: { cardNumber: 'asc' }
      });

      if (cards.length === 0) {
        console.log(`${setName}: 0 cards (EMPTY)`);
      } else {
        const range = `${cards[0].cardNumber}-${cards[cards.length - 1].cardNumber}`;
        console.log(`${setName}: ${cards.length} cards (${range})`);
      }
    }

    console.log('\n=== Summary ===');
    console.log('Expected state:');
    console.log('✅ Non-variation parallel sets (Championship, Cracked Ice, Draft, Playoff): 0 cards');
    console.log('✅ Variation parallel sets (Championship, Cracked Ice, Draft, Playoff): 75 cards (102-184)');
    console.log('✅ Printing Plate sets (NOT Variation): 75 cards (102-184)');
    console.log('✅ Draft Ticket Blue/Red Foil (NOT Variation): 75 cards (102-184)');
    console.log('❌ Empty Variation sets should be deleted: Printing Plates Variation, Draft Foil Variation');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCollegeFix();
