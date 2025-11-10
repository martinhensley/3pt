import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSourceFiles() {
  const release = await prisma.release.findUnique({
    where: { slug: '2024-25-panini-donruss-soccer' },
    select: {
      name: true,
      sourceFiles: true,
      sellSheetText: true
    }
  });

  if (!release) {
    console.log('❌ Release not found');
    return;
  }

  console.log(`✅ Found release: ${release.name}`);
  console.log(`\nsourceFiles field:`, release.sourceFiles);
  console.log(`\nsellSheetText field:`, release.sellSheetText ? `${release.sellSheetText.substring(0, 200)}...` : 'null');

  if (release.sourceFiles) {
    console.log('\n📄 Source files (JSON):');
    const files = Array.isArray(release.sourceFiles) ? release.sourceFiles : [];
    files.forEach((file: any, idx: number) => {
      console.log(`\n${idx + 1}. ${file.filename || 'Unknown'}`);
      console.log(`   Type: ${file.type || 'Unknown'}`);
      console.log(`   URL: ${file.url || 'No URL'}`);
    });
  }

  await prisma.$disconnect();
}

checkSourceFiles();
