import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMemorabiliaTypes() {
  console.log('🔧 Fixing Memorabilia Set Classifications\n');

  const release = await prisma.release.findUnique({
    where: { slug: '2016-17-panini-aficionado-basketball' }
  });

  if (!release) {
    throw new Error('Release not found');
  }

  // Sets that should be Memorabilia type
  const memorabiliaSetNames = [
    'Authentics',
    'Authentics Prime',
    'Dual Authentics',
    'Dual Authentics Prime'
  ];

  let updatedCount = 0;

  for (const setName of memorabiliaSetNames) {
    const set = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: setName
      }
    });

    if (set && set.type !== 'Memorabilia') {
      console.log(`Updating "${setName}": ${set.type} → Memorabilia`);

      await prisma.set.update({
        where: { id: set.id },
        data: { type: 'Memorabilia' }
      });

      updatedCount++;
    }
  }

  console.log(`\n✅ Updated ${updatedCount} sets to Memorabilia type`);
}

fixMemorabiliaTypes()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
