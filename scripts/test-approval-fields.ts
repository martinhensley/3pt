import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing approval fields...\n');

  // Get the first release
  const release = await prisma.release.findFirst({
    select: {
      id: true,
      name: true,
      isApproved: true,
      approvedAt: true,
      approvedBy: true,
    },
  });

  if (release) {
    console.log('✅ Successfully fetched release with approval fields:');
    console.log(JSON.stringify(release, null, 2));
  } else {
    console.log('⚠️  No releases found in database');
  }
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
