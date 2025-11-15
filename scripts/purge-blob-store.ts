import { list, del } from '@vercel/blob';
import { prisma } from '../lib/prisma';

async function purgeBlobStore() {
  try {
    console.log('Starting blob store purge...');

    // First, get the source document URL for the 2024-25 Panini Donruss Soccer release
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
      include: {
        sourceDocuments: true
      }
    });

    if (!release) {
      console.log('Release not found');
      return;
    }

    // Collect URLs to preserve
    const urlsToPreserve = new Set<string>();

    // Add sourceDocuments URLs
    if (release.sourceDocuments) {
      release.sourceDocuments.forEach(doc => {
        if (doc.blobUrl) {
          urlsToPreserve.add(doc.blobUrl);
          console.log('Preserving source document:', doc.displayName, doc.blobUrl);
        }
      });
    }

    // Also check sourceFiles (legacy field)
    if (release.sourceFiles && Array.isArray(release.sourceFiles)) {
      (release.sourceFiles as any[]).forEach(file => {
        if (file.url) {
          urlsToPreserve.add(file.url);
          console.log('Preserving legacy source file:', file.filename, file.url);
        }
      });
    }

    // List all blobs in the store
    const { blobs } = await list();

    console.log(`Found ${blobs.length} blobs in storage`);
    console.log(`Preserving ${urlsToPreserve.size} URLs`);

    // Delete blobs that are not in the preserve list
    let deletedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const blob of blobs) {
      if (urlsToPreserve.has(blob.url)) {
        console.log(`✅ Keeping: ${blob.pathname}`);
        skippedCount++;
      } else {
        try {
          console.log(`🗑️  Deleting: ${blob.pathname}`);
          await del(blob.url);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Failed to delete ${blob.pathname}:`, error);
          errorCount++;
        }
      }
    }

    console.log('\n=== Purge Complete ===');
    console.log(`Deleted: ${deletedCount} blobs`);
    console.log(`Preserved: ${skippedCount} blobs`);
    console.log(`Errors: ${errorCount}`);

  } catch (error) {
    console.error('Error during blob purge:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the purge
purgeBlobStore();