import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validate() {
  const release = await prisma.release.findUnique({
    where: { slug: '2024-25-panini-obsidian-soccer' },
    include: {
      sets: {
        orderBy: { name: 'asc' }
      }
    }
  });

  if (!release) {
    console.log('Release not found!');
    return;
  }

  console.log('='.repeat(70));
  console.log('2024-25 PANINI OBSIDIAN SOCCER - IMPORT VALIDATION');
  console.log('='.repeat(70));
  console.log('');

  // Total counts
  const totalSets = await prisma.set.count({
    where: { releaseId: release.id }
  });
  const totalCards = await prisma.card.count({
    where: { set: { releaseId: release.id } }
  });

  console.log('TOTAL COUNTS:');
  console.log('  Sets:', totalSets);
  console.log('  Cards:', totalCards);
  console.log('');

  // Breakdown by type
  const baseSets = await prisma.set.count({
    where: { releaseId: release.id, type: 'Base' }
  });
  const baseCards = await prisma.card.count({
    where: { set: { releaseId: release.id, type: 'Base' } }
  });

  const insertSets = await prisma.set.count({
    where: { releaseId: release.id, type: 'Insert' }
  });
  const insertCards = await prisma.card.count({
    where: { set: { releaseId: release.id, type: 'Insert' } }
  });

  const autoSets = await prisma.set.count({
    where: { releaseId: release.id, type: 'Autograph' }
  });
  const autoCards = await prisma.card.count({
    where: { set: { releaseId: release.id, type: 'Autograph' } }
  });

  const memSets = await prisma.set.count({
    where: { releaseId: release.id, type: 'Memorabilia' }
  });
  const memCards = await prisma.card.count({
    where: { set: { releaseId: release.id, type: 'Memorabilia' } }
  });

  console.log('BREAKDOWN BY TYPE:');
  console.log('  Base Sets:', baseSets, '| Cards:', baseCards);
  console.log('  Insert Sets:', insertSets, '| Cards:', insertCards);
  console.log('  Autograph Sets:', autoSets, '| Cards:', autoCards);
  console.log('  Memorabilia Sets:', memSets, '| Cards:', memCards);
  console.log('');

  // Parallel breakdown
  const parallelSets = await prisma.set.count({
    where: { releaseId: release.id, isParallel: true }
  });
  const parallelCards = await prisma.card.count({
    where: { set: { releaseId: release.id, isParallel: true } }
  });

  console.log('PARALLEL BREAKDOWN:');
  console.log('  Parallel Sets:', parallelSets);
  console.log('  Parallel Cards:', parallelCards);
  console.log('  Non-Parallel Sets:', totalSets - parallelSets);
  console.log('  Non-Parallel Cards:', totalCards - parallelCards);
  console.log('');

  // Sample sets
  console.log('SAMPLE SETS (First 10):');
  const sampleSets = await prisma.set.findMany({
    where: { releaseId: release.id },
    take: 10,
    orderBy: { name: 'asc' },
    select: {
      name: true,
      type: true,
      isParallel: true,
      printRun: true,
      _count: {
        select: { cards: true }
      }
    }
  });

  sampleSets.forEach(set => {
    console.log(`  - ${set.name}`);
    console.log(`    Type: ${set.type} | Parallel: ${set.isParallel} | Print Run: ${set.printRun || 'N/A'} | Cards: ${set._count.cards}`);
  });

  await prisma.$disconnect();
}

validate();
