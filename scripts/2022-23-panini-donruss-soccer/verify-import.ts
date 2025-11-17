import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('✓ 2022-23 Donruss Soccer - Import Verification\n');

  // Get the release
  const release = await prisma.release.findUnique({
    where: { slug: '2022-23-panini-donruss-soccer' },
    include: {
      sets: {
        include: {
          _count: {
            select: { cards: true }
          }
        },
        orderBy: { name: 'asc' }
      },
      _count: {
        select: { sets: true }
      }
    }
  });

  if (!release) {
    throw new Error('Release not found');
  }

  console.log(`📦 Release: ${release.name} (${release.year})`);
  console.log(`   Slug: ${release.slug}\n`);

  // Count total cards
  const totalCards = await prisma.card.count({
    where: {
      set: { releaseId: release.id }
    }
  });

  console.log(`📊 Overall Stats:`);
  console.log(`   Total Sets: ${release._count.sets}`);
  console.log(`   Total Cards: ${totalCards}\n`);

  // Group sets by type
  const baseSets = release.sets.filter(s => s.type === 'Base');
  const insertSets = release.sets.filter(s => s.type === 'Insert');
  const autoSets = release.sets.filter(s => s.type === 'Autograph');
  const memSets = release.sets.filter(s => s.type === 'Memorabilia');

  console.log(`📋 Sets by Type:`);
  console.log(`   Base: ${baseSets.length}`);
  console.log(`   Insert: ${insertSets.length}`);
  console.log(`   Autograph: ${autoSets.length}`);
  console.log(`   Memorabilia: ${memSets.length}\n`);

  // Check Base/Optic sets for 200 cards
  console.log(`🔍 Base/Optic Set Verification:\n`);

  const baseSetCheck = [
    'Base Set',
    'Base Optic',
  ];

  for (const setName of baseSetCheck) {
    const set = release.sets.find(s => s.name === setName);
    if (set) {
      const cardCount = set._count.cards;
      const expected = 200;
      const status = cardCount === expected ? '✅' : '⚠️';
      console.log(`${status} ${setName}: ${cardCount} cards (expected ${expected})`);
    } else {
      console.log(`❌ ${setName}: NOT FOUND`);
    }
  }

  console.log('\n🔍 Remaining Rated Rookies Sets:\n');
  const remainingRR = release.sets.filter(s => s.name.startsWith('Rated Rookies'));
  if (remainingRR.length > 0) {
    console.log(`Found ${remainingRR.length} Rated Rookies sets that were not merged:`);
    for (const set of remainingRR) {
      console.log(`   - ${set.name} (${set._count.cards} cards)`);
    }
  } else {
    console.log('✅ All Rated Rookies sets successfully merged');
  }

  console.log('\n📝 Sample Sets by Type:\n');

  // Show first 5 sets of each type
  console.log('Base Sets (first 5):');
  baseSets.slice(0, 5).forEach(s => {
    console.log(`   - ${s.name} (${s._count.cards} cards)`);
  });

  console.log('\nInsert Sets (first 5):');
  insertSets.slice(0, 5).forEach(s => {
    console.log(`   - ${s.name} (${s._count.cards} cards)`);
  });

  console.log('\nAutograph Sets (first 5):');
  autoSets.slice(0, 5).forEach(s => {
    console.log(`   - ${s.name} (${s._count.cards} cards)`);
  });

  console.log('\nMemorabilia Sets (all):');
  memSets.forEach(s => {
    console.log(`   - ${s.name} (${s._count.cards} cards)`);
  });

  console.log('\n✅ Verification complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
