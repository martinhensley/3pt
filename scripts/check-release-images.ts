import { prisma } from '../lib/prisma';

async function checkRelease() {
  const release = await prisma.release.findUnique({
    where: { slug: 'panini-donruss-soccer-2024-25' },
    include: {
      images: true,
      manufacturer: true,
      sets: {
        include: {
          _count: { select: { cards: true } }
        }
      }
    }
  });

  console.log('Release:', JSON.stringify(release, null, 2));

  await prisma.$disconnect();
}

checkRelease().catch(console.error);
