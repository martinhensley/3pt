import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRelease() {
  try {
    const release = await prisma.release.findFirst({
      where: {
        slug: '2016-17-panini-donruss-basketball'
      },
      include: {
        manufacturer: true,
        sets: true
      }
    });

    console.log('Release found:', release ? 'YES' : 'NO');
    if (release) {
      console.log('Name:', release.name);
      console.log('Slug:', release.slug);
      console.log('Manufacturer:', release.manufacturer.name);
      console.log('Sets count:', release.sets.length);
      console.log('Created:', release.createdAt);
      console.log('Year:', release.year);
    } else {
      console.log('\nSearching for similar releases...');
      const similar = await prisma.release.findMany({
        where: {
          name: {
            contains: 'Donruss',
            mode: 'insensitive'
          }
        },
        include: {
          manufacturer: true
        },
        take: 10
      });

      console.log(`\nFound ${similar.length} releases with "Donruss" in name:`);
      similar.forEach(r => {
        console.log(`- ${r.year} ${r.manufacturer.name} ${r.name} (slug: ${r.slug})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelease();
