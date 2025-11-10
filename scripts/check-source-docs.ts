import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSourceDocs() {
  const release = await prisma.release.findUnique({
    where: { slug: '2024-25-panini-donruss-soccer' },
    include: {
      sourceDocuments: {
        include: {
          document: true
        }
      }
    }
  });

  if (!release) {
    console.log('❌ Release not found');
    return;
  }

  console.log(`✅ Found release: ${release.name}`);
  console.log(`   Source documents: ${release.sourceDocuments?.length || 0}`);

  if (release.sourceDocuments && release.sourceDocuments.length > 0) {
    console.log('\nSource documents:');
    release.sourceDocuments.forEach((rd, idx) => {
      console.log(`${idx + 1}. ${rd.document.displayName}`);
      console.log(`   Type: ${rd.document.documentType}`);
      console.log(`   File: ${rd.document.filename}`);
      console.log(`   URL: ${rd.document.blobUrl}`);
      console.log(`   Size: ${(rd.document.fileSize / (1024 * 1024)).toFixed(2)} MB`);
      if (rd.usageContext) {
        console.log(`   Usage: ${rd.usageContext}`);
      }
      console.log();
    });
  } else {
    console.log('\nℹ️  No source documents linked to this release yet.');
    console.log('   The Source Documents section will only appear when documents are linked.');
  }

  await prisma.$disconnect();
}

checkSourceDocs();
