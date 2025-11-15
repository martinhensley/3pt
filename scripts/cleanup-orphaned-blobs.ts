/**
 * Cleanup Orphaned Blobs Script
 *
 * This script identifies and deletes blob files that are no longer referenced
 * in the database. It should be run periodically to keep storage clean.
 */

import { list, del } from '@vercel/blob';
import { prisma } from '../lib/prisma';

interface BlobReference {
  url: string;
  source: string;
}

async function getAllDatabaseBlobUrls(): Promise<Set<string>> {
  const urls = new Set<string>();

  console.log('Collecting blob URLs from database...');

  // Collect from SourceDocument
  const sourceDocuments = await prisma.sourceDocument.findMany({
    select: { blobUrl: true }
  });
  sourceDocuments.forEach(doc => {
    if (doc.blobUrl) urls.add(doc.blobUrl);
  });
  console.log(`  Found ${sourceDocuments.length} source documents`);

  // Collect from Image
  const images = await prisma.image.findMany({
    select: { url: true }
  });
  images.forEach(img => {
    if (img.url && img.url.includes('blob.vercel-storage.com')) {
      urls.add(img.url);
    }
  });
  console.log(`  Found ${images.filter(img => img.url?.includes('blob.vercel-storage.com')).length} image blobs`);

  // Collect from Card (imageFront and imageBack)
  const cards = await prisma.card.findMany({
    select: { imageFront: true, imageBack: true }
  });
  cards.forEach(card => {
    if (card.imageFront && card.imageFront.includes('blob.vercel-storage.com')) {
      urls.add(card.imageFront);
    }
    if (card.imageBack && card.imageBack.includes('blob.vercel-storage.com')) {
      urls.add(card.imageBack);
    }
  });
  console.log(`  Found ${cards.filter(c => c.imageFront || c.imageBack).length} cards with images`);

  // Collect from Release sourceFiles (JSON field)
  const releases = await prisma.release.findMany({
    select: { sourceFiles: true }
  });
  releases.forEach(release => {
    if (release.sourceFiles && Array.isArray(release.sourceFiles)) {
      (release.sourceFiles as any[]).forEach(file => {
        if (file.url && file.url.includes('blob.vercel-storage.com')) {
          urls.add(file.url);
        }
      });
    }
  });
  console.log(`  Found ${releases.filter(r => r.sourceFiles).length} releases with source files`);

  return urls;
}

async function cleanupOrphanedBlobs(dryRun: boolean = false) {
  try {
    console.log('=== Orphaned Blob Cleanup ===');
    console.log(`Mode: ${dryRun ? 'DRY RUN (no actual deletions)' : 'LIVE (will delete orphaned blobs)'}`);
    console.log('');

    // Get all blob URLs referenced in database
    const databaseUrls = await getAllDatabaseBlobUrls();
    console.log(`\nTotal database blob references: ${databaseUrls.size}`);

    // List all blobs in storage
    const { blobs } = await list();
    console.log(`Total blobs in storage: ${blobs.length}`);

    // Find orphaned blobs
    const orphanedBlobs = blobs.filter(blob => !databaseUrls.has(blob.url));
    console.log(`Orphaned blobs found: ${orphanedBlobs.length}`);

    if (orphanedBlobs.length === 0) {
      console.log('\n✅ No orphaned blobs found. Storage is clean!');
      return;
    }

    console.log('\nOrphaned blobs to delete:');
    orphanedBlobs.forEach(blob => {
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      console.log(`  - ${blob.pathname} (${sizeMB} MB)`);
    });

    // Calculate total size
    const totalSizeBytes = orphanedBlobs.reduce((sum, blob) => sum + blob.size, 0);
    const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
    console.log(`\nTotal space to reclaim: ${totalSizeMB} MB`);

    if (dryRun) {
      console.log('\n⚠️  DRY RUN: No blobs were deleted. Run with --live to actually delete.');
      return;
    }

    // Delete orphaned blobs
    console.log('\nDeleting orphaned blobs...');
    let deletedCount = 0;
    let errorCount = 0;

    for (const blob of orphanedBlobs) {
      try {
        await del(blob.url);
        console.log(`  ✅ Deleted: ${blob.pathname}`);
        deletedCount++;
      } catch (error) {
        console.error(`  ❌ Failed to delete ${blob.pathname}:`, error);
        errorCount++;
      }
    }

    console.log('\n=== Cleanup Complete ===');
    console.log(`Deleted: ${deletedCount} blobs`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Space reclaimed: ${totalSizeMB} MB`);

  } catch (error) {
    console.error('Error during orphaned blob cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--live');

// Run the cleanup
cleanupOrphanedBlobs(dryRun);