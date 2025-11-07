import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixObsidianBaseSlug() {
  try {
    console.log('Finding Obsidian Base set...');

    // Find the set with the incorrect slug
    const set = await prisma.set.findUnique({
      where: {
        slug: '2024-25-obsidian-soccer-obsidian-base'
      },
      include: {
        release: true,
        cards: true,
        parallelSets: true
      }
    });

    if (!set) {
      console.log('Set not found with slug: 2024-25-obsidian-soccer-obsidian-base');
      return;
    }

    console.log(`Found set: ${set.name}`);
    console.log(`Current slug: ${set.slug}`);
    console.log(`Cards in set: ${set.cards.length}`);
    console.log(`Parallel sets: ${set.parallelSets.length}`);

    const newSlug = '2024-25-obsidian-soccer-base';
    console.log(`New slug will be: ${newSlug}`);

    // Update the set slug
    await prisma.set.update({
      where: { id: set.id },
      data: { slug: newSlug }
    });

    console.log('✅ Updated set slug');

    // Update all card slugs that reference the old set slug
    const cardsToUpdate = set.cards.filter(card =>
      card.slug?.includes('obsidian-soccer-obsidian-base')
    );

    console.log(`Updating ${cardsToUpdate.length} card slugs...`);

    for (const card of cardsToUpdate) {
      if (card.slug) {
        const newCardSlug = card.slug.replace(
          '2024-25-obsidian-soccer-obsidian-base',
          '2024-25-obsidian-soccer-base'
        );

        await prisma.card.update({
          where: { id: card.id },
          data: { slug: newCardSlug }
        });

        console.log(`  ✅ Updated card ${card.cardNumber}: ${card.playerName}`);
      }
    }

    // Update parallel set parent references if needed
    console.log(`Checking ${set.parallelSets.length} parallel sets...`);
    for (const parallelSet of set.parallelSets) {
      console.log(`  Parallel set: ${parallelSet.name} (slug: ${parallelSet.slug})`);
    }

    console.log('\n✅ All done! The Obsidian Base set slug has been fixed.');
    console.log(`Old slug: 2024-25-obsidian-soccer-obsidian-base`);
    console.log(`New slug: ${newSlug}`);

  } catch (error) {
    console.error('Error fixing slug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixObsidianBaseSlug();
