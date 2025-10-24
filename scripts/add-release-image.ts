import { prisma } from '../lib/prisma';

async function addReleaseImage() {
  // Get the Donruss Soccer 2024-25 release
  const release = await prisma.release.findUnique({
    where: { slug: '2024-25-panini-donruss-soccer' },
  });

  if (!release) {
    console.log('Release not found');
    return;
  }

  // Add the uploaded image
  const imageUrl = 'https://glxspabwcixgafov.public.blob.vercel-storage.com/1761253720618-2024-25donrusssoccer.png';

  const image = await prisma.image.create({
    data: {
      releaseId: release.id,
      url: imageUrl,
      order: 0,
    },
  });

  console.log('✅ Release image added successfully!');
  console.log('Image ID:', image.id);
  console.log('Image URL:', image.url);

  await prisma.$disconnect();
}

addReleaseImage().catch(console.error);
