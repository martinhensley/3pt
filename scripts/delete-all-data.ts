import { PrismaClient } from '@prisma/client';
import { del, list } from '@vercel/blob';

const prisma = new PrismaClient();

async function deleteAllData() {
  console.log('🗑️  Starting complete database cleanup...\n');

  try {
    // Step 1: Delete all blobs from Vercel Blob storage
    console.log('📦 Step 1: Deleting all blobs from Vercel Blob storage...\n');

    const { blobs } = await list();
    console.log(`📊 Found ${blobs.length} blobs to delete\n`);

    let deletedBlobCount = 0;
    let failedBlobCount = 0;

    for (const blob of blobs) {
      try {
        console.log(`🗑️  Deleting: ${blob.pathname}`);
        await del(blob.url);
        deletedBlobCount++;
      } catch (error) {
        console.error(`❌ Failed to delete ${blob.pathname}:`, error);
        failedBlobCount++;
      }
    }

    console.log(`\n✅ Deleted ${deletedBlobCount} blobs`);
    if (failedBlobCount > 0) {
      console.log(`⚠️  Failed to delete ${failedBlobCount} blobs`);
    }

    // Step 2: Delete all database records (in correct order due to foreign keys)
    console.log('\n📊 Step 2: Deleting all database records...\n');

    // Images (dependent on Release, Set, Card, Post via foreign keys)
    console.log('🗑️  Deleting images...');
    const images = await prisma.image.deleteMany({});
    console.log(`   - Image: ${images.count} records`);

    // Source documents (dependent on Release, Post via entityType)
    console.log('\n🗑️  Deleting source documents...');
    const sourceDocs = await prisma.sourceDocument.deleteMany({});
    console.log(`   - SourceDocument: ${sourceDocs.count} records`);

    // Posts (depends on Release, Set, Card but has no children after junction tables deleted)
    console.log('\n🗑️  Deleting posts...');
    const posts = await prisma.post.deleteMany({});
    console.log(`   - Post: ${posts.count} records`);

    // Cards (depends on Set)
    console.log('\n🗑️  Deleting cards...');
    const cards = await prisma.card.deleteMany({});
    console.log(`   - Card: ${cards.count} records`);

    // Sets (depends on Release, has parent-child relationships)
    console.log('\n🗑️  Deleting sets...');
    const sets = await prisma.set.deleteMany({});
    console.log(`   - Set: ${sets.count} records`);

    // Releases (depends on Manufacturer)
    console.log('\n🗑️  Deleting releases...');
    const releases = await prisma.release.deleteMany({});
    console.log(`   - Release: ${releases.count} records`);

    // Manufacturers (no dependencies)
    console.log('\n🗑️  Deleting manufacturers...');
    const manufacturers = await prisma.manufacturer.deleteMany({});
    console.log(`   - Manufacturer: ${manufacturers.count} records`);

    console.log('\n✨ Database cleanup complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Blobs deleted: ${deletedBlobCount}`);
    console.log(`   - Images deleted: ${images.count}`);
    console.log(`   - Source documents deleted: ${sourceDocs.count}`);
    console.log(`   - Posts deleted: ${posts.count}`);
    console.log(`   - Cards deleted: ${cards.count}`);
    console.log(`   - Sets deleted: ${sets.count}`);
    console.log(`   - Releases deleted: ${releases.count}`);
    console.log(`   - Manufacturers deleted: ${manufacturers.count}`);
    console.log('\n🎉 Database is now empty and ready for fresh content!\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllData()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
