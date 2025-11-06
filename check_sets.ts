import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSets() {
  try {
    // Get all sets ordered by creation date
    const sets = await prisma.set.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        release: {
          select: {
            name: true,
            year: true,
          }
        },
        _count: {
          select: {
            cards: true,
          }
        }
      }
    });

    console.log(`\nFound ${sets.length} sets in database:\n`);

    for (const set of sets) {
      console.log(`ID: ${set.id}`);
      console.log(`Name: ${set.name}`);
      console.log(`Slug: ${set.slug}`);
      console.log(`Release: ${set.release.year} ${set.release.name}`);
      console.log(`Parent Set ID: ${set.parentSetId || 'None (this is a parent)'}`);
      console.log(`Card Count: ${set._count.cards}`);
      console.log(`Created: ${set.createdAt}`);
      console.log('---');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSets();
