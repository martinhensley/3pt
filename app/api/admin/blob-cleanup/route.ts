/**
 * API Endpoint for Blob Cleanup
 *
 * This endpoint can be called periodically (e.g., via Vercel Cron or external service)
 * to clean up orphaned blobs. Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { list, del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

async function getAllDatabaseBlobUrls(): Promise<Set<string>> {
  const urls = new Set<string>();

  // Collect from SourceDocument
  const sourceDocuments = await prisma.sourceDocument.findMany({
    select: { blobUrl: true }
  });
  sourceDocuments.forEach(doc => {
    if (doc.blobUrl) urls.add(doc.blobUrl);
  });

  // Collect from Image
  const images = await prisma.image.findMany({
    select: { url: true }
  });
  images.forEach(img => {
    if (img.url && img.url.includes('blob.vercel-storage.com')) {
      urls.add(img.url);
    }
  });

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

  return urls;
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all blob URLs referenced in database
    const databaseUrls = await getAllDatabaseBlobUrls();

    // List all blobs in storage
    const { blobs } = await list();

    // Find orphaned blobs
    const orphanedBlobs = blobs.filter(blob => !databaseUrls.has(blob.url));

    if (orphanedBlobs.length === 0) {
      return NextResponse.json({
        message: 'No orphaned blobs found',
        stats: {
          totalBlobs: blobs.length,
          referencedBlobs: databaseUrls.size,
          orphanedBlobs: 0,
          deletedBlobs: 0,
          spaceReclaimed: 0,
        }
      });
    }

    // Calculate total size before deletion
    const totalSizeBytes = orphanedBlobs.reduce((sum, blob) => sum + blob.size, 0);

    // Delete orphaned blobs
    let deletedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const blob of orphanedBlobs) {
      try {
        await del(blob.url);
        deletedCount++;
      } catch (error) {
        errorCount++;
        errors.push(`Failed to delete ${blob.pathname}: ${error}`);
      }
    }

    return NextResponse.json({
      message: `Cleanup completed: ${deletedCount} blobs deleted`,
      stats: {
        totalBlobs: blobs.length,
        referencedBlobs: databaseUrls.size,
        orphanedBlobs: orphanedBlobs.length,
        deletedBlobs: deletedCount,
        failedDeletions: errorCount,
        spaceReclaimed: totalSizeBytes,
        spaceReclaimedMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Blob cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup blobs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET method for checking cleanup stats without actually deleting
export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all blob URLs referenced in database
    const databaseUrls = await getAllDatabaseBlobUrls();

    // List all blobs in storage
    const { blobs } = await list();

    // Find orphaned blobs
    const orphanedBlobs = blobs.filter(blob => !databaseUrls.has(blob.url));

    // Calculate total size
    const totalSizeBytes = orphanedBlobs.reduce((sum, blob) => sum + blob.size, 0);

    return NextResponse.json({
      message: 'Blob cleanup status',
      stats: {
        totalBlobs: blobs.length,
        referencedBlobs: databaseUrls.size,
        orphanedBlobs: orphanedBlobs.length,
        potentialSpaceToReclaim: totalSizeBytes,
        potentialSpaceToReclaimMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
      },
      orphanedFiles: orphanedBlobs.map(blob => ({
        pathname: blob.pathname,
        size: blob.size,
        sizeMB: (blob.size / (1024 * 1024)).toFixed(2),
      })),
    });

  } catch (error) {
    console.error('Blob cleanup check error:', error);
    return NextResponse.json(
      { error: 'Failed to check blob status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}