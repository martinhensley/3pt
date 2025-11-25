import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the release
  const release = await prisma.release.findFirst({
    where: {
      slug: '2016-panini-contenders-draft-picks-basketball'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sourceFiles: true
    }
  });

  if (!release) {
    console.log('Release not found');
    return;
  }

  console.log('=== RELEASE INFO ===');
  console.log('Name:', release.name);
  console.log('Slug:', release.slug);
  console.log('Source Files:', JSON.stringify(release.sourceFiles, null, 2));

  // Find all College Ticket sets
  const sets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      name: {
        contains: 'College Ticket'
      }
    },
    include: {
      _count: {
        select: { cards: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log('\n=== COLLEGE TICKET SETS ===');
  console.log(`Found ${sets.length} sets:\n`);

  sets.forEach(set => {
    const isVariation = set.name.includes('Variation');
    console.log(`${set.name}:`);
    console.log(`  - Cards: ${set._count.cards}`);
    console.log(`  - isParallel: ${set.isParallel}`);
    console.log(`  - printRun: ${set.printRun}`);
    console.log(`  - Type: ${isVariation ? 'VARIATION' : 'NON-VARIATION'}`);
    console.log(`  - Slug: ${set.slug}`);
    console.log('');
  });

  // Get sample cards from Blue Foil to understand structure
  console.log('\n=== SAMPLE CARDS FROM BLUE FOIL ===');
  const sampleCards = await prisma.card.findMany({
    where: {
      set: {
        name: 'College Draft Ticket Blue Foil',
        releaseId: release.id
      }
    },
    orderBy: {
      cardNumber: 'asc'
    },
    take: 10
  });

  sampleCards.forEach(card => {
    console.log(`${card.cardNumber}: ${card.playerName} - ${card.team || 'N/A'}`);
  });

  // Get card number ranges
  const allCards = await prisma.card.findMany({
    where: {
      set: {
        name: 'College Draft Ticket Blue Foil',
        releaseId: release.id
      }
    },
    select: {
      cardNumber: true
    },
    orderBy: {
      cardNumber: 'asc'
    }
  });

  const cardNumbers = allCards.map(c => parseInt(c.cardNumber || '0')).filter(n => n > 0).sort((a, b) => a - b);
  console.log('\n=== CARD NUMBER RANGE ===');
  console.log(`Min: ${cardNumbers[0]}, Max: ${cardNumbers[cardNumbers.length - 1]}`);
  console.log(`Unique numbers: ${new Set(cardNumbers).size}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
