import { prisma } from '../lib/prisma';

async function checkPostTypes() {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, type: true }
  });

  const oldTypePosts = posts.filter(p => ['CARD', 'SET', 'RELEASE'].includes(p.type));

  console.log('Total posts:', posts.length);
  console.log('Posts with CARD/SET/RELEASE types:', oldTypePosts.length);

  if (oldTypePosts.length > 0) {
    console.log('\nPosts that will be affected:');
    console.log(JSON.stringify(oldTypePosts, null, 2));
  }

  await prisma.$disconnect();
}

checkPostTypes().catch(console.error);
