import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const setId = 'cmi0u94ew00018o8f9pjiwkpt';

    // Delete the set (cascade will delete the card)
    const deleted = await prisma.set.delete({
      where: {
        id: setId
      }
    });

    console.log(`✓ Deleted erroneous set: "${deleted.name}"`);
    console.log(`✓ Also deleted 1 card (ATHLETE #CARD #) due to cascade delete`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
