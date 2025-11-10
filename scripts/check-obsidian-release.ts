import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRelease() {
  const release = await prisma.release.findFirst({
    where: {
      name: { contains: 'Obsidian', mode: 'insensitive' },
    },
    include: {
      manufacturer: true,
      sets: {
        select: {
          name: true,
          type: true,
          slug: true,
        },
      },
    },
  });

  if (!release) {
    console.log('Release not found!');
    return;
  }

  console.log('=== RELEASE ===');
  console.log('Name:', release.name);
  console.log('Slug:', release.slug);
  console.log('Manufacturer:', release.manufacturer.name);
  console.log('Year:', release.year);
  console.log('\nSets:', release.sets.length);
  
  release.sets.forEach(set => {
    console.log(`\n- ${set.name}`);
    console.log(`  Type: ${set.type}`);
    console.log(`  Slug: ${set.slug}`);
  });

  await prisma.$disconnect();
}

checkRelease();
