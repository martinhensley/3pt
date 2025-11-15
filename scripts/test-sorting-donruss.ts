import { PrismaClient } from '@prisma/client';
import { sortSetsGrouped } from '../lib/setUtils';

const prisma = new PrismaClient();

async function testSorting() {
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

    // Test the sorting on Base sets (which includes Base and Optic)
    const baseSets = setsByType.get('Base') || [];

    console.log('='.repeat(80));
    console.log('TESTING ENHANCED SORTING FOR BASE SETS');
    console.log('='.repeat(80));
    console.log('\nTotal Base sets:', baseSets.length);

    // Apply the enhanced sorting
    const sortedBaseSets = sortSetsGrouped(baseSets);

    console.log('\n' + '='.repeat(60));
    console.log('SORTED BASE SETS (with Base/Optic grouping):');
    console.log('='.repeat(60));

    let currentGroup = '';
    sortedBaseSets.forEach((set, idx) => {
      // Determine which group this set belongs to
      let group = '';
      if (set.name === 'Base' || set.name.startsWith('Base ')) {
        group = 'BASE GROUP';
      } else if (set.name === 'Optic' || set.name.startsWith('Optic ')) {
        group = 'OPTIC GROUP';
      } else {
        group = 'OTHER SETS';
      }

      // Print group header when it changes
      if (group !== currentGroup) {
        console.log(`\n--- ${group} ---`);
        currentGroup = group;
      }

      const printRun = set.printRun ? `/${set.printRun}` : '';
      const cards = set._count.cards;
      const parallel = set.isParallel ? ' [PARALLEL]' : '';
      console.log(`${(idx + 1).toString().padStart(3)}. ${set.name.padEnd(40)}${printRun.padEnd(10)} - ${cards} cards${parallel}`);
    });

    // Also test Insert sets to ensure regular sorting still works
    const insertSets = setsByType.get('Insert') || [];
    if (insertSets.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('SORTED INSERT SETS (regular sorting):');
      console.log('='.repeat(60));

      const sortedInsertSets = sortSetsGrouped(insertSets);
      sortedInsertSets.slice(0, 10).forEach((set, idx) => {
        const printRun = set.printRun ? `/${set.printRun}` : '';
        const cards = set._count.cards;
        const parallel = set.isParallel ? ' [PARALLEL]' : '';
        console.log(`${(idx + 1).toString().padStart(3)}. ${set.name.padEnd(40)}${printRun.padEnd(10)} - ${cards} cards${parallel}`);
      });

      if (insertSets.length > 10) {
        console.log(`... and ${insertSets.length - 10} more Insert sets`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSorting();