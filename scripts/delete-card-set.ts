import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the "CARD" set
    const cardSet = await prisma.set.findFirst({
      where: {
        name: 'CARD'
      },
      include: {
        cards: true,
        release: {
          include: {
            manufacturer: true
          }
        }
      }
    });

    if (!cardSet) {
      console.log('No set named "CARD" found.');
      return;
    }

    console.log('\n=== Found Erroneous Set ===');
    console.log(`ID: ${cardSet.id}`);
    console.log(`Name: ${cardSet.name}`);
    console.log(`Slug: ${cardSet.slug}`);
    console.log(`Type: ${cardSet.type}`);
    console.log(`Release: ${cardSet.release.year} ${cardSet.release.manufacturer.name} ${cardSet.release.name}`);
    console.log(`Cards: ${cardSet.cards.length}`);

    if (cardSet.cards.length > 0) {
      console.log('\nCards in this set:');
      cardSet.cards.forEach(card => {
        console.log(`  - ${card.playerName || 'Unknown'} - ${card.cardNumber || 'N/A'}`);
      });
    }

    // Delete the set (this will cascade delete cards due to onDelete: Cascade)
    console.log('\n=== Deleting Set ===');
    const deleted = await prisma.set.delete({
      where: {
        id: cardSet.id
      }
    });

    console.log(`✓ Deleted set: ${deleted.name}`);
    console.log(`✓ This also deleted ${cardSet.cards.length} card(s) due to cascade delete`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
