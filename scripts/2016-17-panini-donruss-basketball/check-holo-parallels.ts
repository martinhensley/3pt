import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHoloParallels() {
  try {
    console.log('Checking Holo Laser parallel sets...\n');

    const sets = await prisma.set.findMany({
      where: {
        slug: { contains: '2016-17' },
        AND: [
          { slug: { contains: 'donruss' } },
          { slug: { contains: 'basketball' } },
          { name: { contains: 'Holo' } },
          { name: { contains: 'Laser' } },
        ]
      },
      select: {
        name: true,
        slug: true,
        printRun: true,
        isParallel: true,
        _count: {
          select: { cards: true }
        }
      },
      orderBy: [
        { printRun: 'desc' },
        { name: 'asc' }
      ]
    });

    console.log(`Found ${sets.length} Holo Laser sets:\n`);

    sets.forEach(set => {
      console.log(`Name: ${set.name}`);
      console.log(`Slug: ${set.slug}`);
      console.log(`Print Run: ${set.printRun || 'null (unnumbered)'}`);
      console.log(`Is Parallel: ${set.isParallel}`);
      console.log(`Cards: ${set._count.cards}`);
      console.log('---');
    });

    // Count unnumbered vs numbered
    const unnumbered = sets.filter(s => s.printRun === null);
    const numbered = sets.filter(s => s.printRun !== null);

    console.log(`\nSummary:`);
    console.log(`Unnumbered parallels: ${unnumbered.length}`);
    console.log(`Numbered parallels: ${numbered.length}`);

    if (unnumbered.length > 0) {
      console.log(`\nUnnumbered sets:`);
      unnumbered.forEach(s => console.log(`  - ${s.name}`));
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkHoloParallels();
