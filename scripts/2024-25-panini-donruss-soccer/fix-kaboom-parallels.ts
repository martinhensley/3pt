import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixKaboomParallels() {
  try {
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
    });

    if (!release) {
      throw new Error('Release not found');
    }

    // Find the parent Kaboom set
    const kaboomParent = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: 'Kaboom',
        printRun: null,
      },
    });

    if (!kaboomParent) {
      throw new Error('Kaboom parent set not found');
    }

    console.log('Found Kaboom parent set:', kaboomParent.slug);

    // Find the Gold and Black sets
    const kaboomGold = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: 'Kaboom Gold',
      },
    });

    const kaboomBlack = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: 'Kaboom Black',
      },
    });

    if (!kaboomGold || !kaboomBlack) {
      throw new Error('Kaboom Gold or Black set not found');
    }

    console.log('Found Kaboom Gold:', kaboomGold.slug);
    console.log('Found Kaboom Black:', kaboomBlack.slug);

    // Update Gold parallel to point to parent and fix slug
    console.log('\nUpdating Kaboom Gold...');
    await prisma.set.update({
      where: { id: kaboomGold.id },
      data: {
        parentSetId: kaboomParent.id,
        slug: '2024-25-panini-donruss-soccer-insert-kaboom-gold-10',
        mirrorsParentChecklist: true,
      },
    });

    // Update Black parallel to point to parent and fix slug
    console.log('Updating Kaboom Black...');
    await prisma.set.update({
      where: { id: kaboomBlack.id },
      data: {
        parentSetId: kaboomParent.id,
        slug: '2024-25-panini-donruss-soccer-insert-kaboom-black-1-of-1',
        mirrorsParentChecklist: true,
      },
    });

    // Delete cards from parallel sets (they should reference parent's cards)
    console.log('\nDeleting cards from Gold parallel (will reference parent)...');
    const deletedGold = await prisma.card.deleteMany({
      where: { setId: kaboomGold.id },
    });
    console.log(`Deleted ${deletedGold.count} cards from Gold`);

    console.log('Deleting cards from Black parallel (will reference parent)...');
    const deletedBlack = await prisma.card.deleteMany({
      where: { setId: kaboomBlack.id },
    });
    console.log(`Deleted ${deletedBlack.count} cards from Black`);

    console.log('\n✅ Successfully fixed Kaboom parallels!');
    console.log('   Parent: Kaboom (25 cards)');
    console.log('   Parallel: Kaboom Gold /10 (references parent cards)');
    console.log('   Parallel: Kaboom Black 1/1 (references parent cards)');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixKaboomParallels();
