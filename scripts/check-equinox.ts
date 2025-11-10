import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEquinox() {
  const equinoxSet = await prisma.set.findFirst({
    where: {
      name: { contains: 'Equinox', mode: 'insensitive' },
    },
    include: {
      release: {
        include: {
          manufacturer: true,
        },
      },
      parallelSets: {
        take: 5,
      },
    },
  });

  if (!equinoxSet) {
    console.log('Equinox set not found!');
    return;
  }

  console.log('=== EQUINOX SET ===');
  console.log('Name:', equinoxSet.name);
  console.log('Type:', equinoxSet.type);
  console.log('Slug:', equinoxSet.slug);
  console.log('Release:', equinoxSet.release.name);
  console.log('Manufacturer:', equinoxSet.release.manufacturer.name);
  console.log('\nParallel Sets:', equinoxSet.parallelSets.length);

  equinoxSet.parallelSets.forEach(ps => {
    console.log(`\n- ${ps.name}`);
    console.log(`  Slug: ${ps.slug}`);
    console.log(`  Print Run: ${ps.printRun}`);
  });

  await prisma.$disconnect();
}

checkEquinox();
