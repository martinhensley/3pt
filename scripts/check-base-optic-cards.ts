import { prisma } from '../lib/prisma';

async function checkBaseOpticCards() {
  // Find the 2024-25 Donruss Soccer release
  const release = await prisma.release.findUnique({
    where: { slug: '2024-25-panini-donruss-soccer' },
    include: {
      sets: {
        include: {
          cards: true,
        },
      },
    },
  });

  if (!release) {
    console.log('❌ Release not found');
    return;
  }

  console.log(`\n📦 Release: ${release.year} ${release.name}`);
  console.log(`📊 Total sets: ${release.sets.length}\n`);

  // Find the Base Optic set
  const baseOpticSet = release.sets.find(
    set => set.name.toLowerCase() === 'base optic' || set.name.toLowerCase() === 'optic base'
  );

  if (!baseOpticSet) {
    console.log('❌ Base Optic set not found');
    console.log('Available sets:');
    release.sets.forEach(set => {
      console.log(`  - ${set.name} (${set.cards.length} cards)`);
    });
    return;
  }

  console.log(`✅ Found set: "${baseOpticSet.name}"`);
  console.log(`   Set ID: ${baseOpticSet.id}`);
  console.log(`   Total Cards (metadata): ${baseOpticSet.totalCards || 'not set'}`);
  console.log(`   Actual Cards in DB: ${baseOpticSet.cards.length}`);
  console.log(`   Parallels: ${baseOpticSet.parallels?.length || 0}\n`);

  if (baseOpticSet.cards.length > 0) {
    console.log(`📋 Sample cards (first 5):`);
    baseOpticSet.cards.slice(0, 5).forEach(card => {
      console.log(`   #${card.cardNumber || '?'} - ${card.playerName || 'Unknown'} ${card.team ? `(${card.team})` : ''}`);
    });
  } else {
    console.log('⚠️  No cards found in database for this set!');
    console.log('   This is likely why your 200-card checklist paste didn\'t save.');
  }

  await prisma.$disconnect();
}

checkBaseOpticCards().catch(console.error);
