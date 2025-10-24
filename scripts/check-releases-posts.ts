import { prisma } from '../lib/prisma';

async function checkReleasesAndPosts() {
  // Check all releases
  const releases = await prisma.release.findMany({
    include: {
      manufacturer: true,
      posts: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n=== RELEASES ===');
  console.log(`Total releases: ${releases.length}`);
  releases.forEach(r => {
    console.log(`\n${r.manufacturer.name} ${r.name} ${r.year || ''}`);
    console.log(`  ID: ${r.id}`);
    console.log(`  Slug: ${r.slug}`);
    console.log(`  Posts linked: ${r.posts.length}`);
  });

  // Check posts with RELEASE type (this type no longer exists!)
  const releasePosts = await prisma.post.findMany({
    where: { type: 'RELEASE' as any },
  }).catch(() => []);

  console.log('\n=== POSTS WITH TYPE "RELEASE" ===');
  console.log(`Total: ${releasePosts.length}`);

  // Check all post types
  const allPosts = await prisma.post.findMany({
    select: { id: true, title: true, type: true, releaseId: true },
  });

  console.log('\n=== ALL POSTS ===');
  console.log(`Total posts: ${allPosts.length}`);
  allPosts.forEach(p => {
    console.log(`  ${p.title} - Type: ${p.type}, ReleaseID: ${p.releaseId || 'none'}`);
  });

  await prisma.$disconnect();
}

checkReleasesAndPosts().catch(console.error);
