import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRatedRookiesType() {
  // Find all Rated Rookies sets (parent and parallels)
  const ratedRookiesSets = await prisma.set.findMany({
    where: {
      OR: [
        { name: 'Rated Rookies' },
        { name: { startsWith: 'Rated Rookies ' } }
      ]
    }
  });

  console.log(`Found ${ratedRookiesSets.length} Rated Rookies sets to update\n`);

  // Update each set to type "Base"
  for (const set of ratedRookiesSets) {
    await prisma.set.update({
      where: { id: set.id },
      data: { type: 'Base' }
    });
    console.log(`✅ Updated ${set.name} to type "Base"`);
  }

  console.log(`\n✅ All Rated Rookies sets updated successfully!`);

  await prisma.$disconnect();
}

fixRatedRookiesType();
