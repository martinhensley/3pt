import { prisma } from '../lib/prisma';

async function fixReleaseSlug() {
  // Update the Panini Donruss Soccer 2024-25 release
  const release = await prisma.release.findUnique({
    where: { slug: 'panini-donruss-soccer-2024-25' },
  });

  if (release) {
    const newSlug = '2024-25-panini-donruss-soccer';

    console.log(`Updating release slug from "${release.slug}" to "${newSlug}"`);

    await prisma.release.update({
      where: { id: release.id },
      data: {
        slug: newSlug,
        description: 'Panini Donruss Soccer 2024-25 features a 200-card base set with extensive parallel variations including numbered editions down to 1/1. The release includes Base Optic parallels, Rated Rookies showcasing the season\'s top newcomers, plus autograph and memorabilia inserts celebrating the biggest stars in world football.'
      },
    });

    console.log('✅ Release slug updated successfully!');
    console.log(`New URL: http://localhost:3000/release/${newSlug}`);
  } else {
    console.log('Release not found');
  }

  await prisma.$disconnect();
}

fixReleaseSlug().catch(console.error);
