/**
 * Blob Storage Cleanup Utilities
 *
 * This module provides functions to keep Vercel Blob storage synchronized
 * with database records. It automatically deletes blobs when their associated
 * database records are removed.
 */

import { del } from '@vercel/blob';

/**
 * Extract blob URLs from various database entities
 */
export function extractBlobUrls(entity: any): string[] {
  const urls: string[] = [];

  // Direct blob URL fields
  if (entity.blobUrl && typeof entity.blobUrl === 'string') {
    urls.push(entity.blobUrl);
  }

  // Image URLs
  if (entity.url && typeof entity.url === 'string' && entity.url.includes('blob.vercel-storage.com')) {
    urls.push(entity.url);
  }
  if (entity.imageFront && typeof entity.imageFront === 'string' && entity.imageFront.includes('blob.vercel-storage.com')) {
    urls.push(entity.imageFront);
  }
  if (entity.imageBack && typeof entity.imageBack === 'string' && entity.imageBack.includes('blob.vercel-storage.com')) {
    urls.push(entity.imageBack);
  }

  // Source files (JSON field)
  if (entity.sourceFiles && Array.isArray(entity.sourceFiles)) {
    entity.sourceFiles.forEach((file: any) => {
      if (file.url && typeof file.url === 'string' && file.url.includes('blob.vercel-storage.com')) {
        urls.push(file.url);
      }
    });
  }

  // Images array
  if (entity.images && Array.isArray(entity.images)) {
    entity.images.forEach((image: any) => {
      if (image.url && typeof image.url === 'string' && image.url.includes('blob.vercel-storage.com')) {
        urls.push(image.url);
      }
    });
  }

  return urls;
}

/**
 * Delete a single blob from storage
 */
export async function deleteBlob(url: string): Promise<boolean> {
  try {
    console.log(`🗑️  Deleting blob: ${url}`);
    await del(url);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete blob ${url}:`, error);
    return false;
  }
}

/**
 * Delete multiple blobs from storage
 */
export async function deleteBlobs(urls: string[]): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;

  for (const url of urls) {
    const success = await deleteBlob(url);
    if (success) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { deleted, failed };
}

/**
 * Delete all blobs associated with a database entity
 */
export async function deleteBlobsForEntity(entity: any): Promise<{ deleted: number; failed: number }> {
  const urls = extractBlobUrls(entity);

  if (urls.length === 0) {
    console.log('No blob URLs found for entity');
    return { deleted: 0, failed: 0 };
  }

  console.log(`Found ${urls.length} blob URLs to delete`);
  return await deleteBlobs(urls);
}

/**
 * Delete blobs before removing a SourceDocument
 */
export async function cleanupSourceDocument(document: { blobUrl?: string }): Promise<boolean> {
  if (!document.blobUrl) return true;

  return await deleteBlob(document.blobUrl);
}

/**
 * Delete blobs before removing an Image
 */
export async function cleanupImage(image: { url?: string }): Promise<boolean> {
  if (!image.url || !image.url.includes('blob.vercel-storage.com')) return true;

  return await deleteBlob(image.url);
}

/**
 * Delete blobs before removing a Release (including all associated images and source files)
 */
export async function cleanupRelease(release: {
  sourceFiles?: any[];
  images?: Array<{ url?: string }>;
  sourceDocuments?: Array<{ blobUrl?: string }>;
}): Promise<{ deleted: number; failed: number }> {
  const urls: string[] = [];

  // Collect URLs from sourceFiles
  if (release.sourceFiles && Array.isArray(release.sourceFiles)) {
    release.sourceFiles.forEach((file: any) => {
      if (file.url && file.url.includes('blob.vercel-storage.com')) {
        urls.push(file.url);
      }
    });
  }

  // Collect URLs from images
  if (release.images && Array.isArray(release.images)) {
    release.images.forEach((image) => {
      if (image.url && image.url.includes('blob.vercel-storage.com')) {
        urls.push(image.url);
      }
    });
  }

  // Note: sourceDocuments are separate entities and should be handled separately
  // They may be shared across multiple releases

  if (urls.length === 0) {
    console.log('No blob URLs found for release');
    return { deleted: 0, failed: 0 };
  }

  console.log(`Found ${urls.length} blob URLs to delete for release`);
  return await deleteBlobs(urls);
}

/**
 * Delete blobs before removing a Card
 */
export async function cleanupCard(card: {
  imageFront?: string;
  imageBack?: string;
  images?: Array<{ url?: string }>;
}): Promise<{ deleted: number; failed: number }> {
  const urls: string[] = [];

  if (card.imageFront && card.imageFront.includes('blob.vercel-storage.com')) {
    urls.push(card.imageFront);
  }

  if (card.imageBack && card.imageBack.includes('blob.vercel-storage.com')) {
    urls.push(card.imageBack);
  }

  if (card.images && Array.isArray(card.images)) {
    card.images.forEach((image) => {
      if (image.url && image.url.includes('blob.vercel-storage.com')) {
        urls.push(image.url);
      }
    });
  }

  if (urls.length === 0) {
    console.log('No blob URLs found for card');
    return { deleted: 0, failed: 0 };
  }

  console.log(`Found ${urls.length} blob URLs to delete for card`);
  return await deleteBlobs(urls);
}