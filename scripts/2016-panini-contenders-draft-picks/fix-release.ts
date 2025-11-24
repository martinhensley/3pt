import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRelease() {
  console.log('🔧 Fixing release slug issue...\n');

  // Get both releases
  const wrongRelease = await prisma.release.findUnique({
    where: { slug: '2016-panini-contenders-draft-picks' },
    include: {
      sets: {
        include: {
          cards: true,
        },
      },
    },
  });

  const correctRelease = await prisma.release.findUnique({
    where: { slug: '2016-panini-contenders-draft-picks-basketball' },
  });

  if (!wrongRelease) {
    console.log('❌ Wrong release not found');
    return;
  }

  if (!correctRelease) {
    console.log('❌ Correct release not found');
    return;
  }

  console.log(`📦 Moving ${wrongRelease.sets.length} sets and their cards...`);
  console.log(`   From: ${wrongRelease.slug}`);
  console.log(`   To: ${correctRelease.slug}\n`);

  // Move source files
  if (wrongRelease.sourceFiles) {
    console.log('📤 Moving source files...');
    await prisma.release.update({
      where: { id: correctRelease.id },
      data: {
        sourceFiles: wrongRelease.sourceFiles,
      },
    });
    console.log('✅ Source files moved\n');
  }

  // Move each set to the correct release
  for (const set of wrongRelease.sets) {
    console.log(`   Moving set: ${set.name} (${set.cards.length} cards)`);

    await prisma.set.update({
      where: { id: set.id },
      data: {
        releaseId: correctRelease.id,
      },
    });
  }

  console.log(`\n✅ Moved ${wrongRelease.sets.length} sets\n`);

  // Delete the wrong release
  console.log('🗑️  Deleting incorrect release...');
  await prisma.release.delete({
    where: { id: wrongRelease.id },
  });
  console.log('✅ Deleted incorrect release\n');

  // Verify
  const updated = await prisma.release.findUnique({
    where: { slug: '2016-panini-contenders-draft-picks-basketball' },
    include: {
      sets: {
        include: {
          _count: { select: { cards: true } },
        },
      },
    },
  });

  if (updated) {
    const totalCards = updated.sets.reduce((sum, s) => sum + s._count.cards, 0);
    console.log('📊 Verification:');
    console.log(`   Release: ${updated.name}`);
    console.log(`   Slug: ${updated.slug}`);
    console.log(`   Sets: ${updated.sets.length}`);
    console.log(`   Total Cards: ${totalCards}`);
  }

  console.log('\n✅ Fix complete!');
}

fixRelease()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
