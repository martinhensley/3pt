import { prisma } from '@/lib/prisma';

async function check1of1Format() {
  try {
    // Find cards with "1 of 1" or "1/1" in parallelType
    const cards = await prisma.card.findMany({
      where: {
        OR: [
          { parallelType: { contains: '1 of 1', mode: 'insensitive' } },
          { parallelType: { contains: '1/1' } },
        ],
      },
      select: {
        id: true,
        playerName: true,
        parallelType: true,
      },
      take: 5,
    });

    console.log('Cards with 1 of 1 / 1/1:');
    console.log('Count:', cards.length);
    cards.forEach((card) => {
      console.log(`  - ${card.playerName}: "${card.parallelType}"`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check1of1Format();
