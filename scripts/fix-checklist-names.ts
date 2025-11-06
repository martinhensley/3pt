import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting to fix set names containing "checklist"...');

    // Find all sets with "checklist" in their name
    const setsWithChecklist = await prisma.set.findMany({
      where: {
        name: {
          contains: 'checklist',
          mode: 'insensitive',
        },
      },
    });

    console.log(`Found ${setsWithChecklist.length} sets with "checklist" in name`);

    for (const set of setsWithChecklist) {
      console.log(`\nProcessing: ${set.name}`);

      // Remove "checklist" from the name (case-insensitive)
      const newName = set.name
        .replace(/\s*checklist\s*/gi, ' ')
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();

      console.log(`  New name: ${newName}`);

      if (newName !== set.name && newName) {
        await prisma.set.update({
          where: { id: set.id },
          data: { name: newName },
        });
        console.log('  ✓ Updated');
      } else {
        console.log('  - No change needed');
      }
    }

    console.log('\n✅ All set names have been fixed!');
  } catch (error) {
    console.error('Error fixing set names:', error);
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
