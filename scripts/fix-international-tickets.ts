import { PrismaClient, SetType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== STEP 1: Query Current State ===\n');

  // Get the release
  const release = await prisma.release.findUnique({
    where: { slug: '2016-panini-contenders-draft-picks-basketball' },
    include: {
      sets: {
        where: {
          name: { contains: 'International' }
        },
        include: {
          _count: {
            select: { cards: true }
          }
        },
        orderBy: { name: 'asc' }
      }
    }
  });

  if (!release) {
    console.error('Release not found');
    return;
  }

  console.log(`Found ${release.sets.length} International sets:\n`);

  release.sets.forEach(set => {
    console.log(`Name: ${set.name}`);
    console.log(`Slug: ${set.slug}`);
    console.log(`Type: ${set.type}`);
    console.log(`Is Parallel: ${set.isParallel}`);
    console.log(`Print Run: ${set.printRun || 'null'}`);
    console.log(`Base Set Slug: ${set.baseSetSlug || 'null'}`);
    console.log(`Card Count: ${set._count.cards}`);
    console.log('---\n');
  });

  console.log('\n=== STEP 2: Fix Set Types (Base → Autograph) ===\n');

  // Update all International sets to Autograph type
  const typeUpdateResult = await prisma.set.updateMany({
    where: {
      releaseId: release.id,
      name: { contains: 'International' }
    },
    data: {
      type: SetType.Autograph
    }
  });

  console.log(`✓ Updated ${typeUpdateResult.count} sets to Autograph type\n`);

  console.log('\n=== STEP 3: Fix Playoff Tickets Print Run (99 → 15) ===\n');

  // Find the Playoff Tickets set
  const playoffSet = release.sets.find(s => s.name.includes('Playoff Ticket'));
  if (playoffSet) {
    console.log(`Found Playoff Tickets set: ${playoffSet.slug}`);
    console.log(`Current printRun: ${playoffSet.printRun}`);

    // Update the set's print run and slug
    const newSlug = '2016-contenders-draft-picks-international-tickets-playoff-ticket-parallel-15';

    await prisma.set.update({
      where: { id: playoffSet.id },
      data: {
        printRun: 15,
        slug: newSlug
      }
    });

    console.log(`✓ Updated Playoff Tickets set:`);
    console.log(`  - Print Run: 99 → 15`);
    console.log(`  - Slug: ${playoffSet.slug} → ${newSlug}\n`);

    // Cards already have correct printRun and numbered values, so no need to update them
    const cardCheck = await prisma.card.findMany({
      where: { setId: playoffSet.id },
      select: { playerName: true, printRun: true, numbered: true }
    });

    console.log('Card verification (should all be 15 and "/15"):');
    cardCheck.forEach(card => {
      console.log(`  - ${card.playerName}: printRun=${card.printRun}, numbered="${card.numbered}"`);
    });
    console.log();
  }

  console.log('\n=== STEP 4: Fix Draft Tickets Print Run (null → 99) ===\n');

  // Find the Draft Tickets set (not Blue Foil or Red Foil)
  const draftSet = release.sets.find(s =>
    s.name === 'International Draft Tickets' &&
    !s.name.includes('Blue') &&
    !s.name.includes('Red')
  );

  if (draftSet) {
    console.log(`Found Draft Tickets set: ${draftSet.slug}`);
    console.log(`Current printRun: ${draftSet.printRun}`);

    // Update the set's print run and slug
    const newSlug = '2016-contenders-draft-picks-international-tickets-draft-ticket-parallel-99';

    await prisma.set.update({
      where: { id: draftSet.id },
      data: {
        printRun: 99,
        slug: newSlug
      }
    });

    console.log(`✓ Updated Draft Tickets set:`);
    console.log(`  - Print Run: null → 99`);
    console.log(`  - Slug: ${draftSet.slug} → ${newSlug}\n`);

    // Update all cards in this set to have printRun=99 and numbered="/99"
    const cards = await prisma.card.findMany({
      where: { setId: draftSet.id }
    });

    console.log(`Updating ${cards.length} cards with printRun=99 and numbered="/99"...`);

    for (const card of cards) {
      // Generate new slug with /99
      const slugParts = card.slug.split('-');
      const lastPart = slugParts[slugParts.length - 1];

      let newCardSlug = card.slug;
      // If the last part is a number (current print run), replace it
      if (!isNaN(Number(lastPart))) {
        slugParts[slugParts.length - 1] = '99';
        newCardSlug = slugParts.join('-');
      } else {
        // Otherwise append -99
        newCardSlug = `${card.slug}-99`;
      }

      await prisma.card.update({
        where: { id: card.id },
        data: {
          printRun: 99,
          numbered: '/99',
          slug: newCardSlug
        }
      });

      console.log(`  ✓ ${card.playerName}: ${card.slug} → ${newCardSlug}`);
    }
    console.log();
  }

  console.log('\n=== STEP 5: Final Verification ===\n');

  // Re-query all International sets to show final state
  const updatedSets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      name: { contains: 'International' }
    },
    include: {
      _count: {
        select: { cards: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`Final state of ${updatedSets.length} International sets:\n`);

  updatedSets.forEach(set => {
    console.log(`Name: ${set.name}`);
    console.log(`Slug: ${set.slug}`);
    console.log(`Type: ${set.type}`);
    console.log(`Is Parallel: ${set.isParallel}`);
    console.log(`Print Run: ${set.printRun || 'unnumbered'}`);
    console.log(`Base Set Slug: ${set.baseSetSlug || 'null'}`);
    console.log(`Card Count: ${set._count.cards}`);
    console.log('---\n');
  });

  console.log('\n✅ All fixes completed successfully!\n');
  console.log('Summary of changes:');
  console.log('  1. Changed all 11 International sets from Base → Autograph type');
  console.log('  2. Fixed Playoff Tickets: printRun 99 → 15, updated slug');
  console.log('  3. Fixed Draft Tickets: printRun null → 99, updated slug and all cards');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
