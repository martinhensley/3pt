import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const releaseId = 'cmhzoh0x700028oay146djw73';

  const release = await prisma.release.findUnique({
    where: { id: releaseId },
    select: {
      id: true,
      name: true,
      sourceFiles: true, // Legacy JSON field
      sourceDocuments: {
        select: {
          id: true,
          displayName: true,
          filename: true,
          blobUrl: true,
        }
      }
    }
  });

  if (!release) {
    console.log('❌ Release not found');
    return;
  }

  console.log('\n📄 Release:', release.name);
  console.log('\n📦 LEGACY sourceFiles (JSON field):');
  console.log(JSON.stringify(release.sourceFiles, null, 2));

  console.log('\n📚 NEW sourceDocuments (relation):');
  console.log(JSON.stringify(release.sourceDocuments, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
