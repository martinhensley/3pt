import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReleases() {
  const releases = await prisma.release.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      year: true,
      _count: {
        select: {
          sets: true,
        },
      },
    },
    orderBy: {
      year: 'desc',
    },
  });

  console.log('All releases in database:');
  console.log('-'.repeat(80));
  for (const release of releases) {
    console.log(`${release.year} - ${release.name}`);
    console.log(`  Slug: ${release.slug}`);
    console.log(`  Sets: ${release._count.sets}`);
    console.log();
  }
}

checkReleases()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
