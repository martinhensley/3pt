import { prisma } from '../lib/prisma';

async function checkSourceDocuments() {
  try {
    console.log('Checking for source documents...\n');

    // Count all source documents
    const totalDocs = await prisma.sourceDocument.count();
    console.log(`Total source documents: ${totalDocs}`);

    // List all source documents
    const docs = await prisma.sourceDocument.findMany({
      select: {
        id: true,
        filename: true,
        displayName: true,
        documentType: true,
        uploadedAt: true,
        releaseId: true,
        postId: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    console.log('\nAll source documents:');
    docs.forEach((doc) => {
      console.log(`- ${doc.displayName} (${doc.documentType})`);
      console.log(`  Filename: ${doc.filename}`);
      console.log(`  Release ID: ${doc.releaseId || 'none'}`);
      console.log(`  Post ID: ${doc.postId || 'none'}`);
      console.log(`  Uploaded: ${doc.uploadedAt.toISOString()}\n`);
    });

    // Check for Donruss release
    console.log('Checking for Donruss release...\n');
    const donrussRelease = await prisma.release.findFirst({
      where: {
        name: { contains: 'Donruss', mode: 'insensitive' },
      },
      include: {
        sourceDocuments: true,
      },
    });

    if (donrussRelease) {
      console.log(`Found Donruss release: ${donrussRelease.name}`);
      console.log(`Release ID: ${donrussRelease.id}`);
      console.log(`Source documents: ${donrussRelease.sourceDocuments.length}`);

      donrussRelease.sourceDocuments.forEach((doc) => {
        console.log(`  - ${doc.filename}`);
      });
    } else {
      console.log('No Donruss release found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSourceDocuments();
