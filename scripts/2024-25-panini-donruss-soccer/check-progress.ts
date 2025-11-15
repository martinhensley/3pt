import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const release = await prisma.release.findFirst({
    where: { slug: '2024-25-panini-donruss-soccer' },
  });

  const setCount = await prisma.set.count({
    where: { releaseId: release?.id },
  });

  const cardCount = await prisma.card.count({
    where: { set: { releaseId: release?.id } },
  });

  const progress = Math.round((cardCount / 8977) * 100);

  console.log('📊 CURRENT DATABASE STATE');
  console.log('='.repeat(60));
  console.log(`Sets: ${setCount} / 149 expected`);
  console.log(`Cards: ${cardCount} / 8,977 expected`);
  console.log(`Progress: ${progress}%`);
  console.log('='.repeat(60));
}

main().finally(() => prisma.$disconnect());
