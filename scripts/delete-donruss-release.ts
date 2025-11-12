import { prisma } from '../lib/prisma';

/**
 * Deletes the 2024-25 Donruss Soccer release and all associated data
 */
async function deleteDonrussRelease() {
  console.log('🗑️  Deleting 2024-25 Donruss Soccer release...\n');

  // Find the release
  const release = await prisma.release.findFirst({
    where: {
      name: { contains: 'Donruss Soccer', mode: 'insensitive' },
      year: '2024-25'
    },
    include: {
      sets: {
        include: {
          _count: {
            select: { cards: true, parallelSets: true }
          }
        }
      },
      sourceDocuments: true,
    }
  });

  if (!release) {
    console.log('❌ Release not found');
    return;
  }

  console.log(`Found release: ${release.year} ${release.name}`);
  console.log(`  Sets: ${release.sets.length}`);
  console.log(`  Total cards: ${release.sets.reduce((sum, s) => sum + s._count.cards, 0)}`);
  console.log(`  Source documents: ${release.sourceDocuments.length}\n`);

  // Confirm deletion
  console.log('⚠️  This will delete:');
  console.log(`   - The release record`);
  console.log(`   - ${release.sets.length} sets (including parallels)`);
  console.log(`   - All cards in those sets`);
  console.log(`   - Links to source documents (documents themselves will be kept)\n`);

  // Delete the release (cascades to sets, cards, etc.)
  await prisma.release.delete({
    where: { id: release.id }
  });

  console.log('✅ Release deleted successfully!\n');
  console.log('You can now re-import with the correct checklist.');
}

// Run the deletion
deleteDonrussRelease()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
