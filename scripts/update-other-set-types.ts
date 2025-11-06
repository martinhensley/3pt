import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting update of Set types from "Other" to "Insert"...');

    // First, let's see how many sets have "Other" as their type
    const setsWithOther = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "Set" WHERE type = 'Other'
    `;

    console.log(`Found ${setsWithOther[0].count} sets with type "Other"`);

    if (Number(setsWithOther[0].count) > 0) {
      // Update all sets with type "Other" to "Insert"
      const result = await prisma.$executeRaw`
        UPDATE "Set" SET type = 'Insert' WHERE type = 'Other'
      `;

      console.log(`Successfully updated ${result} sets from "Other" to "Insert"`);
    } else {
      console.log('No sets to update.');
    }

    console.log('Update complete!');
  } catch (error) {
    console.error('Error updating set types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
