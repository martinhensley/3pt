import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Upload a checklist file to Vercel Blob Storage and create a SourceDocument record
 * @param filePath - Absolute path to the checklist file (e.g., /Users/mh/Desktop/checklist.xlsx)
 * @param releaseId - ID of the release this checklist belongs to
 * @param displayName - Optional custom display name (defaults to filename without extension)
 * @returns The created SourceDocument record
 */
export async function uploadChecklistToRelease(
  filePath: string,
  releaseId: string,
  displayName?: string
) {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    const ext = path.extname(filePath);

    // Determine MIME type based on extension
    let mimeType = 'application/octet-stream';
    if (ext === '.xlsx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (ext === '.xls') {
      mimeType = 'application/vnd.ms-excel';
    } else if (ext === '.csv') {
      mimeType = 'text/csv';
    } else if (ext === '.pdf') {
      mimeType = 'application/pdf';
    } else if (ext === '.txt') {
      mimeType = 'text/plain';
    }

    // Generate blob path
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sanitizedName = filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    const blobPath = `checklists/${year}/${month}/${timestamp}-${sanitizedName}${ext}`;

    console.log(`📤 Uploading ${filename} to Vercel Blob Storage...`);

    // Upload to Vercel Blob
    const blob = await put(blobPath, fileBuffer, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log(`✅ Uploaded to: ${blob.url}`);

    // Create display name
    const finalDisplayName = displayName || filename.replace(/\.[^/.]+$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Create SourceDocument record
    const sourceDocument = await prisma.sourceDocument.create({
      data: {
        filename,
        displayName: finalDisplayName,
        blobUrl: blob.url,
        mimeType,
        documentType: 'CHECKLIST',
        entityType: 'RELEASE',
        tags: [],
        uploadedById: 'import-script',
        releaseId,
        usageContext: 'Checklist used for automated card data import',
      },
    });

    console.log(`📝 Created SourceDocument record: ${sourceDocument.id}`);

    return sourceDocument;
  } catch (error) {
    console.error('❌ Failed to upload checklist:', error);
    throw error;
  }
}

/**
 * Check if a checklist has already been uploaded for a release
 * @param releaseId - ID of the release
 * @param filename - Filename to check for
 * @returns The existing SourceDocument if found, null otherwise
 */
export async function getExistingChecklist(releaseId: string, filename: string) {
  return await prisma.sourceDocument.findFirst({
    where: {
      releaseId,
      filename,
      documentType: 'CHECKLIST',
    },
  });
}
