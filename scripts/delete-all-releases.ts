import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllReleases() {
  console.log('🗑️  Deleting all releases from database...\n');

  try {
    // First, get a count of what we're about to delete
    const releaseCount = await prisma.release.count();
    console.log(`Found ${releaseCount} release(s) to delete`);

    if (releaseCount === 0) {
      console.log('✅ No releases to delete');
      return;
    }

    // Get list of releases before deleting
    const releases = await prisma.release.findMany({
      select: {
        id: true,
        name: true,
        year: true,
        slug: true,
      },
    });

    console.log('\nReleases to delete:');
    releases.forEach((release) => {
      console.log(`  - ${release.year} ${release.name} (${release.slug})`);
    });

    // Delete all releases (cascading deletes will remove related data)
    console.log('\n🗑️  Deleting releases...');
    const result = await prisma.release.deleteMany({});

    console.log(`✅ Successfully deleted ${result.count} release(s)`);
    console.log('\nNote: Related sets, cards, and images were also deleted due to cascade rules.');
  } catch (error) {
    console.error('❌ Error deleting releases:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllReleases()
  .catch((e) => {
    console.error('Failed to delete releases:', e);
    process.exit(1);
  });
