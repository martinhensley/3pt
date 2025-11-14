import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('FINAL DONRUSS SOCCER IMPORT VERIFICATION');
  console.log('='.repeat(80));

  const release = await prisma.release.findFirst({
    where: { slug: '2024-25-panini-donruss-soccer' },
    include: {
      sets: {
        include: {
          cards: {
            orderBy: { cardNumber: 'asc' }
          },
          parallelSets: true,
        }
      }
    },
  });

  if (!release) {
    console.error('Release not found!');
    return;
  }

  const parentSets = release.sets.filter(s => !s.parentSetId);
  const parallelSets = release.sets.filter(s => s.parentSetId);
  const totalCards = release.sets.reduce((sum, set) => sum + set.cards.length, 0);

  console.log('\n📊 OVERALL STATISTICS');
  console.log('-'.repeat(80));
  console.log(`Total Sets: ${release.sets.length}`);
  console.log(`  - Parent Sets: ${parentSets.length}`);
  console.log(`  - Parallel Sets: ${parallelSets.length}`);
  console.log(`Total Cards: ${totalCards} (stored on parent sets only)`);

  console.log('\n📚 SETS BY TYPE');
  console.log('-'.repeat(80));
  const byType = {
    Base: release.sets.filter(s => s.type === 'Base'),
    Insert: release.sets.filter(s => s.type === 'Insert'),
    Autograph: release.sets.filter(s => s.type === 'Autograph'),
    Memorabilia: release.sets.filter(s => s.type === 'Memorabilia'),
  };

  for (const [type, sets] of Object.entries(byType)) {
    const parents = sets.filter(s => !s.parentSetId);
    const parallels = sets.filter(s => s.parentSetId);
    console.log(`${type}: ${sets.length} total (${parents.length} parents + ${parallels.length} parallels)`);
  }

  console.log('\n⭐ KEY PARENT SETS');
  console.log('-'.repeat(80));
  const keySets = ['Base', 'Optic', 'Animation', 'Beautiful Game Autographs', 'Kit Kings'];

  for (const setName of keySets) {
    const set = parentSets.find(s => s.name === setName);
    if (set) {
      const parallelCount = set.parallelSets?.length || 0;
      const firstCard = set.cards[0]?.cardNumber || 'N/A';
      const lastCard = set.cards[set.cards.length - 1]?.cardNumber || 'N/A';

      console.log(`✅ ${setName} (${set.type})`);
      console.log(`   Cards: ${set.cards.length} (#${firstCard} - #${lastCard})`);
      console.log(`   Parallels: ${parallelCount}`);
      console.log(`   Slug: ${set.slug}`);
    } else {
      console.log(`❌ ${setName} - NOT FOUND`);
    }
  }

  console.log('\n🔍 BASE SET DETAILED CHECK');
  console.log('-'.repeat(80));
  const base = parentSets.find(s => s.name === 'Base');
  if (base) {
    console.log(`Name: ${base.name}`);
    console.log(`Type: ${base.type}`);
    console.log(`Cards: ${base.cards.length}`);
    console.log(`Parallels: ${base.parallelSets?.length || 0}`);

    // Check for cards 1-200
    const cardNumbers = base.cards.map(c => parseInt(c.cardNumber || '0')).filter(n => !isNaN(n));
    const min = Math.min(...cardNumbers);
    const max = Math.max(...cardNumbers);
    console.log(`Card number range: ${min} - ${max}`);

    // Check if all 200 cards are present
    const missing = [];
    for (let i = 1; i <= 200; i++) {
      if (!cardNumbers.includes(i)) {
        missing.push(i);
      }
    }

    if (missing.length === 0) {
      console.log(`✅ All cards 1-200 are present`);
    } else {
      console.log(`❌ Missing cards: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
    }

    // List some parallels
    console.log(`\nSample parallels (first 5):`);
    const sampleParallels = (base.parallelSets || []).slice(0, 5);
    for (const p of sampleParallels) {
      console.log(`  - ${p.name} (${p.slug}) - Print run: ${p.printRun || 'unlimited'}`);
    }
  }

  console.log('\n🔍 OPTIC SET DETAILED CHECK');
  console.log('-'.repeat(80));
  const optic = parentSets.find(s => s.name === 'Optic');
  if (optic) {
    console.log(`Name: ${optic.name}`);
    console.log(`Type: ${optic.type}`);
    console.log(`Cards: ${optic.cards.length}`);
    console.log(`Parallels: ${optic.parallelSets?.length || 0}`);

    // Check for cards 1-200
    const cardNumbers = optic.cards.map(c => parseInt(c.cardNumber || '0')).filter(n => !isNaN(n));
    const min = Math.min(...cardNumbers);
    const max = Math.max(...cardNumbers);
    console.log(`Card number range: ${min} - ${max}`);

    // Check if all 200 cards are present
    const missing = [];
    for (let i = 1; i <= 200; i++) {
      if (!cardNumbers.includes(i)) {
        missing.push(i);
      }
    }

    if (missing.length === 0) {
      console.log(`✅ All cards 1-200 are present`);
    } else {
      console.log(`❌ Missing cards: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
    }
  }

  console.log('\n❌ DELETED SETS CHECK');
  console.log('-'.repeat(80));
  const deletedSets = ['Rated Rookies', 'Rated Rookies Optic'];
  let allDeleted = true;
  for (const setName of deletedSets) {
    const found = release.sets.find(s => s.name === setName);
    if (found) {
      console.log(`❌ ${setName} - STILL EXISTS (should be deleted)`);
      allDeleted = false;
    } else {
      console.log(`✅ ${setName} - Deleted correctly`);
    }
  }

  console.log('\n' + '='.repeat(80));
  if (allDeleted && base?.cards.length === 200 && optic?.cards.length === 200) {
    console.log('✅✅✅ ALL CHECKS PASSED! IMPORT SUCCESSFUL! ✅✅✅');
  } else {
    console.log('⚠️ SOME ISSUES DETECTED - REVIEW ABOVE');
  }
  console.log('='.repeat(80) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
