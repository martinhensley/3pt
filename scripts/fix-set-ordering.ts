import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Enhanced sorting function that properly handles Base/Optic prefixes
function sortSetsWithPrefixes(sets: any[]) {
  return sets.sort((a, b) => {
    // First, separate by parallel vs non-parallel
    if (a.isParallel !== b.isParallel) {
      return a.isParallel ? 1 : -1; // Non-parallels first
    }

    // For parallels, separate by print run
    if (a.isParallel && b.isParallel) {
      const aPrintRun = a.printRun || 0;
      const bPrintRun = b.printRun || 0;

      // Both have no print run - alphabetical
      if (aPrintRun === 0 && bPrintRun === 0) {
        return a.name.localeCompare(b.name);
      }

      // One has print run, one doesn't - no print run first
      if (aPrintRun === 0) return -1;
      if (bPrintRun === 0) return 1;

      // Both have print runs - highest to lowest
      if (aPrintRun !== bPrintRun) {
        return bPrintRun - aPrintRun; // Higher print run first
      }

      // Same print run - alphabetical
      return a.name.localeCompare(b.name);
    }

    // For non-parallels or same parallel status, alphabetical
    return a.name.localeCompare(b.name);
  });
}

// Function to extract the base name and variant for proper sorting
function parseSetName(name: string): { prefix: string; variant: string } {
  if (name.startsWith('Base ')) {
    return { prefix: 'Base', variant: name.substring(5) };
  } else if (name.startsWith('Optic ')) {
    return { prefix: 'Optic', variant: name.substring(6) };
  } else if (name === 'Base') {
    return { prefix: 'Base', variant: '' };
  } else if (name === 'Optic') {
    return { prefix: 'Optic', variant: '' };
  }
  return { prefix: '', variant: name };
}

// Enhanced sorting that groups by prefix first
function sortSetsProperlyGrouped(sets: any[]) {
  return sets.sort((a, b) => {
    const aParsed = parseSetName(a.name);
    const bParsed = parseSetName(b.name);

    // Group by prefix first (Base, Optic, then others)
    if (aParsed.prefix !== bParsed.prefix) {
      // Define prefix order: Base first, then Optic, then everything else
      const prefixOrder = ['Base', 'Optic', ''];
      const aIndex = prefixOrder.indexOf(aParsed.prefix);
      const bIndex = prefixOrder.indexOf(bParsed.prefix);

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
    }

    // Within the same prefix group, apply the parallel/print run rules

    // First, base set (no variant) comes before parallels
    if (aParsed.prefix === bParsed.prefix && aParsed.prefix !== '') {
      // Base/Optic without variant comes first
      if (aParsed.variant === '' && bParsed.variant !== '') return -1;
      if (aParsed.variant !== '' && bParsed.variant === '') return 1;
    }

    // Then sort by print run for parallels within same prefix
    const aPrintRun = a.printRun || 0;
    const bPrintRun = b.printRun || 0;

    // If both are parallels of the same prefix
    if (a.isParallel && b.isParallel && aParsed.prefix === bParsed.prefix) {
      // Both have no print run - alphabetical by variant
      if (aPrintRun === 0 && bPrintRun === 0) {
        return aParsed.variant.localeCompare(bParsed.variant);
      }

      // One has print run, one doesn't - no print run first
      if (aPrintRun === 0) return -1;
      if (bPrintRun === 0) return 1;

      // Both have print runs - highest to lowest
      if (aPrintRun !== bPrintRun) {
        return bPrintRun - aPrintRun; // Higher print run first
      }

      // Same print run - alphabetical by variant
      return aParsed.variant.localeCompare(bParsed.variant);
    }

    // Default alphabetical comparison
    return a.name.localeCompare(b.name);
  });
}

async function demonstrateSorting() {
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

    console.log('Current ordering vs Proper ordering:\n');

    // Filter to just Base and Optic sets for demonstration
    const baseAndOpticSets = release.sets.filter(s =>
      s.name.startsWith('Base') || s.name.startsWith('Optic') ||
      s.name === 'Base' || s.name === 'Optic'
    );

    console.log('CURRENT ORDER (alphabetical only):');
    const currentOrder = [...baseAndOpticSets].sort((a, b) => a.name.localeCompare(b.name));
    currentOrder.forEach(s => {
      const printRun = s.printRun ? `/${s.printRun}` : '';
      console.log(`  ${s.name}${printRun} - ${s._count.cards} cards`);
    });

    console.log('\nPROPER ORDER (grouped by prefix, then by rules):');
    const properOrder = sortSetsProperlyGrouped([...baseAndOpticSets]);
    properOrder.forEach(s => {
      const printRun = s.printRun ? `/${s.printRun}` : '';
      console.log(`  ${s.name}${printRun} - ${s._count.cards} cards`);
    });

    // Show the complete proper ordering for all sets
    console.log('\n' + '='.repeat(60));
    console.log('COMPLETE PROPER ORDER FOR ALL SETS:');
    console.log('='.repeat(60));

    // Separate into categories
    const baseSets = release.sets.filter(s => s.type === 'Base');
    const insertSets = release.sets.filter(s => s.type === 'Insert');
    const autoSets = release.sets.filter(s => s.type === 'Autograph');
    const memSets = release.sets.filter(s => s.type === 'Memorabilia');

    console.log('\nBASE SETS:');
    const sortedBase = sortSetsProperlyGrouped(baseSets);
    sortedBase.forEach(s => {
      const printRun = s.printRun ? `/${s.printRun}` : '';
      console.log(`  ${s.name}${printRun} - ${s._count.cards} cards`);
    });

    console.log('\nINSERT SETS:');
    const sortedInserts = sortSetsProperlyGrouped(insertSets);
    sortedInserts.forEach(s => {
      const printRun = s.printRun ? `/${s.printRun}` : '';
      console.log(`  ${s.name}${printRun} - ${s._count.cards} cards`);
    });

    console.log('\nAUTOGRAPH SETS:');
    const sortedAutos = sortSetsProperlyGrouped(autoSets);
    sortedAutos.forEach(s => {
      const printRun = s.printRun ? `/${s.printRun}` : '';
      console.log(`  ${s.name}${printRun} - ${s._count.cards} cards`);
    });

    console.log('\nMEMORABILIA SETS:');
    const sortedMem = sortSetsProperlyGrouped(memSets);
    sortedMem.forEach(s => {
      const printRun = s.printRun ? `/${s.printRun}` : '';
      console.log(`  ${s.name}${printRun} - ${s._count.cards} cards`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

demonstrateSorting();