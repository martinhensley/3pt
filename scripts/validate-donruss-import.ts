import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateImport() {
  try {
    console.log('Validating 2024-25 Panini Donruss Soccer import...\n');

    // Find the release
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
      include: {
        manufacturer: true,
        sets: {
          include: {
            _count: {
              select: { cards: true }
            }
          }
        }
      }
    });

    if (!release) {
      console.error('Release not found!');
      return;
    }

    console.log(`Release: ${release.name} by ${release.manufacturer.name}`);
    console.log(`Release ID: ${release.id}\n`);

    // Count totals
    const totalSets = release.sets.length;
    const totalCards = await prisma.card.count({
      where: {
        set: {
          releaseId: release.id
        }
      }
    });

    console.log(`Total Sets: ${totalSets}`);
    console.log(`Total Cards: ${totalCards}\n`);

    // Group sets by type
    const setsByType = {
      Base: [] as typeof release.sets,
      Insert: [] as typeof release.sets,
      Autograph: [] as typeof release.sets,
      Memorabilia: [] as typeof release.sets,
    };

    release.sets.forEach(set => {
      setsByType[set.type].push(set);
    });

    // Display breakdown by type
    console.log('Sets by Type:');
    console.log(`  Base Sets: ${setsByType.Base.length}`);
    console.log(`  Insert Sets: ${setsByType.Insert.length}`);
    console.log(`  Autograph Sets: ${setsByType.Autograph.length}`);
    console.log(`  Memorabilia Sets: ${setsByType.Memorabilia.length}\n`);

    // Check parallel sets
    const parallelSets = release.sets.filter(s => s.isParallel);
    const baseSets = release.sets.filter(s => !s.isParallel);

    console.log('Parallel Analysis:');
    console.log(`  Base/Parent Sets: ${baseSets.length}`);
    console.log(`  Parallel Sets: ${parallelSets.length}\n`);

    // List base sets with their parallel counts
    console.log('Base Sets and Their Parallels:');
    for (const baseSet of baseSets) {
      const parallels = parallelSets.filter(p => p.baseSetSlug === baseSet.slug);
      console.log(`  ${baseSet.name}: ${baseSet._count.cards} cards, ${parallels.length} parallels`);
    }

    // Check for any issues
    console.log('\n=== VALIDATION CHECKS ===');

    // Check 1: Sets with 0 cards
    const emptySets = release.sets.filter(s => s._count.cards === 0);
    if (emptySets.length > 0) {
      console.log(`⚠️ WARNING: ${emptySets.length} sets have 0 cards:`);
      emptySets.forEach(s => console.log(`   - ${s.name}`));
    } else {
      console.log('✅ All sets have cards');
    }

    // Check 2: Expected card counts for base sets
    const baseSet = release.sets.find(s => s.slug === '2024-25-donruss-soccer-base');
    const opticSet = release.sets.find(s => s.slug === '2024-25-donruss-soccer-optic');

    if (baseSet) {
      if (baseSet._count.cards === 200) {
        console.log('✅ Base set has correct card count (200)');
      } else {
        console.log(`⚠️ Base set has ${baseSet._count.cards} cards, expected 200`);
      }
    }

    if (opticSet) {
      if (opticSet._count.cards === 200) {
        console.log('✅ Optic set has correct card count (200)');
      } else {
        console.log(`⚠️ Optic set has ${opticSet._count.cards} cards, expected 200`);
      }
    }

    // Check 3: Parallel sets have baseSetSlug
    const parallelsWithoutBase = parallelSets.filter(s => !s.baseSetSlug);
    if (parallelsWithoutBase.length > 0) {
      console.log(`⚠️ WARNING: ${parallelsWithoutBase.length} parallel sets missing baseSetSlug:`);
      parallelsWithoutBase.forEach(s => console.log(`   - ${s.name}`));
    } else {
      console.log('✅ All parallel sets have baseSetSlug reference');
    }

    // Sample some cards
    console.log('\n=== SAMPLE CARDS ===');
    const sampleCards = await prisma.card.findMany({
      where: {
        set: {
          releaseId: release.id
        }
      },
      include: {
        set: true
      },
      take: 5
    });

    sampleCards.forEach(card => {
      console.log(`  ${card.cardNumber} ${card.playerName} (${card.set.name})`);
    });

    // Expected totals
    console.log('\n=== EXPECTED VS ACTUAL ===');
    console.log('Expected from Excel: 8,977 cards across 149 sets');
    console.log('Expected after merging Rated Rookies: 8,977 cards across ~116 sets');
    console.log(`Actual imported: ${totalCards} cards across ${totalSets} sets`);

    if (totalCards === 8977 && totalSets === 116) {
      console.log('\n✅ IMPORT SUCCESSFUL! All expected data imported correctly.');
    } else {
      console.log('\n⚠️ Import completed with differences from expected.');
    }

  } catch (error) {
    console.error('Error during validation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validateImport();