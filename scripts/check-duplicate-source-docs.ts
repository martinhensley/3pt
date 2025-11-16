import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const releaseId = 'cmhzoh0x700028oay146djw73';

  console.log('\n🔍 Checking source documents for release:', releaseId);

  const release = await prisma.release.findUnique({
    where: { id: releaseId },
    include: {
      sourceDocuments: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!release) {
    console.log('❌ Release not found');
    return;
  }

  console.log('\n📄 Release:', release.name);
  console.log('📊 Total source documents:', release.sourceDocuments.length);

  if (release.sourceDocuments.length === 0) {
    console.log('✅ No source documents found');
    return;
  }

  console.log('\n📋 Source Documents:');
  release.sourceDocuments.forEach((doc, index) => {
    console.log(`\n${index + 1}. ${doc.name}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Type: ${doc.documentType}`);
    console.log(`   Entity Type: ${doc.entityType}`);
    console.log(`   Filename: ${doc.filename}`);
    console.log(`   URL: ${doc.url}`);
    console.log(`   Blob URL: ${doc.blobUrl || 'N/A'}`);
    console.log(`   Created: ${doc.createdAt}`);
  });

  // Check for duplicates by comparing URLs and filenames
  const urlMap = new Map<string, typeof release.sourceDocuments>();
  const filenameMap = new Map<string, typeof release.sourceDocuments>();

  release.sourceDocuments.forEach(doc => {
    if (doc.url) {
      if (!urlMap.has(doc.url)) {
        urlMap.set(doc.url, []);
      }
      urlMap.get(doc.url)!.push(doc);
    }

    if (doc.filename) {
      if (!filenameMap.has(doc.filename)) {
        filenameMap.set(doc.filename, []);
      }
      filenameMap.get(doc.filename)!.push(doc);
    }
  });

  console.log('\n🔍 Checking for duplicates...\n');

  let hasDuplicates = false;

  urlMap.forEach((docs, url) => {
    if (docs.length > 1) {
      hasDuplicates = true;
      console.log(`⚠️  Duplicate URL found (${docs.length} occurrences):`);
      console.log(`   URL: ${url}`);
      docs.forEach(doc => {
        console.log(`   - ID: ${doc.id}, Created: ${doc.createdAt}`);
      });
      console.log('');
    }
  });

  filenameMap.forEach((docs, filename) => {
    if (docs.length > 1) {
      hasDuplicates = true;
      console.log(`⚠️  Duplicate filename found (${docs.length} occurrences):`);
      console.log(`   Filename: ${filename}`);
      docs.forEach(doc => {
        console.log(`   - ID: ${doc.id}, URL: ${doc.url || doc.blobUrl}, Created: ${doc.createdAt}`);
      });
      console.log('');
    }
  });

  if (!hasDuplicates) {
    console.log('✅ No duplicate URLs or filenames found');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
