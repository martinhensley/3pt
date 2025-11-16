import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Finding Dragon Scale parallel sets...\n');

  // Find all Dragon Scale parallel sets
  const dragonScaleSets = await prisma.set.findMany({
    where: {
      name: {
        contains: 'Dragon Scale',
        mode: 'insensitive',
      },
      releaseId: 'cmhzoh0x700028oay146djw73', // Donruss Soccer release
    },
    select: {
      id: true,
      name: true,
      printRun: true,
      _count: {
        select: { cards: true }
      }
    }
  });

  console.log(`Found ${dragonScaleSets.length} Dragon Scale sets:\n`);

  for (const set of dragonScaleSets) {
    console.log(`📊 ${set.name}`);
    console.log(`   Print Run: /${set.printRun || 'N/A'}`);
    console.log(`   Cards: ${set._count.cards}`);

    if (set.printRun !== 99) {
      console.log(`   ⚠️  INCORRECT - should be /99`);

      // Update the set
      await prisma.set.update({
        where: { id: set.id },
        data: { printRun: 99 }
      });

      // Update all cards in this set
      await prisma.card.updateMany({
        where: { setId: set.id },
        data: { printRun: 99 }
      });

      console.log(`   ✅ Updated to /99`);
    } else {
      console.log(`   ✅ Already correct`);
    }
    console.log('');
  }

  console.log('✅ All Dragon Scale parallels updated to /99');
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
