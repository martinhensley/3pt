import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReleaseSlug() {
  try {
    // Get the most recently updated release
    const release = await prisma.release.findFirst({
      orderBy: { updatedAt: 'desc' },
      include: {
        manufacturer: true,
      }
    });

    if (release) {
      console.log(`\nMost recent release:`);
      console.log(`ID: ${release.id}`);
      console.log(`Name: ${release.name}`);
      console.log(`Year: ${release.year}`);
      console.log(`Slug: ${release.slug}`);
      console.log(`Manufacturer: ${release.manufacturer.name}`);
    } else {
      console.log('No releases found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReleaseSlug();
