import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateDescriptionToReview() {
  console.log('Starting migration: description → review');

  try {
    // Step 1: Add new columns
    console.log('Step 1: Adding review and reviewDate columns...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Release" ADD COLUMN IF NOT EXISTS "review" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Release" ADD COLUMN IF NOT EXISTS "reviewDate" TIMESTAMP(3);
    `);
    console.log('  ✓ Columns added');

    // Step 2: Copy data
    console.log('\nStep 2: Copying description data to review...');
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "Release"
      SET "review" = "description",
          "reviewDate" = NOW()
      WHERE "description" IS NOT NULL;
    `);
    console.log(`  ✓ Copied ${result} row(s)`);

    // Step 3: Drop old column
    console.log('\nStep 3: Dropping description column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Release" DROP COLUMN IF EXISTS "description";
    `);
    console.log('  ✓ Column dropped');

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateDescriptionToReview()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
