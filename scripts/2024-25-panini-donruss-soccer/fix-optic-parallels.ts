import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOpticParallels() {
  try {
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
    });

    if (!release) {
      throw new Error('Release not found');
    }

    console.log('Found release:', release.name);

    // Find the parent Optic set
    const opticParent = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: 'Optic',
        parentSetId: null,
      },
    });

    if (!opticParent) {
      throw new Error('Optic parent set not found');
    }

    console.log('Found Optic parent set:', opticParent.slug);

    // Mapping of Optic parallel names to their print runs
    const parallelPrintRuns: Record<string, number | null> = {
      'Optic Argyle': null,
      'Optic Holo': null,
      'Optic Ice': null,
      'Optic Plum Blossom': null,
      'Optic Velocity': null,
      'Optic Red': 299,
      'Optic Blue': 149,
      'Optic Pink Velocity': 99,
      'Optic Teal Mojo': 49,
      'Optic Pink Ice': 25,
      'Optic Purple Mojo': 25,
      'Optic Gold': 10,
      'Optic Dragon Scale': 8,
      'Optic Green': 5,
      'Optic Black': 1,
      'Optic Black Pandora': 1,
      'Optic Gold Power': 1,
    };

    // Get all Optic sets
    const opticSets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        name: { startsWith: 'Optic' },
      },
    });

    console.log(`\nFound ${opticSets.length} Optic sets\n`);

    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const [parallelName, printRun] of Object.entries(parallelPrintRuns)) {
      // Find existing set
      const existingSet = opticSets.find(s => s.name === parallelName);

      if (existingSet) {
        // Check if it needs updating
        const needsParentUpdate = !existingSet.parentSetId;
        const needsPrintRunUpdate = existingSet.printRun !== printRun;

        if (needsParentUpdate || needsPrintRunUpdate) {
          console.log(`Updating: ${parallelName}`);
          console.log(`  Current: parentId=${existingSet.parentSetId || 'null'}, printRun=${existingSet.printRun || 'null'}`);
          console.log(`  New:     parentId=${opticParent.id}, printRun=${printRun || 'null'}`);

          await prisma.set.update({
            where: { id: existingSet.id },
            data: {
              parentSetId: opticParent.id,
              printRun: printRun,
              mirrorsParentChecklist: true,
            },
          });

          // Delete cards from parallel (should reference parent)
          if (existingSet.parentSetId === null) {
            const deletedCards = await prisma.card.deleteMany({
              where: { setId: existingSet.id },
            });
            if (deletedCards.count > 0) {
              console.log(`  Deleted ${deletedCards.count} duplicate cards`);
            }
          }

          updated++;
        } else {
          console.log(`Skipping: ${parallelName} (already correct)`);
          skipped++;
        }
      } else {
        console.log(`Creating: ${parallelName} (print run: ${printRun || 'none'})`);

        // Generate slug
        const slugParts = ['2024-25-panini-donruss-soccer-base-optic'];
        const parallelSlugPart = parallelName.replace('Optic ', '').toLowerCase().replace(/\s+/g, '-');
        slugParts.push(parallelSlugPart);

        if (printRun) {
          if (printRun === 1) {
            slugParts.push('1-of-1');
          } else {
            slugParts.push(String(printRun));
          }
        }

        const slug = slugParts.join('-');

        await prisma.set.create({
          data: {
            name: parallelName,
            slug: slug,
            type: 'Base',
            releaseId: release.id,
            parentSetId: opticParent.id,
            printRun: printRun,
            totalCards: '200',
            mirrorsParentChecklist: true,
          },
        });

        created++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`Summary:`);
    console.log(`  Updated:  ${updated}`);
    console.log(`  Created:  ${created}`);
    console.log(`  Skipped:  ${skipped}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixOpticParallels();
