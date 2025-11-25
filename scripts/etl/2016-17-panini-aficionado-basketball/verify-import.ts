import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 2016-17 Panini Aficionado Basketball - Import Verification\n');
  console.log('='.repeat(80));

  const issues: string[] = [];

  // 1. Verify release exists
  console.log('\n1. Checking Release...');
  const release = await prisma.release.findUnique({
    where: { slug: '2016-17-panini-aficionado-basketball' },
    include: {
      manufacturer: true,
      sourceDocuments: true
    }
  });

  if (!release) {
    issues.push('❌ Release not found!');
    console.log('   ❌ Release not found!');
  } else {
    console.log(`   ✓ Release: ${release.year} ${release.manufacturer.name} ${release.name}`);
    console.log(`   ✓ Slug: ${release.slug}`);
    console.log(`   ✓ Source documents: ${release.sourceDocuments.length}`);
  }

  if (!release) {
    console.log('\n❌ Cannot continue verification without release');
    return;
  }

  // 2. Check set counts by type
  console.log('\n2. Checking Sets...');
  const sets = await prisma.set.findMany({
    where: { releaseId: release.id },
    include: {
      _count: {
        select: { cards: true }
      }
    }
  });

  const setsByType: Record<string, typeof sets> = {
    Base: [],
    Insert: [],
    Autograph: [],
    Memorabilia: []
  };

  for (const set of sets) {
    setsByType[set.type].push(set);
  }

  console.log(`   Total sets: ${sets.length}`);
  for (const [type, typeSets] of Object.entries(setsByType)) {
    if (typeSets.length > 0) {
      const cardCount = typeSets.reduce((sum, s) => sum + s._count.cards, 0);
      console.log(`   ${type}: ${typeSets.length} sets, ${cardCount} cards`);
    }
  }

  // Expected: 43 sets, 1569 cards
  if (sets.length !== 43) {
    issues.push(`⚠️  Expected 43 sets, found ${sets.length}`);
  }

  // 3. Check for parallel relationships
  console.log('\n3. Checking Parallel Relationships...');
  const parallels = sets.filter(s => s.isParallel);
  console.log(`   Parallel sets: ${parallels.length}`);

  let invalidParallels = 0;
  for (const parallel of parallels) {
    if (!parallel.baseSetSlug) {
      issues.push(`❌ Parallel set "${parallel.name}" missing baseSetSlug`);
      invalidParallels++;
    } else {
      // Verify base set exists
      const baseSet = sets.find(s => s.slug === parallel.baseSetSlug);
      if (!baseSet) {
        issues.push(`❌ Parallel set "${parallel.name}" references non-existent base: ${parallel.baseSetSlug}`);
        invalidParallels++;
      }
    }
  }

  if (invalidParallels === 0) {
    console.log('   ✓ All parallels have valid base set references');
  } else {
    console.log(`   ❌ Found ${invalidParallels} invalid parallel relationships`);
  }

  // 4. Check print runs
  console.log('\n4. Checking Print Runs...');
  const setsWithPrintRuns = sets.filter(s => s.printRun !== null);
  console.log(`   Sets with print runs: ${setsWithPrintRuns.length}`);

  // Check for expected print runs
  const printRunCounts: Record<number, number> = {};
  for (const set of setsWithPrintRuns) {
    const pr = set.printRun!;
    printRunCounts[pr] = (printRunCounts[pr] || 0) + 1;
  }

  console.log('   Print run distribution:');
  for (const [pr, count] of Object.entries(printRunCounts).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    console.log(`     /${pr}: ${count} sets`);
  }

  // 5. Check slugs are unique
  console.log('\n5. Checking Slug Uniqueness...');
  const slugs = sets.map(s => s.slug);
  const uniqueSlugs = new Set(slugs);
  if (slugs.length !== uniqueSlugs.size) {
    issues.push(`❌ Duplicate slugs found! ${slugs.length} sets, ${uniqueSlugs.size} unique slugs`);
    console.log(`   ❌ Duplicate slugs found!`);
  } else {
    console.log('   ✓ All set slugs are unique');
  }

  // 6. Check total cards
  console.log('\n6. Checking Cards...');
  const totalCards = await prisma.card.count({
    where: {
      set: {
        releaseId: release.id
      }
    }
  });

  console.log(`   Total cards: ${totalCards}`);

  // Expected: 1569 cards
  if (totalCards !== 1569) {
    issues.push(`⚠️  Expected 1569 cards, found ${totalCards}`);
  } else {
    console.log('   ✓ Card count matches expected (1569)');
  }

  // 7. Check that all cards have valid set references
  console.log('\n7. Checking Card-Set Relationships...');
  const cardsWithSets = await prisma.card.count({
    where: {
      set: {
        releaseId: release.id
      }
    }
  });

  if (cardsWithSets === totalCards) {
    console.log('   ✓ All cards have valid set references');
  } else {
    issues.push(`❌ Card count mismatch: ${totalCards} total cards, ${cardsWithSets} with valid sets`);
    console.log(`   ❌ Card count mismatch`);
  }

  // 8. Sample some sets to verify data
  console.log('\n8. Sample Set Verification...');
  const baseSets = setsByType.Base.filter(s => !s.isParallel);
  if (baseSets.length > 0) {
    const baseSet = baseSets[0];
    console.log(`   Checking "${baseSet.name}" (${baseSet._count.cards} cards)`);

    const sampleCards = await prisma.card.findMany({
      where: { setId: baseSet.id },
      take: 5
    });

    for (const card of sampleCards) {
      console.log(`     #${card.cardNumber}: ${card.playerName} - ${card.team}`);
    }
  }

  // 9. Check Artist's Proof variants
  console.log('\n9. Checking Artist\'s Proof Variants...');
  const artistProofs = sets.filter(s => s.name.includes('Artist\'s Proof'));
  console.log(`   Found ${artistProofs.length} Artist's Proof sets`);

  const proofVariants: Record<string, number> = {};
  for (const set of artistProofs) {
    if (set.name.includes('Red')) {
      proofVariants['Red (/1)'] = (proofVariants['Red (/1)'] || 0) + 1;
    } else if (set.name.includes('Bronze')) {
      proofVariants['Bronze (/25)'] = (proofVariants['Bronze (/25)'] || 0) + 1;
    } else if (set.name.includes('Gold')) {
      proofVariants['Gold (/10)'] = (proofVariants['Gold (/10)'] || 0) + 1;
    } else {
      proofVariants['Standard (/75)'] = (proofVariants['Standard (/75)'] || 0) + 1;
    }
  }

  for (const [variant, count] of Object.entries(proofVariants)) {
    console.log(`     ${variant}: ${count} sets`);
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Verification Summary:');
  console.log('-'.repeat(80));

  if (issues.length === 0) {
    console.log('✅ All checks passed!');
    console.log('\nImport Statistics:');
    console.log(`   Release: 2016-17 Panini Aficionado Basketball`);
    console.log(`   Total Sets: ${sets.length}`);
    console.log(`   Total Cards: ${totalCards}`);
    console.log(`   Base Sets: ${setsByType.Base.length} sets`);
    console.log(`   Insert Sets: ${setsByType.Insert.length} sets`);
    console.log(`   Autograph Sets: ${setsByType.Autograph.length} sets`);
    console.log(`   Memorabilia Sets: ${setsByType.Memorabilia.length} sets`);
    console.log(`   Parallel Sets: ${parallels.length}`);
  } else {
    console.log(`⚠️  Found ${issues.length} issue(s):\n`);
    for (const issue of issues) {
      console.log(`   ${issue}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

verify()
  .catch((e) => {
    console.error('❌ Verification Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
