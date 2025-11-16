import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the Obsidian Soccer release
    const release = await prisma.release.findUnique({
      where: {
        slug: '2024-25-panini-obsidian-soccer'
      }
    });

    if (!release) {
      console.error('Release not found: 2024-25-panini-obsidian-soccer');
      return;
    }

    console.log(`Found release: ${release.name}`);

    // Path to the checklist file
    const checklistPath = '/Users/mh/Desktop/2024-25-Panini-Obsidian-Soccer-Cards-Checklist.xls';

    if (!fs.existsSync(checklistPath)) {
      console.error(`Checklist file not found: ${checklistPath}`);
      return;
    }

    console.log('Reading checklist file...');
    const fileBuffer = fs.readFileSync(checklistPath);
    const fileName = `${Date.now()}-2024-25-Panini-Obsidian-Soccer-Cards-Checklist.xls`;

    console.log('Uploading to Vercel Blob...');
    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      contentType: 'application/vnd.ms-excel'
    });

    console.log(`✓ Uploaded to: ${blob.url}`);

    // Get file size
    const stats = fs.statSync(checklistPath);
    const fileSize = stats.size;

    // Create a SourceDocument entry
    console.log('Creating source document entry...');
    const sourceDoc = await prisma.sourceDocument.create({
      data: {
        filename: '2024-25-Panini-Obsidian-Soccer-Cards-Checklist.xls',
        displayName: '2024-25 Panini Obsidian Soccer Checklist',
        blobUrl: blob.url,
        mimeType: 'application/vnd.ms-excel',
        fileSize: fileSize,
        documentType: 'CHECKLIST',
        entityType: 'RELEASE',
        tags: ['2024-25', 'Panini', 'Obsidian', 'Soccer', 'Checklist'],
        uploadedById: 'admin', // Replace with actual admin user ID if needed
        releaseId: release.id,
        description: 'Official checklist for 2024-25 Panini Obsidian Soccer'
      }
    });

    console.log(`✓ Created source document: ${sourceDoc.id}`);
    console.log('\n=== Upload Complete ===');
    console.log(`Release: ${release.name}`);
    console.log(`File: ${sourceDoc.filename}`);
    console.log(`URL: ${blob.url}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
