import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRookiesSetType() {
  try {
    console.log('Fixing "The Rookies" set type...\n');

    // Find The Rookies set
    const rookiesSet = await prisma.set.findFirst({
      where: {
        slug: { contains: '2016-17' },
        AND: [
          { slug: { contains: 'donruss' } },
          { slug: { contains: 'basketball' } },
          { name: 'The Rookies' }
        ]
      },
      include: {
        _count: { select: { cards: true } }
      }
    });

    if (!rookiesSet) {
      console.error('The Rookies set not found!');
      return;
    }

    console.log(`Found set: ${rookiesSet.name}`);
    console.log(`Slug: ${rookiesSet.slug}`);
    console.log(`Current type: ${rookiesSet.type}`);
    console.log(`Cards: ${rookiesSet._count.cards}`);

    if (rookiesSet.type === 'Insert') {
      console.log('\n✅ Set is already classified as Insert, no changes needed.');
      return;
    }

    // Update to Insert type
    const updated = await prisma.set.update({
      where: { id: rookiesSet.id },
      data: { type: 'Insert' }
    });

    console.log(`\n✅ Updated set type from "${rookiesSet.type}" to "Insert"`);

    // Validation
    console.log('\n===== Validation =====');
    const baseSetCount = await prisma.set.count({
      where: {
        releaseId: rookiesSet.releaseId,
        type: 'Base'
      }
    });

    const insertSetCount = await prisma.set.count({
      where: {
        releaseId: rookiesSet.releaseId,
        type: 'Insert'
      }
    });

    console.log(`Base sets: ${baseSetCount}`);
    console.log(`Insert sets: ${insertSetCount}`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixRookiesSetType();
