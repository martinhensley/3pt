import { PrismaClient } from '@prisma/client';
import { uploadChecklistToRelease, getExistingChecklist } from '../lib/checklistUploader';

const prisma = new PrismaClient();

async function main() {
  // Configuration
  const EXCEL_FILE_PATH = '/Users/mh/Desktop/2024-25-Donruss-Soccer-Checklist.xlsx';
  const RELEASE_SLUG = '2024-25-panini-donruss-soccer';

  console.log('\n📋 Uploading Donruss Soccer Checklist\n');

  // Find the release
  const release = await prisma.release.findUnique({
    where: { slug: RELEASE_SLUG },
  });

  if (!release) {
    console.error(`❌ Release not found: ${RELEASE_SLUG}`);
    process.exit(1);
  }

  console.log(`✅ Found release: ${release.name} (${release.id})`);

  // Check if already uploaded
  const existing = await getExistingChecklist(release.id, '2024-25-Donruss-Soccer-Checklist.xlsx');

  if (existing) {
    console.log(`\n⚠️  Checklist already uploaded:`);
    console.log(`   ID: ${existing.id}`);
    console.log(`   Name: ${existing.displayName}`);
    console.log(`   URL: ${existing.blobUrl}`);
    console.log(`   Uploaded: ${existing.uploadedAt}`);
    console.log(`\n✅ No action needed - checklist already exists`);
    return;
  }

  // Upload the checklist
  const sourceDocument = await uploadChecklistToRelease(
    EXCEL_FILE_PATH,
    release.id,
    'Panini Donruss Soccer 2024-25 Master Checklist'
  );

  console.log(`\n✅ Successfully uploaded checklist!`);
  console.log(`   Document ID: ${sourceDocument.id}`);
  console.log(`   Display Name: ${sourceDocument.displayName}`);
  console.log(`   Blob URL: ${sourceDocument.blobUrl}`);
  console.log(`   File Size: ${(sourceDocument.fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n🌐 View on release page: http://localhost:3000/releases/${RELEASE_SLUG}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
