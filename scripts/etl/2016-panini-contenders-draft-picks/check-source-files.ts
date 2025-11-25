import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSourceFiles() {
  const release = await prisma.release.findUnique({
    where: { slug: '2016-panini-contenders-draft-picks-basketball' },
    include: {
      sourceDocuments: true,
    },
  });

  if (!release) {
    console.log('Release not found');
    return;
  }

  console.log(`Release: ${release.name}`);
  console.log(`Source files: ${release.sourceDocuments.length}`);
  console.log();

  for (const file of release.sourceDocuments) {
    console.log(`File: ${file.fileName}`);
    console.log(`  Type: ${file.fileType}`);
    console.log(`  Size: ${file.fileSize} bytes`);
    console.log(`  Uploaded: ${file.uploadedAt}`);
    console.log();
  }
}

checkSourceFiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
