import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDualAutographs() {
  try {
    console.log('Fixing Beautiful Game Dual Autographs...\n');

    const release = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        sets: {
          where: {
            name: {
              contains: 'Dual Autographs'
            }
          }
        }
      }
    });

    if (!release) {
      console.log('❌ Release not found');
      return;
    }

    // Find the base Dual Autographs set
    const baseDualSet = release.sets.find(s => s.name === 'Beautiful Game Dual Autographs');
    if (!baseDualSet) {
      console.log('❌ Base Dual Autographs set not found');
      return;
    }

    console.log(`Base set slug: ${baseDualSet.slug}\n`);

    let updatedCount = 0;

    for (const set of release.sets) {
      const updates: any = {};
      let needsUpdate = false;

      // All Dual Autographs sets should be type "Autograph"
      if (set.type !== 'Autograph') {
        updates.type = 'Autograph';
        needsUpdate = true;
      }

      // Fix isParallel and baseSetSlug
      if (set.name === 'Beautiful Game Dual Autographs') {
        // This is the base set
        if (set.isParallel !== false) {
          updates.isParallel = false;
          needsUpdate = true;
        }
        if (set.baseSetSlug !== null) {
          updates.baseSetSlug = null;
          needsUpdate = true;
        }
      } else {
        // This is a parallel set
        if (set.isParallel !== true) {
          updates.isParallel = true;
          needsUpdate = true;
        }
        if (set.baseSetSlug !== baseDualSet.slug) {
          updates.baseSetSlug = baseDualSet.slug;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        console.log(`Updating ${set.name}:`);
        if (updates.type) {
          console.log(`  Type: ${set.type} → ${updates.type}`);
        }
        if (updates.isParallel !== undefined) {
          console.log(`  isParallel: ${set.isParallel} → ${updates.isParallel}`);
        }
        if (updates.baseSetSlug !== undefined) {
          console.log(`  baseSetSlug: ${set.baseSetSlug || 'null'} → ${updates.baseSetSlug || 'null'}`);
        }

        await prisma.set.update({
          where: { id: set.id },
          data: updates
        });

        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      console.log('✅ All settings are already correct!');
    } else {
      console.log(`\n✅ Successfully updated ${updatedCount} sets`);
    }

    // Verify the changes
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION:');
    console.log('='.repeat(70));

    const verifiedSets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        name: {
          contains: 'Dual Autographs'
        }
      },
      orderBy: { name: 'asc' }
    });

    verifiedSets.forEach(set => {
      console.log(`\n${set.name}`);
      console.log(`  Type: ${set.type}`);
      console.log(`  isParallel: ${set.isParallel}`);
      console.log(`  baseSetSlug: ${set.baseSetSlug || 'null'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDualAutographs();
