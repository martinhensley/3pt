import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the release
  const release = await prisma.release.findFirst({
    where: {
      slug: '2016-panini-contenders-draft-picks-basketball'
    },
    select: {
      id: true
    }
  });

  if (!release) {
    console.log('Release not found');
    return;
  }

  // Find ALL sets with "College" in the name
  const sets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      name: {
        contains: 'College',
        mode: 'insensitive'
      }
    },
    include: {
      _count: {
        select: { cards: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log('=== ALL COLLEGE SETS ===');
  console.log(`Found ${sets.length} sets:\n`);

  sets.forEach(set => {
    const isVariation = set.name.includes('Variation');
    const isTicket = set.name.includes('Ticket');
    console.log(`${set.name}:`);
    console.log(`  - Cards: ${set._count.cards}`);
    console.log(`  - isParallel: ${set.isParallel}`);
    console.log(`  - printRun: ${set.printRun}`);
    console.log(`  - Type: ${isVariation ? 'VARIATION' : 'NON-VARIATION'}`);
    console.log(`  - Category: ${isTicket ? 'TICKET' : 'OTHER'}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
