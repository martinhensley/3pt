import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up Equinox parallel arrays...\n');

  // Find the Equinox set
  const equinoxSet = await prisma.set.findFirst({
    where: {
      name: 'Equinox',
      release: {
        name: { contains: 'Obsidian' }
      }
    },
    include: {
      parallelSets: true,
    },
  });

  if (!equinoxSet) {
    console.error('❌ Equinox set not found');
    return;
  }

  console.log(`📦 Found Equinox set:`);
  console.log(`   ID: ${equinoxSet.id}`);
  console.log(`   Name: ${equinoxSet.name}`);
  console.log(`   Has parallels array: ${equinoxSet.parallels ? 'Yes' : 'No'}`);
  console.log(`   Parallel sets count: ${equinoxSet.parallelSets.length}`);

  // If the set has both parallels array AND parallel sets, clear the parallels array
  if (equinoxSet.parallels && equinoxSet.parallelSets.length > 0) {
    console.log('\n🔧 Set has both parallels array and parallel sets. Clearing deprecated parallels array...');

    await prisma.set.update({
      where: { id: equinoxSet.id },
      data: { parallels: null },
    });

    console.log('✅ Parallels array cleared successfully!');
  } else if (!equinoxSet.parallels) {
    console.log('\n✅ Parallels array is already empty. Nothing to do.');
  } else if (equinoxSet.parallelSets.length === 0) {
    console.log('\n⚠️  Set has parallels array but no parallel sets. Keeping parallels array.');
  }

  console.log('\n✨ Cleanup complete!');
}

main()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
