import { prisma } from '../lib/prisma';

async function main() {
  // Test the exact slug from the screenshot
  const slug = '2024-25-obsidian-soccer-lightning-strike-8-aleix-garcia-electric-etch-gold-flood-5';

  console.log('🔍 Testing card lookup for slug:', slug);
  console.log('');

  // Test 1: Direct slug lookup
  console.log('Test 1: Direct slug lookup');
  const cardBySlug = await prisma.card.findUnique({
    where: { slug },
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

  if (cardBySlug) {
    console.log('✅ Card found by slug!');
    console.log('  Player:', cardBySlug.playerName);
    console.log('  Card #:', cardBySlug.cardNumber);
    console.log('  Variant:', cardBySlug.variant);
    console.log('  Parallel:', cardBySlug.parallelType);
    console.log('  Set:', cardBySlug.set.name);
  } else {
    console.log('❌ Card NOT found by slug');
  }

  console.log('');

  // Test 2: Search for Aleix Garcia cards
  console.log('Test 2: Search for similar cards (Aleix Garcia)');
  const similarCards = await prisma.card.findMany({
    where: {
      playerName: {
        contains: 'Garcia',
        mode: 'insensitive',
      },
    },
    include: {
      set: {
        include: {
          release: true,
        },
      },
    },
    take: 10,
  });

  console.log(`Found ${similarCards.length} cards with "Garcia" in player name:`);
  similarCards.forEach(c => {
    console.log(`  - ${c.playerName} #${c.cardNumber} (${c.set.release.name}) - slug: ${c.slug || 'NO SLUG'}`);
  });

  console.log('');

  // Test 3: Count cards with and without slugs
  console.log('Test 3: Slug statistics');
  const totalCards = await prisma.card.count();
  const cardsWithSlugs = await prisma.card.count({
    where: {
      slug: {
        not: null,
      },
    },
  });

  console.log(`Total cards: ${totalCards.toLocaleString()}`);
  console.log(`Cards with slugs: ${cardsWithSlugs.toLocaleString()}`);
  console.log(`Cards without slugs: ${(totalCards - cardsWithSlugs).toLocaleString()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
