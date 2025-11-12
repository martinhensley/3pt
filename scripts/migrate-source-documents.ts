import { prisma } from '../lib/prisma';
import { DocumentType } from '@prisma/client';

/**
 * Migrates source files from Release.sourceFiles JSON field
 * to SourceDocument + ReleaseSourceDocument tables
 */
async function migrateSourceDocuments() {
  console.log('Starting source document migration...\n');

  // Get all releases with sourceFiles
  const releases = await prisma.release.findMany({
    where: {
      sourceFiles: { not: null }
    },
    select: {
      id: true,
      name: true,
      year: true,
      sourceFiles: true,
      manufacturer: {
        select: {
          name: true
        }
      }
    }
  });

  console.log(`Found ${releases.length} releases with source files\n`);

  let totalDocuments = 0;
  let totalLinks = 0;

  for (const release of releases) {
    console.log(`\nProcessing: ${release.year} ${release.manufacturer.name} ${release.name}`);

    const sourceFiles = release.sourceFiles as any[];
    if (!sourceFiles || !Array.isArray(sourceFiles)) {
      console.log('  ⚠️  No valid sourceFiles array, skipping');
      continue;
    }

    console.log(`  Found ${sourceFiles.length} source file(s)`);

    for (const file of sourceFiles) {
      const { url, type, filename } = file;

      if (!url || !filename) {
        console.log(`  ⚠️  Skipping invalid file entry:`, file);
        continue;
      }

      // Determine document type from filename
      const documentType = determineDocumentType(filename);

      // Generate display name from filename
      const displayName = filename
        .replace(/^\d+-/, '') // Remove timestamp prefix
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/-/g, ' '); // Replace hyphens with spaces

      // Generate tags
      const tags = generateTags(release, filename);

      try {
        // Check if document already exists
        let document = await prisma.sourceDocument.findFirst({
          where: { blobUrl: url }
        });

        if (!document) {
          // Create new source document
          document = await prisma.sourceDocument.create({
            data: {
              filename,
              displayName,
              blobUrl: url,
              mimeType: type || 'application/octet-stream',
              fileSize: 0, // We don't have this info in old format
              documentType,
              tags,
              uploadedById: 'system-migration',
              usageCount: 1,
              lastUsedAt: new Date(),
            }
          });

          console.log(`  ✓ Created document: ${displayName}`);
          totalDocuments++;
        } else {
          console.log(`  ℹ️  Document already exists: ${displayName}`);
        }

        // Check if link already exists
        const existingLink = await prisma.releaseSourceDocument.findUnique({
          where: {
            releaseId_documentId: {
              releaseId: release.id,
              documentId: document.id
            }
          }
        });

        if (!existingLink) {
          // Create link
          await prisma.releaseSourceDocument.create({
            data: {
              releaseId: release.id,
              documentId: document.id,
              usageContext: 'Migrated from Release.sourceFiles',
              linkedById: 'system-migration',
            }
          });

          console.log(`  ✓ Linked document to release`);
          totalLinks++;
        } else {
          console.log(`  ℹ️  Link already exists`);
        }

      } catch (error) {
        console.error(`  ❌ Error processing file ${filename}:`, error);
      }
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Documents created: ${totalDocuments}`);
  console.log(`   Links created: ${totalLinks}`);
}

/**
 * Determine document type from filename
 */
function determineDocumentType(filename: string): DocumentType {
  const lower = filename.toLowerCase();

  if (lower.includes('sell-sheet') || lower.includes('sellsheet')) {
    return DocumentType.SELL_SHEET;
  }
  if (lower.includes('checklist')) {
    return DocumentType.CHECKLIST;
  }
  if (lower.includes('press-release') || lower.includes('press_release')) {
    return DocumentType.PRESS_RELEASE;
  }
  if (lower.includes('price') && lower.includes('guide')) {
    return DocumentType.PRICE_GUIDE;
  }
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return DocumentType.IMAGE;
  }

  return DocumentType.OTHER;
}

/**
 * Generate searchable tags from release info and filename
 */
function generateTags(release: any, filename: string): string[] {
  const tags: string[] = [];

  // Add year
  if (release.year) {
    tags.push(release.year);
  }

  // Add manufacturer
  if (release.manufacturer?.name) {
    tags.push(release.manufacturer.name);
  }

  // Add release name keywords
  if (release.name) {
    const keywords = release.name.split(/\s+/).filter((word: string) => word.length > 3);
    tags.push(...keywords);
  }

  // Add document type from filename
  const lower = filename.toLowerCase();
  if (lower.includes('sell-sheet')) tags.push('sell-sheet');
  if (lower.includes('checklist')) tags.push('checklist');
  if (lower.includes('soccer')) tags.push('soccer');
  if (lower.includes('football')) tags.push('football');

  // Remove duplicates and return
  return Array.from(new Set(tags));
}

// Run migration
migrateSourceDocuments()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
