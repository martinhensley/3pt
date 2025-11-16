import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOpticParallels() {
  try {
    console.log('🔧 FIXING OPTIC PARALLEL SETS\n');
    console.log('='.repeat(80));

    const release = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        sets: {
          include: {
            cards: true
          }
        }
      }
    });

    if (!release) {
      console.log('❌ Release not found!');
      return;
    }

    // Find all Base Optic parallels (these have the wrong naming pattern)
    const baseOpticParallels = release.sets.filter(s =>
      s.name.startsWith('Optic ') && s.isParallel && s.cards.length === 175
    );

    // Find all Rated Rookies Optic parallels
    const rrOpticParallels = release.sets.filter(s =>
      s.name.startsWith('Rated Rookies Optic ') && s.isParallel
    );

    console.log(`Found ${baseOpticParallels.length} Optic parallels with 175 cards`);
    console.log(`Found ${rrOpticParallels.length} Rated Rookies Optic parallels with 25 cards\n`);

    let totalMerged = 0;
    let totalDeleted = 0;

    for (const rrParallel of rrOpticParallels) {
      // Extract the variant name (e.g., "Black Velocity", "Blue", etc.)
      const variant = rrParallel.name.replace('Rated Rookies Optic ', '');

      // Find the matching Optic parallel (e.g., "Optic Black Velocity")
      const matchingOptic = baseOpticParallels.find(p => {
        const opticVariant = p.name.replace('Optic ', '');
        return opticVariant === variant;
      });

      if (!matchingOptic) {
        console.log(`⚠️  No matching Optic parallel found for: ${rrParallel.name} (variant: ${variant})`);
        continue;
      }

      console.log(`\n📌 Merging "${rrParallel.name}" → "${matchingOptic.name}"`);
      console.log(`   Source: ${rrParallel.cards.length} cards`);
      console.log(`   Target: ${matchingOptic.cards.length} cards`);

      // Move all cards from RR Optic parallel to Optic parallel
      const updateResult = await prisma.card.updateMany({
        where: { setId: rrParallel.id },
        data: { setId: matchingOptic.id }
      });

      totalMerged += updateResult.count;
      console.log(`   ✅ Moved ${updateResult.count} cards`);

      // Update totalCards
      const newCount = matchingOptic.cards.length + rrParallel.cards.length;
      await prisma.set.update({
        where: { id: matchingOptic.id },
        data: { totalCards: newCount.toString() }
      });

      console.log(`   ✅ Updated totalCards to ${newCount}`);

      // Delete the empty RR Optic parallel set
      await prisma.set.delete({
        where: { id: rrParallel.id }
      });

      totalDeleted++;
      console.log(`   ✅ Deleted empty set: ${rrParallel.name}`);
    }

    // Verification
    console.log('\n\n✅ VERIFICATION');
    console.log('-'.repeat(80));

    const updatedRelease = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        sets: {
          include: {
            cards: true
          }
        }
      }
    });

    if (!updatedRelease) {
      console.log('❌ Could not verify!');
      return;
    }

    const opticSets = updatedRelease.sets.filter(s =>
      s.name === 'Optic' || (s.name.startsWith('Optic ') && !s.name.includes('Rated Rookies'))
    );

    console.log(`\n🔵 Optic sets (${opticSets.length} total):`);
    opticSets.forEach(s => {
      const status = s.cards.length === 200 ? '✅' : '⚠️';
      console.log(`  ${status} ${s.name.padEnd(40)} ${s.cards.length.toString().padStart(3)} cards`);
    });

    const totalCards = updatedRelease.sets.reduce((sum, set) => sum + set.cards.length, 0);

    console.log('\n\n' + '='.repeat(80));
    console.log('📊 FIX SUMMARY');
    console.log('='.repeat(80));
    console.log(`Cards merged: ${totalMerged} from ${totalDeleted} sets`);
    console.log(`Final set count: ${updatedRelease.sets.length}`);
    console.log(`Final card count: ${totalCards}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixOpticParallels()
  .catch(console.error);
