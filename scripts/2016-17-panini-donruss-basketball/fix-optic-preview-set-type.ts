import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOpticPreviewSetType() {
  try {
    console.log('Fixing "Optic Preview" set type...\n');

    // Find Optic Preview set
    const opticPreviewSet = await prisma.set.findFirst({
      where: {
        slug: { contains: '2016-17' },
        AND: [
          { slug: { contains: 'donruss' } },
          { slug: { contains: 'basketball' } },
          { name: 'Optic Preview' }
        ]
      },
      include: {
        _count: { select: { cards: true } }
      }
    });

    if (!opticPreviewSet) {
      console.error('Optic Preview set not found!');
      return;
    }

    console.log(`Found set: ${opticPreviewSet.name}`);
    console.log(`Slug: ${opticPreviewSet.slug}`);
    console.log(`Current type: ${opticPreviewSet.type}`);
    console.log(`Cards: ${opticPreviewSet._count.cards}`);

    if (opticPreviewSet.type === 'Insert') {
      console.log('\n✅ Set is already classified as Insert, no changes needed.');
      return;
    }

    // Update to Insert type
    const updated = await prisma.set.update({
      where: { id: opticPreviewSet.id },
      data: { type: 'Insert' }
    });

    console.log(`\n✅ Updated set type from "${opticPreviewSet.type}" to "Insert"`);

    // Validation
    console.log('\n===== Validation =====');
    const baseSetCount = await prisma.set.count({
      where: {
        releaseId: opticPreviewSet.releaseId,
        type: 'Base'
      }
    });

    const insertSetCount = await prisma.set.count({
      where: {
        releaseId: opticPreviewSet.releaseId,
        type: 'Insert'
      }
    });

    console.log(`Base sets: ${baseSetCount}`);
    console.log(`Insert sets: ${insertSetCount}`);

    console.log('\n✅ Optic Preview is now correctly classified as Insert!');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixOpticPreviewSetType();
