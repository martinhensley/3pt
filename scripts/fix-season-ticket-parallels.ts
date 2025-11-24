import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix Season Ticket parallel structure for 2016 Panini Contenders Draft Picks Basketball
 *
 * Issue: "Season Draft Ticket" is configured as a standalone base set instead of a parallel
 *
 * Required changes:
 * 1. Set isParallel = true
 * 2. Set baseSetSlug = '2016-contenders-draft-picks-season-ticket'
 * 3. Set printRun = 99 (as per Panini specifications)
 * 4. Update slug to follow parallel naming convention
 */
async function fixSeasonTicketParallels() {
  console.log('=== Fixing Season Ticket Parallel Structure ===\n');

  const releaseSlug = '2016-panini-contenders-draft-picks-basketball';
  const baseSetSlug = '2016-contenders-draft-picks-season-ticket';
  const wrongSetSlug = '2016-contenders-draft-picks-season-draft-ticket';
  const correctSetSlug = '2016-contenders-draft-picks-season-ticket-draft-ticket-parallel-99';

  // 1. Verify release exists
  const release = await prisma.release.findUnique({
    where: { slug: releaseSlug }
  });

  if (!release) {
    throw new Error(`Release not found: ${releaseSlug}`);
  }

  console.log('✓ Release found:', release.name);

  // 2. Verify base set exists
  const baseSet = await prisma.set.findUnique({
    where: { slug: baseSetSlug }
  });

  if (!baseSet) {
    throw new Error(`Base set not found: ${baseSetSlug}`);
  }

  console.log('✓ Base set found:', baseSet.name);

  // 3. Find the incorrect Season Draft Ticket set
  const wrongSet = await prisma.set.findUnique({
    where: { slug: wrongSetSlug },
    include: {
      cards: true
    }
  });

  if (!wrongSet) {
    throw new Error(`Season Draft Ticket set not found: ${wrongSetSlug}`);
  }

  console.log('✓ Found incorrect set:', wrongSet.name);
  console.log('  - Current slug:', wrongSet.slug);
  console.log('  - Current isParallel:', wrongSet.isParallel);
  console.log('  - Current baseSetSlug:', wrongSet.baseSetSlug || 'null');
  console.log('  - Current printRun:', wrongSet.printRun || 'null');
  console.log('  - Card count:', wrongSet.cards.length);

  // 4. Check if the correct slug already exists
  const existingCorrectSet = await prisma.set.findUnique({
    where: { slug: correctSetSlug }
  });

  if (existingCorrectSet) {
    throw new Error(`Target slug already exists: ${correctSetSlug}. Manual intervention required.`);
  }

  // 5. Update the set with correct configuration
  console.log('\n=== Applying Updates ===\n');

  const updatedSet = await prisma.set.update({
    where: { slug: wrongSetSlug },
    data: {
      slug: correctSetSlug,
      isParallel: true,
      baseSetSlug: baseSetSlug,
      printRun: 99
    }
  });

  console.log('✓ Set updated successfully');
  console.log('  - New slug:', updatedSet.slug);
  console.log('  - isParallel:', updatedSet.isParallel);
  console.log('  - baseSetSlug:', updatedSet.baseSetSlug);
  console.log('  - printRun:', updatedSet.printRun);

  // 6. Update all cards in this set to have correct print run
  const updatedCards = await prisma.card.updateMany({
    where: { setId: updatedSet.id },
    data: {
      printRun: 99,
      numbered: '/99'
    }
  });

  console.log('✓ Updated', updatedCards.count, 'cards with printRun: 99 and numbered: "/99"');

  // 7. Verify final state
  console.log('\n=== Verification ===\n');

  const allSeasonTicketSets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      OR: [
        { name: { contains: 'Season' } },
        { slug: { contains: 'season' } }
      ]
    },
    orderBy: [
      { isParallel: 'asc' },
      { printRun: 'desc' }
    ]
  });

  console.log('All Season Ticket sets:\n');
  for (const set of allSeasonTicketSets) {
    console.log(`${set.isParallel ? 'PARALLEL' : 'BASE'}: ${set.name}`);
    console.log(`  Slug: ${set.slug}`);
    console.log(`  Base: ${set.baseSetSlug || 'N/A'}`);
    console.log(`  Print Run: ${set.printRun || 'Unlimited'}`);
    console.log('');
  }

  console.log('=== Fix Complete ===');

  await prisma.$disconnect();
}

fixSeasonTicketParallels()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  });
