import { prisma } from '../lib/prisma';

async function main() {
  // Find a Gold Power 1 of 1 card
  const card = await prisma.card.findFirst({
    where: {
      cardNumber: '200',
      playerName: {
        contains: 'Faye',
        mode: 'insensitive'
      }
    },
    include: {
      set: {
        include: {
          release: {
            include: {
              manufacturer: true
            }
          }
        }
      }
    }
  });

  if (!card) {
    console.log('Card not found in database');
    return;
  }

  console.log('Card info:');
  console.log('  Player:', card.playerName);
  console.log('  Number:', card.cardNumber);
  console.log('  Set:', card.set.name);
  console.log('  Release:', card.set.release.name);
  console.log('  Year:', card.set.release.year);
  console.log('  ParallelType:', card.parallelType);
  console.log('  Variant:', card.variant);

  // Generate the slug as the API would
  const cleanSetName = card.set.name
    .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
    .replace(/\boptic\s+base\b/gi, 'Optic')
    .replace(/\bbase\s+set\b/gi, '')
    .replace(/\bsets?\b/gi, '')
    .trim();

  const cardSlugParts = [
    card.set.release.year,
    card.set.release.name,
    cleanSetName,
    card.cardNumber || '',
    card.playerName || 'unknown',
  ];

  // Add parallel/variant if not base
  if (card.parallelType && card.parallelType.toLowerCase() !== 'base') {
    cardSlugParts.push(card.parallelType);
  } else if (card.variant && card.variant.toLowerCase() !== 'base') {
    cardSlugParts.push(card.variant);
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

  console.log('\nGenerated slug:', generatedSlug);
  console.log('Expected slug: 2024-25-donruss-soccer-optic-200-mikayil-faye-gold-power-1of1');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
