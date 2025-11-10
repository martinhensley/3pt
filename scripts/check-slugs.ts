import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSlugs() {
  console.log('=== OBSIDIAN BASE SET ===\n');

  const baseSet = await prisma.set.findUnique({
    where: { slug: '2024-25-obsidian-soccer-base' },
    include: {
      parallelSets: true,
      cards: {
        select: {
          parallelType: true,
        },
        distinct: ['parallelType'],
      },
    },
  });

  if (baseSet) {
    console.log(`Set: ${baseSet.name}`);
    console.log(`Slug: ${baseSet.slug}`);
    console.log(`Type: ${baseSet.type}`);
    console.log(`\nParallel child sets (${baseSet.parallelSets.length}):`);

    if (baseSet.parallelSets.length > 0) {
      baseSet.parallelSets.forEach(ps => {
        console.log(`  - ${ps.name}`);
        console.log(`    Slug: ${ps.slug}`);
        console.log(`    Print Run: ${ps.printRun || 'null'}\n`);
      });
    } else {
      console.log('  (No parallel child sets created yet)\n');
    }

    console.log(`Unique parallel types in cards (${baseSet.cards.length}):`);
    baseSet.cards.forEach(card => {
      console.log(`  - ${card.parallelType || 'null'}`);
    });
  } else {
    console.log('Base set not found!\n');
  }

  console.log('\n=== EQUINOX INSERT SET ===\n');

  const equinoxSet = await prisma.set.findFirst({
    where: {
      name: { contains: 'Equinox', mode: 'insensitive' },
      release: {
        name: { contains: 'Obsidian', mode: 'insensitive' },
      },
    },
    include: {
      parallelSets: true,
      cards: {
        select: {
          parallelType: true,
        },
        distinct: ['parallelType'],
      },
    },
  });

  if (equinoxSet) {
    console.log(`Set: ${equinoxSet.name}`);
    console.log(`Slug: ${equinoxSet.slug}`);
    console.log(`Type: ${equinoxSet.type}`);
    console.log(`\nParallel child sets (${equinoxSet.parallelSets.length}):`);

    if (equinoxSet.parallelSets.length > 0) {
      equinoxSet.parallelSets.forEach(ps => {
        console.log(`  - ${ps.name}`);
        console.log(`    Slug: ${ps.slug}`);
        console.log(`    Print Run: ${ps.printRun || 'null'}\n`);
      });
    } else {
      console.log('  (No parallel child sets created yet)\n');
    }

    console.log(`Unique parallel types in cards (${equinoxSet.cards.length}):`);
    equinoxSet.cards.forEach(card => {
      console.log(`  - ${card.parallelType || 'null'}`);
    });
  } else {
    console.log('Equinox set not found!\n');
  }

  await prisma.$disconnect();
}

checkSlugs();
