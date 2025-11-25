import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Search for Contenders releases
  const releases = await prisma.release.findMany({
    where: {
      OR: [
        { name: { contains: 'Contenders', mode: 'insensitive' } },
        { name: { contains: 'Draft', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      year: true
    },
    orderBy: {
      year: 'desc'
    }
  });

  console.log('=== CONTENDERS/DRAFT RELEASES ===');
  console.log(`Found ${releases.length} releases:\n`);

  releases.forEach(release => {
    console.log(`${release.year || 'N/A'} - ${release.name}`);
    console.log(`  Slug: ${release.slug}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
