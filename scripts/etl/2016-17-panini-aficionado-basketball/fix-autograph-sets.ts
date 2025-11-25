import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAutographSets() {
  console.log('🔧 Fixing Autograph Set Classifications\n');

  const release = await prisma.release.findUnique({
    where: { slug: '2016-17-panini-aficionado-basketball' }
  });

  if (!release) {
    throw new Error('Release not found');
  }

  // Sets that should be Autograph type
  const autographSetNames = [
    'Endorsements',
    'Endorsements Artist\'s Proof Bronze',
    'Endorsements Artist\'s Proof Gold',
    'First Impressions',
    'First Impressions Artist\'s Proof Bronze',
    'First Impressions Artist\'s Proof Gold'
  ];

  let updatedCount = 0;

  for (const setName of autographSetNames) {
    const set = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: setName
      }
    });

    if (set && set.type !== 'Autograph') {
      console.log(`Updating "${setName}": Insert → Autograph`);

      await prisma.set.update({
        where: { id: set.id },
        data: { type: 'Autograph' }
      });

      updatedCount++;
    }
  }

  console.log(`\n✅ Updated ${updatedCount} sets to Autograph type`);
}

fixAutographSets()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
