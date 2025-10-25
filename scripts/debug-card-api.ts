import { prisma } from '../lib/prisma';

async function main() {
  const slug = '2024-25-donruss-soccer-optic-200-mikayil-faye-gold-power-1of1';

  console.log('Testing slug:', slug);

  // Extract info from slug to narrow down search
  const slugParts = slug.split('-');

  // Try to extract card number (find first part that's a number)
  let cardNumber: string | null = null;
  let playerNameParts: string[] = [];

  // Find the card number (should be a numeric value)
  for (let i = 0; i < slugParts.length; i++) {
    if (/^\d+$/.test(slugParts[i])) {
      cardNumber = slugParts[i];
      // Everything after the card number until we hit known parallel keywords
      playerNameParts = slugParts.slice(i + 1);
      break;
    }
  }

  console.log('Extracted card number:', cardNumber);
  console.log('Player name parts:', playerNameParts);

  if (!cardNumber) {
    console.log('ERROR: Could not extract card number from slug');
    return;
  }

  // Fetch cards matching the card number
  const cards = await prisma.card.findMany({
    where: {
      cardNumber: cardNumber
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
  });

  console.log('\nFound', cards.length, 'cards with card number', cardNumber);

  // Find the best matching card by generating slugs for each card
  let matchFound = false;
  cards.forEach((c, index) => {
    // Remove "base set" and "set/sets" patterns from set name, Optic-specific handling
    const cleanSetName = c.set.name
      .replace(/\boptic\s+base\s+set\b/gi, 'Optic') // Optic Base Set -> Optic
      .replace(/\boptic\s+base\b/gi, 'Optic') // Optic Base -> Optic
      .replace(/\bbase\s+set\b/gi, '') // Remove generic "base set"
      .replace(/\bsets?\b/gi, '') // Remove remaining "set/sets"
      .trim();

    const cardSlugParts = [
      c.set.release.year,
      c.set.release.name,
      cleanSetName,
      c.cardNumber || '',
      c.playerName || 'unknown',
    ];

    // Add parallel/variant if not base
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
      .replace(/1-of-1/g, '1of1'); // Convert "1-of-1" to "1of1"

    const isMatch = generatedSlug === slug;

    if (isMatch || index < 5) {
      console.log(`\nCard ${index + 1}:`, c.playerName, `(${c.set.name})`);
      console.log('  ParallelType:', c.parallelType);
      console.log('  Generated slug:', generatedSlug);
      console.log('  Match?', isMatch);

      if (isMatch) {
        matchFound = true;
        console.log('  ✓ MATCH FOUND!');
      }
    }
  });

  if (!matchFound) {
    console.log('\n❌ No matching card found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
