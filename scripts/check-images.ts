import { prisma } from '../lib/prisma';

async function checkImages() {
  try {
    // Note: This will fail if ReleaseImage and PostImage don't exist
    // but that's okay - we're just checking before migration

    const releaseImageCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "ReleaseImage"
    `.catch(() => [{ count: 0 }]);

    const postImageCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "PostImage"
    `.catch(() => [{ count: 0 }]);

    console.log('Image counts before migration:');
    console.log('ReleaseImage:', releaseImageCount);
    console.log('PostImage:', postImageCount);
  } catch (error) {
    console.error('Error checking images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();
