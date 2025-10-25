import { prisma } from '../lib/prisma';

async function main() {
  const cards = await prisma.card.findMany({
    where: {
      cardNumber: '200',
      playerName: { contains: 'Faye', mode: 'insensitive' },
      parallelType: 'Gold Power – 1 of 1',
      set: {
        name: 'Optic',
        release: { year: '2024-25' }
      }
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

  console.log('Found', cards.length, 'Gold Power – 1 of 1 cards for #200 Faye');

  if (cards.length > 0) {
    const c = cards[0];
    console.log('\nCard details:');
    console.log('  Player:', c.playerName);
    console.log('  Set:', c.set.name);
    console.log('  Release:', c.set.release.year, c.set.release.name);
    console.log('  ParallelType:', c.parallelType);
    console.log('  Card ID:', c.id);

    // Generate slug
    const cleanSetName = c.set.name
      .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
      .replace(/\boptic\s+base\b/gi, 'Optic')
      .replace(/\bbase\s+set\b/gi, '')
      .replace(/\bsets?\b/gi, '')
      .trim();

    const cardSlugParts = [
      c.set.release.year,
      c.set.release.name,
      cleanSetName,
      c.cardNumber || '',
      c.playerName || 'unknown',
    ];

    if (c.parallelType && c.parallelType.toLowerCase() !== 'base') {
      cardSlugParts.push(c.parallelType);
    }

    const generatedSlug = cardSlugParts
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .replace(/1-of-1/g, '1of1');

    console.log('\n  Generated slug:', generatedSlug);
    console.log('  Expected slug:  2024-25-donruss-soccer-optic-200-mikayil-faye-gold-power-1of1');
    console.log('  Match?', generatedSlug === '2024-25-donruss-soccer-optic-200-mikayil-faye-gold-power-1of1');
  } else {
    console.log('\nNo card found! Checking all #200 Faye cards in Optic set:');

    const allCards = await prisma.card.findMany({
      where: {
        cardNumber: '200',
        playerName: { contains: 'Faye', mode: 'insensitive' },
        set: {
          name: 'Optic',
          release: { year: '2024-25' }
        }
      },
      select: {
        parallelType: true
      }
    });

    console.log('Total cards found:', allCards.length);
    console.log('Parallel types:', [...new Set(allCards.map(c => c.parallelType))].join(', '));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
