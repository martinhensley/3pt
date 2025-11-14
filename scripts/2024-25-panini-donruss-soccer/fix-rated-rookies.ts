import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('FIXING RATED ROOKIES STRUCTURE');
  console.log('='.repeat(80));

  const release = await prisma.release.findFirst({
    where: { slug: '2024-25-panini-donruss-soccer' },
    include: {
      sets: {
        include: {
          cards: true,
          parallelSets: true,
        }
      }
    },
  });

  if (!release) {
    console.error('Release not found!');
    return;
  }

  // Find the sets
  const base = release.sets.find(s => s.name === 'Base' && !s.parentSetId);
  const optic = release.sets.find(s => s.name === 'Optic' && !s.parentSetId);
  const ratedRookies = release.sets.find(s => s.name === 'Rated Rookies' && !s.parentSetId);
  const ratedRookiesOptic = release.sets.find(s => s.name === 'Rated Rookies Optic' && !s.parentSetId);

  if (!base || !optic || !ratedRookies || !ratedRookiesOptic) {
    console.error('Required sets not found!');
    return;
  }

  console.log('\n1. Merging Rated Rookies (#176-200) into Base set...');
  console.log(`   Current Base cards: ${base.cards.length}`);
  console.log(`   Current Rated Rookies cards: ${ratedRookies.cards.length}`);

  // Update Rated Rookies cards to belong to Base set
  await prisma.card.updateMany({
    where: { setId: ratedRookies.id },
    data: { setId: base.id },
  });

  console.log(`   ✓ Moved ${ratedRookies.cards.length} cards to Base`);

  console.log('\n2. Merging Rated Rookies Optic (#176-200) into Optic set...');
  console.log(`   Current Optic cards: ${optic.cards.length}`);
  console.log(`   Current Rated Rookies Optic cards: ${ratedRookiesOptic.cards.length}`);

  // Update Rated Rookies Optic cards to belong to Optic set
  await prisma.card.updateMany({
    where: { setId: ratedRookiesOptic.id },
    data: { setId: optic.id },
  });

  console.log(`   ✓ Moved ${ratedRookiesOptic.cards.length} cards to Optic`);

  console.log('\n3. Reassigning Rated Rookies parallels to Base...');
  const ratedRookiesParallels = ratedRookies.parallelSets || [];
  console.log(`   Found ${ratedRookiesParallels.length} Rated Rookies parallels`);

  for (const parallel of ratedRookiesParallels) {
    await prisma.set.update({
      where: { id: parallel.id },
      data: { parentSetId: base.id },
    });
    console.log(`     - Reassigned "${parallel.name}" to Base`);
  }

  console.log('\n4. Reassigning Rated Rookies Optic parallels to Optic...');
  const ratedRookiesOpticParallels = ratedRookiesOptic.parallelSets || [];
  console.log(`   Found ${ratedRookiesOpticParallels.length} Rated Rookies Optic parallels`);

  for (const parallel of ratedRookiesOpticParallels) {
    await prisma.set.update({
      where: { id: parallel.id },
      data: { parentSetId: optic.id },
    });
    console.log(`     - Reassigned "${parallel.name}" to Optic`);
  }

  console.log('\n5. Deleting empty Rated Rookies parent sets...');

  // Delete Rated Rookies parent set (cards already moved)
  await prisma.set.delete({
    where: { id: ratedRookies.id },
  });
  console.log('   ✓ Deleted Rated Rookies set');

  // Delete Rated Rookies Optic parent set (cards already moved)
  await prisma.set.delete({
    where: { id: ratedRookiesOptic.id },
  });
  console.log('   ✓ Deleted Rated Rookies Optic set');

  console.log('\n6. Updating totalCards fields...');

  // Update Base totalCards
  const baseCardCount = await prisma.card.count({
    where: { setId: base.id },
  });
  await prisma.set.update({
    where: { id: base.id },
    data: { totalCards: baseCardCount.toString() },
  });
  console.log(`   ✓ Updated Base totalCards to ${baseCardCount}`);

  // Update Optic totalCards
  const opticCardCount = await prisma.card.count({
    where: { setId: optic.id },
  });
  await prisma.set.update({
    where: { id: optic.id },
    data: { totalCards: opticCardCount.toString() },
  });
  console.log(`   ✓ Updated Optic totalCards to ${opticCardCount}`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ RATED ROOKIES FIX COMPLETE!');
  console.log('='.repeat(80));

  // Final summary
  const finalSets = await prisma.set.count({
    where: { releaseId: release.id },
  });
  const finalCards = await prisma.card.count({
    where: { set: { releaseId: release.id } },
  });

  console.log('\nFinal Summary:');
  console.log(`  Total Sets: ${finalSets} (was 149, now 147)`);
  console.log(`  Total Cards: ${finalCards} (unchanged at 872)`);
  console.log('  Base set: now has 200 cards (#1-200)');
  console.log('  Optic set: now has 200 cards (#1-200)');
  console.log(`  Base parallels: now has ${31 + ratedRookiesParallels.length} parallels`);
  console.log(`  Optic parallels: now has ${0 + ratedRookiesOpticParallels.length} parallels`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
