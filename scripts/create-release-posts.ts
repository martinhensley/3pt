/**
 * Script to create posts for all releases that don't have posts
 * This ensures all releases appear on the homepage
 */

import { prisma } from '../lib/prisma';

async function createReleasePosts() {
  try {
    console.log('Finding releases without posts...');

    // Get all releases
    const releases = await prisma.release.findMany({
      include: {
        manufacturer: true,
        posts: true,
      },
    });

    console.log(`Found ${releases.length} total releases`);

    // Filter releases that don't have posts
    const releasesWithoutPosts = releases.filter((release) => release.posts.length === 0);

    console.log(`Found ${releasesWithoutPosts.length} releases without posts`);

    if (releasesWithoutPosts.length === 0) {
      console.log('All releases already have posts!');
      return;
    }

    // Get the first admin user ID for authorId
    const adminUsers = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM neon_auth.admin_users LIMIT 1
    `;

    if (!adminUsers || adminUsers.length === 0) {
      throw new Error('No admin users found. Cannot create posts without an author.');
    }

    const authorId = adminUsers[0].id;
    console.log(`Using author ID: ${authorId}`);

    // Create posts for each release
    for (const release of releasesWithoutPosts) {
      try {
        const title = `${release.year || ''} ${release.manufacturer.name} ${release.name}`.trim();
        const postSlug = release.slug; // Use same slug as release

        // Generate content and excerpt
        const content = release.description ||
          `Discover the ${title} release featuring extensive card sets, parallels, and special inserts. Explore the complete checklist and card details.`;

        const excerpt = release.description ||
          `${title} features multiple card sets with parallels and special inserts.`;

        console.log(`Creating post for: ${title}`);

        await prisma.post.create({
          data: {
            title,
            slug: postSlug,
            content,
            excerpt,
            type: 'NEWS',
            published: true,
            releaseId: release.id,
            authorId,
          },
        });

        console.log(`✓ Created post for: ${title}`);
      } catch (error) {
        console.error(`Failed to create post for ${release.name}:`, error);
      }
    }

    console.log('\nDone! All release posts created.');
  } catch (error) {
    console.error('Error creating release posts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createReleasePosts()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
