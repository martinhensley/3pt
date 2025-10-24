/**
 * Script to rename Release.excerpt column to Release.description
 */

import { prisma } from '../lib/prisma';

async function renameColumn() {
  try {
    console.log('Renaming Release.excerpt to Release.description...');

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Release" RENAME COLUMN "excerpt" TO "description";'
    );

    console.log('✓ Column renamed successfully!');
  } catch (error) {
    console.error('Error renaming column:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
renameColumn()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
