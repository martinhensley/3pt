import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for sets still using deprecated parallels JSON array...\n');

  const setsWithParallels = await prisma.set.findMany({
    where: {
      parallels: {
        not: null,
      },
    },
    include: {
      release: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (setsWithParallels.length === 0) {
    console.log('✅ No sets found using deprecated parallels array - all migrated!');
    return;
  }

  console.log(`⚠️  Found ${setsWithParallels.length} sets still using deprecated parallels array:\n`);

  for (const set of setsWithParallels) {
    const parallels = set.parallels as string[];
    console.log(`Release: ${set.release.year} ${set.release.name}`);
    console.log(`Set: ${set.name}`);
    console.log(`Slug: ${set.slug}`);
    console.log(`Parallels: ${parallels?.length || 0}`);
    if (parallels && parallels.length > 0) {
      console.log(`  Sample: ${parallels.slice(0, 3).join(', ')}`);
    }
    console.log('---\n');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
