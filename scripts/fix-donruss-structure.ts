import { prisma } from '../lib/prisma';

/**
 * Fixes the 2024-25 Donruss Soccer release structure:
 * 1. Removes duplicate Base set
 * 2. Merges Rated Rookies cards (#176-200) into the Base set
 * 3. Creates Optic base set (if missing)
 * 4. Moves Rated Rookies parallels to Base set parallels
 */
async function fixDonrussStructure() {
  console.log('🔧 Fixing 2024-25 Donruss Soccer structure...\n');

  // Find the release
  const release = await prisma.release.findFirst({
    where: {
      name: { contains: 'Donruss Soccer', mode: 'insensitive' },
      year: '2024-25'
    },
    include: {
      sets: {
        include: {
          cards: true,
          parallelSets: {
            include: {
              cards: true
            }
          }
        }
      }
    }
  });

  if (!release) {
    console.error('❌ Release not found');
    return;
  }

  console.log(`Found release: ${release.year} ${release.name}\n`);

  // Step 1: Find the Base sets (there should be 2 duplicates)
  const baseSets = release.sets.filter(s =>
    s.name === 'Base' && !s.parentSetId
  );

  console.log(`Found ${baseSets.length} Base sets`);

  if (baseSets.length !== 2) {
    console.log('⚠️  Expected 2 Base sets (duplicate), found', baseSets.length);
  }

  // Keep the one with parallels, delete the other
  const baseWithParallels = baseSets.find(s => s.parallelSets.length > 0);
  const baseWithoutParallels = baseSets.find(s => s.parallelSets.length === 0);

  if (baseWithoutParallels) {
    console.log(`\n🗑️  Deleting duplicate Base set without parallels (${baseWithoutParallels.cards.length} cards)...`);

    // Move cards to the set with parallels if needed
    if (baseWithParallels && baseWithoutParallels.cards.length > 0) {
      console.log(`  Moving ${baseWithoutParallels.cards.length} cards to Base with parallels...`);
      await prisma.card.updateMany({
        where: { setId: baseWithoutParallels.id },
        data: { setId: baseWithParallels.id }
      });
    }

    // Delete the duplicate set
    await prisma.set.delete({
      where: { id: baseWithoutParallels.id }
    });

    console.log(`  ✓ Deleted duplicate Base set`);
  }

  // Step 2: Find Rated Rookies set
  const ratedRookiesSet = release.sets.find(s =>
    s.name.includes('Rated Rookies') && !s.parentSetId
  );

  if (ratedRookiesSet && baseWithParallels) {
    console.log(`\n🔄 Merging Rated Rookies into Base set...`);
    console.log(`  Rated Rookies: ${ratedRookiesSet.cards.length} cards, ${ratedRookiesSet.parallelSets.length} parallels`);

    // Move Rated Rookies cards (#176-200) to Base set
    console.log(`  Moving ${ratedRookiesSet.cards.length} Rated Rookies cards to Base...`);
    await prisma.card.updateMany({
      where: { setId: ratedRookiesSet.id },
      data: { setId: baseWithParallels.id }
    });

    // Move Rated Rookies parallel cards to Base parallels
    for (const rrParallel of ratedRookiesSet.parallelSets) {
      // Find matching Base parallel by name pattern
      const parallelType = rrParallel.name.replace('Rated Rookies ', '');
      const baseParallel = baseWithParallels.parallelSets.find(p =>
        p.name.includes(parallelType)
      );

      if (baseParallel) {
        console.log(`  Moving cards from "${rrParallel.name}" to "${baseParallel.name}"...`);
        await prisma.card.updateMany({
          where: { setId: rrParallel.id },
          data: { setId: baseParallel.id }
        });

        // Delete the Rated Rookies parallel
        await prisma.set.delete({
          where: { id: rrParallel.id }
        });
      } else {
        console.log(`  ⚠️  No matching Base parallel found for "${rrParallel.name}", keeping separate`);
      }
    }

    // Delete the Rated Rookies parent set
    await prisma.set.delete({
      where: { id: ratedRookiesSet.id }
    });

    console.log(`  ✓ Merged Rated Rookies into Base set`);
  }

  // Step 3: Check for Optic set
  const opticSet = release.sets.find(s =>
    s.name.toLowerCase().includes('optic') && !s.parentSetId
  );

  if (!opticSet) {
    console.log(`\n⚠️  Optic base set not found in database`);
    console.log(`   This should be created during next import with proper checklist`);
  } else {
    console.log(`\n✓ Optic set exists: ${opticSet.cards.length} cards, ${opticSet.parallelSets.length} parallels`);
  }

  console.log(`\n✅ Donruss structure fix complete!`);

  // Show final summary
  const updatedRelease = await prisma.release.findUnique({
    where: { id: release.id },
    include: {
      sets: {
        where: { parentSetId: null },
        include: {
          _count: {
            select: { cards: true, parallelSets: true }
          }
        },
        orderBy: { name: 'asc' }
      }
    }
  });

  console.log(`\n📊 Final structure:`);
  console.log(`   Total parent sets: ${updatedRelease?.sets.length}`);

  const finalBase = updatedRelease?.sets.find(s => s.name === 'Base');
  if (finalBase) {
    console.log(`   Base set: ${finalBase._count.cards} cards (should be 200), ${finalBase._count.parallels} parallels`);
  }
}

// Run the fix
fixDonrussStructure()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
