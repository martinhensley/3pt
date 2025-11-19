import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImport() {
  try {
    console.log('🔍 VERIFYING 2021-22 ROAD TO QATAR IMPORT\n');
    console.log('='.repeat(80));

    // 1. Check release exists
    const release = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        manufacturer: true,
        sets: {
          include: {
            cards: true
          }
        },
        sourceDocuments: true
      }
    });

    if (!release) {
      console.log('❌ Release not found!');
      return;
    }

    console.log('\n📦 RELEASE INFORMATION');
    console.log('-'.repeat(80));
    console.log(`Name: ${release.name}`);
    console.log(`Year: ${release.year}`);
    console.log(`Manufacturer: ${release.manufacturer.name}`);
    console.log(`Slug: ${release.slug}`);
    console.log(`Release Date: ${release.releaseDate}`);
    console.log(`Source Documents: ${release.sourceDocuments.length}`);

    if (release.sourceDocuments.length > 0) {
      console.log('\n📄 Source Documents:');
      release.sourceDocuments.forEach(doc => {
        console.log(`  • ${doc.filename} (${doc.entityType})`);
        console.log(`    URL: ${doc.url}`);
      });
    }

    // 2. Analyze sets
    console.log('\n\n📊 SET STATISTICS');
    console.log('-'.repeat(80));
    console.log(`Total Sets: ${release.sets.length}`);

    const setsByType: Record<string, number> = {};
    const parallelCount = release.sets.filter(s => s.isParallel).length;
    const baseSetCount = release.sets.filter(s => !s.isParallel).length;

    release.sets.forEach(set => {
      setsByType[set.type] = (setsByType[set.type] || 0) + 1;
    });

    console.log(`\nBreakdown by type:`);
    Object.entries(setsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} sets`);
    });

    console.log(`\nParallel structure:`);
    console.log(`  Base sets: ${baseSetCount}`);
    console.log(`  Parallel sets: ${parallelCount}`);

    // 3. Analyze cards
    const expectedCardCount = release.sets.reduce((sum, set) => sum + set.cards.length, 0);
    console.log('\n\n🃏 CARD STATISTICS');
    console.log('-'.repeat(80));
    console.log(`Total Cards: ${totalCards}`);

    // Card counts by set type
    const cardsByType: Record<string, number> = {};
    release.sets.forEach(set => {
      cardsByType[set.type] = (cardsByType[set.type] || 0) + set.cards.length;
    });

    console.log(`\nCards by set type:`);
    Object.entries(cardsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} cards`);
    });

    // 4. Top sets by card count
    console.log('\n\n📋 TOP 10 SETS BY CARD COUNT');
    console.log('-'.repeat(80));
    const sortedSets = [...release.sets].sort((a, b) => b.cards.length - a.cards.length);
    sortedSets.slice(0, 10).forEach((set, index) => {
      console.log(`${index + 1}. ${set.name.padEnd(50)} ${set.cards.length.toString().padStart(4)} cards  [${set.type}]`);
    });

    // 5. Verify specific key sets
    console.log('\n\n✅ KEY SET VERIFICATION');
    console.log('-'.repeat(80));

    const keySets = [
      { name: 'Base', expectedCards: 175, type: 'Base' },
      { name: 'Optic', expectedCards: 175, type: 'Base' },
      { name: 'Rated Rookies', expectedCards: 25, type: 'Base' },
      { name: 'Beautiful Game Autographs', expectedCards: 45, type: 'Autograph' },
      { name: 'Signature Series', expectedCards: 45, type: 'Autograph' },
      { name: 'Kit Kings', expectedCards: 50, type: 'Memorabilia' },
      { name: 'Kaboom', expectedCards: 20, type: 'Insert' },
    ];

    keySets.forEach(({ name, expectedCards, type }) => {
      const set = release.sets.find(s => s.name === name);
      if (set) {
        const match = set.cards.length === expectedCards;
        const icon = match ? '✓' : '✗';
        console.log(`${icon} ${name.padEnd(30)} Expected: ${expectedCards.toString().padStart(3)}, Found: ${set.cards.length.toString().padStart(3)} [${type}]`);
      } else {
        console.log(`✗ ${name.padEnd(30)} NOT FOUND`);
      }
    });

    // 6. Check for parallels
    console.log('\n\n🎨 PARALLEL VERIFICATION');
    console.log('-'.repeat(80));

    const baseSetsWithParallels = release.sets.filter(s => !s.isParallel);
    console.log(`Base sets found: ${baseSetsWithParallels.length}\n`);

    baseSetsWithParallels.slice(0, 5).forEach(baseSet => {
      const parallels = release.sets.filter(s => s.isParallel && s.baseSetSlug === baseSet.slug);
      console.log(`${baseSet.name} (${baseSet.cards.length} cards)`);
      console.log(`  └─ ${parallels.length} parallel(s)`);
      if (parallels.length > 0) {
        parallels.slice(0, 3).forEach(p => {
          console.log(`     • ${p.name} ${p.printRun ? `/${p.printRun}` : '(unnumbered)'}`);
        });
        if (parallels.length > 3) {
          console.log(`     ... and ${parallels.length - 3} more`);
        }
      }
    });

    // 7. Sample cards
    console.log('\n\n🎴 SAMPLE CARDS');
    console.log('-'.repeat(80));

    const baseSet = release.sets.find(s => s.name === 'Base');
    if (baseSet && baseSet.cards.length > 0) {
      console.log(`From "${baseSet.name}" set:\n`);
      baseSet.cards.slice(0, 5).forEach(card => {
        console.log(`  • #${card.cardNumber?.padEnd(4)} ${card.playerName?.padEnd(30)} ${card.team || ''}`);
        console.log(`    Slug: ${card.slug}`);
      });
    }

    // 8. Check for issues
    console.log('\n\n⚠️  ISSUE CHECK');
    console.log('-'.repeat(80));

    let issuesFound = 0;

    // Check for sets with no cards
    const emptySets = release.sets.filter(s => s.cards.length === 0);
    if (emptySets.length > 0) {
      console.log(`❌ Found ${emptySets.length} set(s) with no cards:`);
      emptySets.forEach(s => console.log(`   • ${s.name} (${s.slug})`));
      issuesFound++;
    }

    // Check for cards with missing player names
    const cardsWithoutPlayers = release.sets.reduce((sum, set) =>
      sum + set.cards.filter(c => !c.playerName).length, 0);
    if (cardsWithoutPlayers > 0) {
      console.log(`⚠️  Found ${cardsWithoutPlayers} card(s) with missing player names`);
      issuesFound++;
    }

    // Check for cards with missing slugs
    const cardsWithoutSlugs = release.sets.reduce((sum, set) =>
      sum + set.cards.filter(c => !c.slug).length, 0);
    if (cardsWithoutSlugs > 0) {
      console.log(`❌ Found ${cardsWithoutSlugs} card(s) with missing slugs`);
      issuesFound++;
    }

    // Check for parallel sets without base set slug
    const orphanedParallels = release.sets.filter(s => s.isParallel && !s.baseSetSlug);
    if (orphanedParallels.length > 0) {
      console.log(`⚠️  Found ${orphanedParallels.length} parallel set(s) without base set reference:`);
      orphanedParallels.forEach(s => console.log(`   • ${s.name} (${s.slug})`));
      issuesFound++;
    }

    if (issuesFound === 0) {
      console.log('✅ No issues found!');
    }

    // 9. Final summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Release: ${release.name}`);
    console.log(`✅ Sets: ${release.sets.length} (expected: 104)`);
    console.log(`✅ Cards: ${totalCards} (expected: 6,553)`);
    console.log(`✅ Source Documents: ${release.sourceDocuments.length}`);

    const setsMatch = release.sets.length === 104;
    const cardsMatch = expectedCardCount === 6553;

    if (setsMatch && cardsMatch) {
      console.log('\n🎉 IMPORT VERIFICATION SUCCESSFUL! All expected data found.');
    } else {
      console.log('\n⚠️  IMPORT VERIFICATION: Some discrepancies found.');
      if (!setsMatch) console.log(`   Sets: Expected 104, found ${release.sets.length}`);
      if (!cardsMatch) console.log(`   Cards: Expected 6,553, found ${totalCards}`);
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyImport()
  .catch(console.error);
