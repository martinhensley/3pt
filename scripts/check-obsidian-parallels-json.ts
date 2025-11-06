import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find Obsidian Base Set
  const baseSet = await prisma.set.findFirst({
    where: {
      name: 'Base Set',
      release: {
        name: { contains: 'Obsidian' },
        year: '2024-25',
      },
    },
    include: {
      release: true,
    },
  });

  if (!baseSet) {
    console.log('Base Set not found');
    return;
  }

  console.log(`\nSet: ${baseSet.name}`);
  console.log(`Slug: ${baseSet.slug}`);
  console.log(`Type: ${baseSet.type}`);
  console.log(`\nDeprecated 'parallels' JSON array:`);

  if (baseSet.parallels) {
    const parallels = baseSet.parallels as string[];
    console.log(`Count: ${parallels.length}`);
    console.log('\nFirst 10 parallels:');
    parallels.slice(0, 10).forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p}`);
    });
    if (parallels.length > 10) {
      console.log(`  ... and ${parallels.length - 10} more`);
    }
  } else {
    console.log('  None (null)');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
