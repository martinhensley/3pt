import { PrismaClient } from '@prisma/client';
import { sortSetsGrouped } from '../lib/setUtils';

const prisma = new PrismaClient();

async function testSortingAllTypes() {
  try {
    // Get the Donruss Soccer release
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
      include: {
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
      console.log('Release not found');
      return;
    }

    // Group sets by type
    const setsByType = new Map<string, any[]>();
    release.sets.forEach(set => {
      const type = set.type || 'Other';
      if (!setsByType.has(type)) {
        setsByType.set(type, []);
      }
      setsByType.get(type)!.push(set);
    });

    // Test INSERT sets
    const insertSets = setsByType.get('Insert') || [];
    if (insertSets.length > 0) {
      console.log('='.repeat(80));
      console.log('INSERT SETS - Testing Enhanced Grouping');
      console.log('='.repeat(80));

      const sortedInsertSets = sortSetsGrouped(insertSets);

      let currentGroup = '';
      sortedInsertSets.forEach((set, idx) => {
        // Extract the base name for grouping display
        const baseName = set.name.replace(/\s+(Red|Blue|Gold|Silver|Black|Pink|Green|Purple)(\s+\d+)?$/i, '').trim();

        if (baseName !== currentGroup) {
          console.log(`\n--- ${baseName.toUpperCase()} GROUP ---`);
          currentGroup = baseName;
        }

        const printRun = set.printRun ? `/${set.printRun}` : '';
        const cards = set._count.cards;
        const parallel = set.isParallel ? ' [PARALLEL]' : '';
        console.log(`  ${set.name.padEnd(40)}${printRun.padEnd(10)} - ${cards} cards${parallel}`);
      });
    }

    // Test AUTOGRAPH sets
    const autoSets = setsByType.get('Autograph') || [];
    if (autoSets.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('AUTOGRAPH SETS - Testing Enhanced Grouping');
      console.log('='.repeat(80));

      const sortedAutoSets = sortSetsGrouped(autoSets);

      let currentGroup = '';
      sortedAutoSets.forEach((set, idx) => {
        // Extract the base name for grouping display
        const baseName = set.name.replace(/\s+(Red|Blue|Gold|Silver|Black|Pink|Green|Purple|Dragon Scale|Pink Ice|Pink Velocity)(\s+\d+)?$/i, '').trim();

        if (baseName !== currentGroup) {
          console.log(`\n--- ${baseName.toUpperCase()} GROUP ---`);
          currentGroup = baseName;
        }

        const printRun = set.printRun ? `/${set.printRun}` : '';
        const cards = set._count.cards;
        const parallel = set.isParallel ? ' [PARALLEL]' : '';
        console.log(`  ${set.name.padEnd(50)}${printRun.padEnd(10)} - ${cards} cards${parallel}`);
      });
    }

    // Test MEMORABILIA sets
    const memSets = setsByType.get('Memorabilia') || [];
    if (memSets.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('MEMORABILIA SETS - Testing Enhanced Grouping');
      console.log('='.repeat(80));

      const sortedMemSets = sortSetsGrouped(memSets);

      let currentGroup = '';
      sortedMemSets.forEach((set, idx) => {
        // Extract the base name for grouping display
        const baseName = set.name.replace(/\s+(Red|Blue|Gold|Silver|Black|Pink|Green|Purple)(\s+\d+)?$/i, '').trim();

        if (baseName !== currentGroup) {
          console.log(`\n--- ${baseName.toUpperCase()} GROUP ---`);
          currentGroup = baseName;
        }

        const printRun = set.printRun ? `/${set.printRun}` : '';
        const cards = set._count.cards;
        const parallel = set.isParallel ? ' [PARALLEL]' : '';
        console.log(`  ${set.name.padEnd(40)}${printRun.padEnd(10)} - ${cards} cards${parallel}`);
      });
    }

    // Show summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Sets: ${release.sets.length}`);
    console.log(`  - Base: ${(setsByType.get('Base') || []).length}`);
    console.log(`  - Insert: ${(setsByType.get('Insert') || []).length}`);
    console.log(`  - Autograph: ${(setsByType.get('Autograph') || []).length}`);
    console.log(`  - Memorabilia: ${(setsByType.get('Memorabilia') || []).length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSortingAllTypes();