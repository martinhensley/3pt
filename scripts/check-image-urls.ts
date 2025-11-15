import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImageUrls() {
  try {
    // Get the Donruss release
    const release = await prisma.release.findUnique({
      where: { slug: '2024-25-panini-donruss-soccer' },
      include: {
        images: {
          take: 10,
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!release) {
      console.log('Release not found');
      return;
    }

    console.log(`Release: ${release.name}`);
    console.log(`Total images: ${release.images.length}\n`);

    console.log('Image URLs:');
    release.images.forEach((img, idx) => {
      console.log(`\n${idx + 1}. URL: ${img.url}`);
      console.log(`   Type: ${img.type}`);
      console.log(`   Order: ${img.order}`);

      // Check if URL is local or remote
      if (img.url.startsWith('/')) {
        console.log(`   ⚠️  Local path detected`);
      } else if (img.url.startsWith('http://localhost')) {
        console.log(`   ⚠️  Localhost URL detected`);
      } else if (img.url.startsWith('https://')) {
        console.log(`   ✓ Remote URL`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageUrls();
