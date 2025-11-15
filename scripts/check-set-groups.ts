import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSetGroups() {
  try {
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
      include: { sets: true }
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

    // Helper function to extract base name from a set name
    function getBaseSetName(name: string): string {
      // Remove trailing numbers (print runs)
      let baseName = name.replace(/\s+\d+$/, '').trim();
      // Remove "Parallel" suffix if present
      baseName = baseName.replace(/\s+Parallel$/i, '').trim();
      return baseName;
    }

    // Show Insert sets
    console.log('INSERT SETS:');
    const insertSets = setsByType.get('Insert') || [];
    const insertGroups = new Map<string, any[]>();
    insertSets.forEach(set => {
      const baseName = getBaseSetName(set.name);
      if (!insertGroups.has(baseName)) {
        insertGroups.set(baseName, []);
      }
      insertGroups.get(baseName)!.push(set);
    });

    for (const [baseName, sets] of insertGroups) {
      console.log(`\n  ${baseName} (${sets.length} variants):`);
      sets.forEach(s => {
        const pr = s.printRun ? `/${s.printRun}` : '';
        const parallel = s.isParallel ? ' [PARALLEL]' : '';
        console.log(`    - ${s.name}${pr}${parallel}`);
      });
    }

    // Show Auto sets
    console.log('\n\nAUTOGRAPH SETS:');
    const autoSets = setsByType.get('Autograph') || [];
    const autoGroups = new Map<string, any[]>();
    autoSets.forEach(set => {
      const baseName = getBaseSetName(set.name);
      if (!autoGroups.has(baseName)) {
        autoGroups.set(baseName, []);
      }
      autoGroups.get(baseName)!.push(set);
    });

    for (const [baseName, sets] of autoGroups) {
      console.log(`\n  ${baseName} (${sets.length} variants):`);
      sets.forEach(s => {
        const pr = s.printRun ? `/${s.printRun}` : '';
        const parallel = s.isParallel ? ' [PARALLEL]' : '';
        console.log(`    - ${s.name}${pr}${parallel}`);
      });
    }

    // Show Memorabilia sets
    console.log('\n\nMEMORABILIA SETS:');
    const memSets = setsByType.get('Memorabilia') || [];
    const memGroups = new Map<string, any[]>();
    memSets.forEach(set => {
      const baseName = getBaseSetName(set.name);
      if (!memGroups.has(baseName)) {
        memGroups.set(baseName, []);
      }
      memGroups.get(baseName)!.push(set);
    });

    for (const [baseName, sets] of memGroups) {
      console.log(`\n  ${baseName} (${sets.length} variants):`);
      sets.forEach(s => {
        const pr = s.printRun ? `/${s.printRun}` : '';
        const parallel = s.isParallel ? ' [PARALLEL]' : '';
        console.log(`    - ${s.name}${pr}${parallel}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSetGroups();