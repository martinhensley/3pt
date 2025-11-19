import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find all sets from Obsidian release with suspicious names
    const sets = await prisma.set.findMany({
      where: {
        release: {
          slug: '2024-25-panini-obsidian-soccer'
        },
        OR: [
          { name: 'CARD' },
          { name: { contains: 'CARD' } },
          { expectedCardCount: '1' }
        ]
      },
      include: {
        cards: true,
        release: {
          include: {
            manufacturer: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`\n=== Found ${sets.length} suspicious sets ===\n`);

    sets.forEach(set => {
      console.log(`ID: ${set.id}`);
      console.log(`Name: ${set.name}`);
      console.log(`Slug: ${set.slug}`);
      console.log(`Type: ${set.type}`);
      console.log(`Total Cards: ${set.expectedCardCount}`);
      console.log(`Actual Cards: ${set.cards.length}`);
      console.log(`Release: ${set.release.year} ${set.release.manufacturer.name} ${set.release.name}`);

      if (set.cards.length > 0) {
        console.log('Cards:');
        set.cards.forEach(card => {
          console.log(`  - ${card.playerName || 'Unknown'} (#${card.cardNumber || 'N/A'})`);
        });
      }
      console.log('---\n');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
