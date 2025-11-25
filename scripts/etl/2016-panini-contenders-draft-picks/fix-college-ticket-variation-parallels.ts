/**
 * Fix College Ticket Variation Autographs Parallel Sets
 *
 * Issues found:
 * 1. Printing Plate sets (4 colors) have wrong baseSetSlug - point to non-existent
 *    "college-ticket" instead of "college-ticket-variation"
 * 2. Missing Blue Foil Variation parallel (46 cards)
 * 3. Missing Red Foil Variation parallel (46 cards)
 *
 * Actions:
 * 1. Update printing plate baseSetSlug to point to correct variation base set
 * 2. Create Blue Foil Variation parallel set with 46 cards from base variation set
 * 3. Create Red Foil Variation parallel set with 46 cards from base variation set
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_SET_SLUG = '2016-contenders-draft-picks-college-ticket-variation';
const RELEASE_SLUG = '2016-panini-contenders-draft-picks-basketball';

async function main() {
  console.log('=== FIXING COLLEGE TICKET VARIATION PARALLELS ===\n');

  // Step 1: Get the release and base set
  const release = await prisma.release.findUnique({
    where: { slug: RELEASE_SLUG }
  });

  if (!release) {
    throw new Error(`Release not found: ${RELEASE_SLUG}`);
  }

  const baseSet = await prisma.set.findUnique({
    where: { slug: BASE_SET_SLUG },
    include: {
      cards: {
        orderBy: { cardNumber: 'asc' }
      }
    }
  });

  if (!baseSet) {
    throw new Error(`Base set not found: ${BASE_SET_SLUG}`);
  }

  console.log(`✓ Found base set: ${baseSet.name} (${baseSet.cards.length} cards)\n`);

  // Step 2: Fix printing plate baseSetSlug references
  console.log('STEP 1: Fixing Printing Plate baseSetSlug references\n');

  const plateColors = ['Black', 'Cyan', 'Magenta', 'Yellow'];

  for (const color of plateColors) {
    const plateSet = await prisma.set.findFirst({
      where: {
        AND: [
          { name: { contains: 'College' } },
          { name: { contains: 'Printing Plate' } },
          { name: { contains: color } }
        ]
      }
    });

    if (plateSet) {
      const currentBase = plateSet.baseSetSlug || 'null';

      if (plateSet.baseSetSlug !== BASE_SET_SLUG) {
        await prisma.set.update({
          where: { id: plateSet.id },
          data: { baseSetSlug: BASE_SET_SLUG }
        });
        console.log(`✓ Updated ${color} Printing Plate: ${currentBase} → ${BASE_SET_SLUG}`);
      } else {
        console.log(`  ${color} Printing Plate: Already correct`);
      }
    } else {
      console.log(`✗ ${color} Printing Plate: NOT FOUND`);
    }
  }

  // Step 3: Create Blue Foil Variation parallel set
  console.log('\nSTEP 2: Creating Blue Foil Variation parallel set\n');

  const blueSetSlug = '2016-contenders-draft-picks-college-ticket-variation-draft-blue-foil-parallel';

  const existingBlue = await prisma.set.findUnique({
    where: { slug: blueSetSlug }
  });

  if (existingBlue) {
    console.log('  Blue Foil Variation set already exists, skipping creation');
  } else {
    // Create the set
    const blueSet = await prisma.set.create({
      data: {
        name: 'College Draft Ticket Blue Foil Variation',
        slug: blueSetSlug,
        type: 'Autograph',
        isParallel: true,
        baseSetSlug: BASE_SET_SLUG,
        printRun: null, // Unnumbered
        releaseId: release.id
      }
    });

    console.log(`✓ Created set: ${blueSet.name}`);

    // Copy all cards from base set
    let cardCount = 0;
    for (const baseCard of baseSet.cards) {
      // Generate new slug for parallel card
      const cardSlug = `2016-contenders-draft-picks-${baseCard.cardNumber}-${baseCard.playerName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-draft-blue-foil`;

      await prisma.card.create({
        data: {
          cardNumber: baseCard.cardNumber,
          playerName: baseCard.playerName,
          team: baseCard.team,
          variant: 'Draft Blue Foil',
          printRun: null, // Unnumbered
          numbered: null, // Unnumbered
          slug: cardSlug,
          setId: blueSet.id
        }
      });
      cardCount++;
    }

    console.log(`✓ Created ${cardCount} cards in Blue Foil Variation set\n`);
  }

  // Step 4: Create Red Foil Variation parallel set
  console.log('STEP 3: Creating Red Foil Variation parallel set\n');

  const redSetSlug = '2016-contenders-draft-picks-college-ticket-variation-draft-red-foil-parallel';

  const existingRed = await prisma.set.findUnique({
    where: { slug: redSetSlug }
  });

  if (existingRed) {
    console.log('  Red Foil Variation set already exists, skipping creation');
  } else {
    // Create the set
    const redSet = await prisma.set.create({
      data: {
        name: 'College Draft Ticket Red Foil Variation',
        slug: redSetSlug,
        type: 'Autograph',
        isParallel: true,
        baseSetSlug: BASE_SET_SLUG,
        printRun: null, // Unnumbered
        releaseId: release.id
      }
    });

    console.log(`✓ Created set: ${redSet.name}`);

    // Copy all cards from base set
    let cardCount = 0;
    for (const baseCard of baseSet.cards) {
      // Generate new slug for parallel card
      const cardSlug = `2016-contenders-draft-picks-${baseCard.cardNumber}-${baseCard.playerName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-draft-red-foil`;

      await prisma.card.create({
        data: {
          cardNumber: baseCard.cardNumber,
          playerName: baseCard.playerName,
          team: baseCard.team,
          variant: 'Draft Red Foil',
          printRun: null, // Unnumbered
          numbered: null, // Unnumbered
          slug: cardSlug,
          setId: redSet.id
        }
      });
      cardCount++;
    }

    console.log(`✓ Created ${cardCount} cards in Red Foil Variation set\n`);
  }

  // Step 5: Verification
  console.log('STEP 4: Verification\n');

  const allVariationSets = await prisma.set.findMany({
    where: {
      AND: [
        { name: { contains: 'College' } },
        { name: { contains: 'Variation' } }
      ]
    },
    include: {
      _count: { select: { cards: true } }
    },
    orderBy: [
      { isParallel: 'asc' },
      { name: 'asc' }
    ]
  });

  console.log(`Found ${allVariationSets.length} College Ticket Variation sets:\n`);

  for (const set of allVariationSets) {
    const status = set._count.cards === 46 ? '✓' : '✗';
    const baseStatus = set.isParallel && set.baseSetSlug === BASE_SET_SLUG ? '✓' :
                       set.isParallel ? '✗' : ' ';

    console.log(`${status} ${set.name} (${set._count.cards} cards)`);
    if (set.isParallel) {
      console.log(`  ${baseStatus} baseSetSlug: ${set.baseSetSlug}`);
    }
  }

  console.log('\n=== COMPLETE ===\n');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
