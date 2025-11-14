import { PrismaClient } from '@prisma/client';
import { parseReleaseDateToPostDate } from '@/lib/formatters';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the Donruss Soccer release
    const release = await prisma.release.findFirst({
      where: {
        slug: '2024-25-panini-donruss-soccer'
      }
    });

    if (!release) {
      console.log('Release not found');
      process.exit(1);
    }

    console.log('Current state:');
    console.log('- releaseDate:', release.releaseDate);
    console.log('- postDate:', release.postDate);
    console.log('- reviewDate:', release.reviewDate);

    // Calculate postDate from releaseDate
    const calculatedPostDate = release.releaseDate
      ? parseReleaseDateToPostDate(release.releaseDate)
      : null;

    console.log('\nCalculated postDate:', calculatedPostDate);

    // Update the release
    const updated = await prisma.release.update({
      where: { id: release.id },
      data: {
        postDate: calculatedPostDate
      }
    });

    console.log('\nUpdated state:');
    console.log('- postDate:', updated.postDate);
    console.log('\n✓ Successfully updated postDate');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
