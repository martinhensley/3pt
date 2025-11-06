import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Creating parallel card records for Obsidian...\n');

  // Find the Obsidian Base parent set
  const parentSet = await prisma.set.findUnique({
    where: { slug: '2024-25-obsidian-soccer-obsidian-base' },
    include: {
      parallelSets: {
        orderBy: { name: 'asc' },
      },
      cards: {
        orderBy: { cardNumber: 'asc' },
      },
    },
  });

  if (!parentSet) {
    console.error('❌ Parent set not found');
    return;
  }

  console.log(`📦 Parent Set: ${parentSet.name}`);
  console.log(`   Cards: ${parentSet.cards.length}`);
  console.log(`   Parallels: ${parentSet.parallelSets.length}\n`);

  let totalCreated = 0;
  let totalSkipped = 0;

  // For each parallel set
  for (const parallelSet of parentSet.parallelSets) {
    console.log(`\n🎨 Processing parallel: ${parallelSet.name} (/${parallelSet.printRun || '∞'})`);
    console.log(`   Set ID: ${parallelSet.id}`);
    console.log(`   Slug: ${parallelSet.slug}`);

    let createdInParallel = 0;
    let skippedInParallel = 0;

    // For each base card, create a parallel version
    for (const baseCard of parentSet.cards) {
      // Generate parallel card slug
      // Base: "2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham"
      // Parallel: "2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-electric-etch-green-5"

      const parallelSuffix = parallelSet.printRun
        ? `${parallelSet.name} /${parallelSet.printRun}`
        : parallelSet.name;

      const parallelSlug = `${baseCard.slug}-${parallelSuffix}`
        .toLowerCase()
        .replace(/\s*\/\s*(\d+)/g, '-$1')  // Convert " /5" to "-5"
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if parallel card already exists
      const existingCard = await prisma.card.findUnique({
        where: { slug: parallelSlug },
      });

      if (existingCard) {
        skippedInParallel++;
        continue;
      }

      // Create parallel card
      try {
        await prisma.card.create({
          data: {
            slug: parallelSlug,
            playerName: baseCard.playerName,
            team: baseCard.team?.replace(/\/\d+$/, `/${parallelSet.printRun || '∞'}`), // Update print run in team
            cardNumber: baseCard.cardNumber,
            variant: baseCard.variant,
            parallelType: parallelSet.name, // Set parallel type to parallel set name
            serialNumber: baseCard.serialNumber,
            isNumbered: parallelSet.printRun ? true : false,
            printRun: parallelSet.printRun,
            numbered: parallelSet.printRun ? `/${parallelSet.printRun}` : null,
            rarity: baseCard.rarity,
            finish: baseCard.finish,
            hasAutograph: baseCard.hasAutograph,
            hasMemorabilia: baseCard.hasMemorabilia,
            specialFeatures: baseCard.specialFeatures,
            colorVariant: baseCard.colorVariant,
            detectionConfidence: baseCard.detectionConfidence,
            detectionMethods: baseCard.detectionMethods,
            detectedText: baseCard.detectedText,
            imageFront: baseCard.imageFront,
            imageBack: baseCard.imageBack,
            footyNotes: baseCard.footyNotes,
            setId: parallelSet.id, // Link to parallel set, not parent set
          },
        });
        createdInParallel++;
      } catch (error) {
        console.error(`   ❌ Failed to create card for ${baseCard.playerName}:`, error);
      }
    }

    totalCreated += createdInParallel;
    totalSkipped += skippedInParallel;

    console.log(`   ✅ Created: ${createdInParallel}`);
    console.log(`   ⏭️  Skipped: ${skippedInParallel}`);
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`\n✨ Card creation complete!`);
  console.log(`   Created: ${totalCreated}`);
  console.log(`   Skipped: ${totalSkipped}`);
  console.log(`   Total parallel sets: ${parentSet.parallelSets.length}`);
  console.log(`   Total base cards: ${parentSet.cards.length}`);
  console.log(`   Expected total: ${parentSet.parallelSets.length * parentSet.cards.length}`);
  console.log();
}

main()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
