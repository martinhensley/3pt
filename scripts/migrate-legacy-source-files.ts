import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LegacySourceFile {
  url: string;
  type: string;
  filename: string;
}

async function main() {
  console.log('\n🔄 Migrating legacy sourceFiles to sourceDocuments...\n');

  // Get all releases with sourceFiles
  const releases = await prisma.release.findMany({
    where: {
      sourceFiles: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      sourceFiles: true,
      sourceDocuments: {
        select: {
          id: true,
          blobUrl: true,
          filename: true,
        },
      },
    },
  });

  console.log(`Found ${releases.length} releases with legacy sourceFiles\n`);

  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const release of releases) {
    console.log(`\n📄 Processing: ${release.name}`);

    const legacyFiles = release.sourceFiles as LegacySourceFile[] | null;
    if (!legacyFiles || !Array.isArray(legacyFiles)) {
      console.log('  ⚠️  No valid sourceFiles array found, skipping');
      continue;
    }

    console.log(`  Found ${legacyFiles.length} legacy file(s)`);

    for (const file of legacyFiles) {
      // Check if this file already exists in sourceDocuments
      const existingDoc = release.sourceDocuments.find(
        (doc) => doc.blobUrl === file.url || doc.filename === file.filename
      );

      if (existingDoc) {
        console.log(`  ⏭️  Skipped: ${file.filename} (already exists in sourceDocuments)`);
        totalSkipped++;
        continue;
      }

      // Determine mime type from file.type or filename extension
      let mimeType = file.type;
      if (mimeType === 'pdf') {
        mimeType = 'application/pdf';
      } else if (mimeType.match(/^(png|jpg|jpeg|webp)$/)) {
        mimeType = `image/${mimeType}`;
      } else if (!mimeType.includes('/')) {
        // If it's not a proper MIME type, try to infer from filename
        const ext = file.filename.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') {
          mimeType = 'application/pdf';
        } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
          mimeType = `image/${ext}`;
        } else {
          mimeType = 'application/octet-stream';
        }
      }

      // Determine document type based on filename or type
      let documentType = 'OTHER';
      const lowerFilename = file.filename.toLowerCase();
      if (lowerFilename.includes('sell-sheet') || lowerFilename.includes('sellsheet')) {
        documentType = 'SELL_SHEET';
      } else if (lowerFilename.includes('checklist')) {
        documentType = 'CHECKLIST';
      } else if (lowerFilename.includes('press') || lowerFilename.includes('release')) {
        documentType = 'PRESS_RELEASE';
      } else if (lowerFilename.includes('price') || lowerFilename.includes('guide')) {
        documentType = 'PRICE_GUIDE';
      } else if (mimeType.startsWith('image/')) {
        documentType = 'IMAGE';
      }

      // Create display name from filename (remove timestamp prefix if present)
      let displayName = file.filename
        .replace(/^\d+-/, '') // Remove timestamp prefix
        .replace(/\.[^.]+$/, '') // Remove extension
        .replace(/-/g, ' ') // Replace hyphens with spaces
        .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize words

      try {
        // Create new SourceDocument
        await prisma.sourceDocument.create({
          data: {
            filename: file.filename,
            displayName,
            blobUrl: file.url,
            mimeType,
            fileSize: 0, // We don't have this info from legacy data
            documentType: documentType as any,
            entityType: 'RELEASE',
            tags: [],
            uploadedById: 'migration', // Placeholder
            releaseId: release.id,
            usageContext: 'Migrated from legacy sourceFiles',
          },
        });

        console.log(`  ✅ Migrated: ${file.filename} (${documentType})`);
        totalMigrated++;
      } catch (error) {
        console.error(`  ❌ Failed to migrate ${file.filename}:`, error);
      }
    }
  }

  console.log('\n\n📊 Migration Summary:');
  console.log(`  ✅ Migrated: ${totalMigrated} files`);
  console.log(`  ⏭️  Skipped: ${totalSkipped} files (already existed)`);
  console.log(`  📄 Processed: ${releases.length} releases`);

  if (totalMigrated > 0) {
    console.log('\n⚠️  Next steps:');
    console.log('  1. Verify migrated documents in the UI');
    console.log('  2. Update code to use sourceDocuments instead of sourceFiles');
    console.log('  3. Consider removing the sourceFiles JSON field from schema');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Migration failed:', error);
    prisma.$disconnect();
    process.exit(1);
  });
