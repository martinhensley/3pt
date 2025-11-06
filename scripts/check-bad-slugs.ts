import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find sets with problematic slugs containing "checklist"
  const badSets = await prisma.set.findMany({
    where: {
      OR: [
        { slug: { contains: 'checklist' } },
        { slug: { contains: 'base-set' } },
      ],
    },
    include: {
      release: true,
      parentSet: true,
    },
    orderBy: { slug: 'asc' },
  });

  console.log(`\nFound ${badSets.length} sets with problematic slugs:\n`);

  for (const set of badSets) {
    console.log(`ID: ${set.id}`);
    console.log(`Name: ${set.name}`);
    console.log(`Slug: ${set.slug}`);
    console.log(`Type: ${set.type}`);
    console.log(`Release: ${set.release.year} ${set.release.name}`);
    console.log(`Parent Set: ${set.parentSet?.name || 'None (this is a parent)'}`);
    console.log(`Print Run: ${set.printRun || 'N/A'}`);
    console.log('---');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
