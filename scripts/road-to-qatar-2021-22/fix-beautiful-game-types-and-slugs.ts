import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBeautifulGameTypesAndSlugs() {
  try {
    console.log('Fixing Beautiful Game Autographs set types and base slugs...\n');

    const release = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        sets: {
          where: {
            name: {
              contains: 'Beautiful Game Autographs'
            }
          }
        }
      }
    });

    if (!release) {
      console.log('❌ Release not found');
      return;
    }

    // Find the base set slug
    const baseSet = release.sets.find(s => s.name === 'Beautiful Game Autographs');
    if (!baseSet) {
      console.log('❌ Base set not found');
      return;
    }

    console.log(`Base set slug: ${baseSet.slug}\n`);

    let updatedCount = 0;

    for (const set of release.sets) {
      const updates: any = {};
      let needsUpdate = false;

      // All Beautiful Game Autographs sets should be type "Autograph"
      if (set.type !== 'Autograph') {
        updates.type = 'Autograph';
        needsUpdate = true;
      }

      // Parallel sets should have correct baseSetSlug
      if (set.name !== 'Beautiful Game Autographs') {
        if (set.baseSetSlug !== baseSet.slug) {
          updates.baseSetSlug = baseSet.slug;
          updates.isParallel = true;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        console.log(`Updating ${set.name}:`);
        if (updates.type) {
          console.log(`  Type: ${set.type} → ${updates.type}`);
        }
        if (updates.baseSetSlug) {
          console.log(`  baseSetSlug: ${set.baseSetSlug} → ${updates.baseSetSlug}`);
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
          contains: 'Beautiful Game Autographs'
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

fixBeautifulGameTypesAndSlugs();
