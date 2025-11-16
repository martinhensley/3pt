import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function approveAllReleases() {
  try {
    console.log('🔍 Checking release approval status...\n');

    // Get all releases
    const releases = await prisma.release.findMany({
      select: {
        id: true,
        name: true,
        year: true,
        slug: true,
        isApproved: true,
        approvedAt: true,
        manufacturer: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`Found ${releases.length} release(s):\n`);

    const unapproved = releases.filter(r => !r.isApproved);
    const approved = releases.filter(r => r.isApproved);

    if (approved.length > 0) {
      console.log(`✅ Already approved (${approved.length}):`);
      approved.forEach(r => {
        const title = `${r.year || ''} ${r.manufacturer.name} ${r.name}`.trim();
        console.log(`  • ${title}`);
      });
      console.log();
    }

    if (unapproved.length > 0) {
      console.log(`❌ Not approved (${unapproved.length}):`);
      unapproved.forEach(r => {
        const title = `${r.year || ''} ${r.manufacturer.name} ${r.name}`.trim();
        console.log(`  • ${title}`);
      });
      console.log();

      console.log('📝 Approving all releases...\n');

      const result = await prisma.release.updateMany({
        where: {
          isApproved: false
        },
        data: {
          isApproved: true,
          approvedAt: new Date()
        }
      });

      console.log(`✅ Approved ${result.count} release(s)\n`);
    } else {
      console.log('✅ All releases are already approved!\n');
    }

    // Show final status
    console.log('📊 Final status:');
    const finalReleases = await prisma.release.findMany({
      select: {
        id: true,
        name: true,
        year: true,
        isApproved: true,
        manufacturer: {
          select: {
            name: true
          }
        }
      }
    });

    finalReleases.forEach(r => {
      const title = `${r.year || ''} ${r.manufacturer.name} ${r.name}`.trim();
      const status = r.isApproved ? '✅' : '❌';
      console.log(`  ${status} ${title}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

approveAllReleases().catch(console.error);
