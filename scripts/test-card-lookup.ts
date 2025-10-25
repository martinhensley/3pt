import { prisma } from '../lib/prisma';

async function main() {
  // Test the exact slug that should work
  const slug = '2024-25-donruss-soccer-optic-200-mikayil-faye-gold-power-1of1';

  console.log('Testing slug:', slug);

  // Fetch all cards with their relationships - specifically from Optic set
  const cards = await prisma.card.findMany({
    where: {
      cardNumber: '200',
      playerName: {
        contains: 'Faye',
        mode: 'insensitive'
      },
      set: {
        name: 'Optic',
        release: {
          year: '2024-25'
        }
      }
    },
    include: {
      set: {
        include: {
          release: {
            include: {
              manufacturer: true,
            },
          },
        },
      },
    },
    take: 5
  });

  console.log('\nFound', cards.length, 'cards matching #200 Faye');

  cards.forEach(c => {
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
    } else if (c.variant && c.variant.toLowerCase() !== 'base') {
      cardSlugParts.push(c.variant);
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

    console.log('\nCard:', c.playerName, '#' + c.cardNumber);
    console.log('  Set:', c.set.name);
    console.log('  ParallelType:', c.parallelType);
    console.log('  Generated slug:', generatedSlug);
    console.log('  Match?', generatedSlug === slug);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
