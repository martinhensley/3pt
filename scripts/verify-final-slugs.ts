#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySpecificCards() {
  console.log('\n🔍 VERIFYING SPECIFIC CARD SLUGS\n');

  // 1. Check Abby Dahlkemper cards
  console.log('1️⃣ Abby Dahlkemper Cards (#9):');
  console.log('================================');
  const abbyCards = await prisma.card.findMany({
    where: {
      playerName: { contains: 'Abby Dahlkemper' },
      cardNumber: '9'
    },
    include: { set: true },
    orderBy: { set: { name: 'asc' } }
  });

  for (const card of abbyCards) {
    const hasSetName = card.slug?.includes('beautiful-game');
    const status = hasSetName || card.set.type === 'Base' ? '✅' : '❌';
    console.log(`  ${status} Set: ${card.set.name} (${card.set.type})`);
    console.log(`     Slug: ${card.slug}`);
  }

  // 2. Sample Beautiful Game Autographs
  console.log('\n2️⃣ Sample Beautiful Game Autographs:');
  console.log('=====================================');
  const bgaCards = await prisma.card.findMany({
    where: {
      set: { name: { contains: 'Beautiful Game Autographs' } }
    },
    include: { set: true },
    take: 3
  });

  for (const card of bgaCards) {
    const hasSetName = card.slug?.includes('beautiful-game-autographs');
    console.log(`  ${hasSetName ? '✅' : '❌'} #${card.cardNumber} ${card.playerName}`);
    console.log(`     Slug: ${card.slug}`);
  }

  // 3. Base set parallels (should NOT have set name)
  console.log('\n3️⃣ Base Set Parallels (should NOT have set name):');
  console.log('================================================');
  const baseParallels = await prisma.card.findMany({
    where: {
      set: {
        type: 'Base',
        name: { contains: 'Black' }
      }
    },
    include: { set: true },
    take: 3
  });

  for (const card of baseParallels) {
    const hasBase = card.slug?.includes('-base-') || card.slug?.includes('-optic-');
    console.log(`  ${!hasBase ? '✅' : '❌'} #${card.cardNumber} ${card.playerName} (${card.set.name})`);
    console.log(`     Slug: ${card.slug}`);
  }

  // 4. Insert cards (should have set name)
  console.log('\n4️⃣ Insert Cards (should have set name):');
  console.log('======================================');
  const insertCards = await prisma.card.findMany({
    where: {
      set: { type: 'Insert' }
    },
    include: { set: true },
    take: 3
  });

  for (const card of insertCards) {
    const setNamePart = card.set.name.toLowerCase().replace(/\s+/g, '-');
    const hasSetName = card.slug?.includes(setNamePart);
    console.log(`  ${hasSetName ? '✅' : '❌'} ${card.set.name} #${card.cardNumber} ${card.playerName}`);
    console.log(`     Slug: ${card.slug}`);
  }

  // 5. Count issues
  console.log('\n📊 SUMMARY:');
  console.log('===========');

  // Count Base cards with set names (should be 0)
  const baseWithSetName = await prisma.card.count({
    where: {
      set: {
        type: 'Base',
        OR: [
          { name: { contains: 'Black' } },
          { name: { contains: 'Blue' } },
          { name: { contains: 'Gold' } },
          { name: { contains: 'Red' } },
          { name: { contains: 'Green' } },
          { name: { contains: 'Pink' } },
          { name: { contains: 'Purple' } },
          { name: { contains: 'Teal' } },
          { name: { contains: 'Silver' } },
          { name: { contains: 'Cubic' } },
          { name: { contains: 'Diamond' } },
        ]
      },
      OR: [
        { slug: { contains: '-base-' } },
        { slug: { contains: '-optic-' } }
      ]
    }
  });

  // Check if any Insert/Auto/Mem cards are missing their set names
  // We'll do a simpler check - count all Insert/Auto/Mem cards
  const allNonBase = await prisma.card.count({
    where: {
      set: {
        type: { in: ['Insert', 'Autograph', 'Memorabilia'] }
      }
    }
  });

  // Count those that DO have set names
  const nonBaseWithSetName = await prisma.card.count({
    where: {
      set: {
        type: { in: ['Insert', 'Autograph', 'Memorabilia'] }
      },
      OR: [
        { slug: { contains: '-animation-' } },
        { slug: { contains: '-craftsmen-' } },
        { slug: { contains: '-crunch-time-' } },
        { slug: { contains: '-kaboom-' } },
        { slug: { contains: '-kit-kings-' } },
        { slug: { contains: '-kit-series-' } },
        { slug: { contains: '-magicians-' } },
        { slug: { contains: '-net-marvels-' } },
        { slug: { contains: '-night-moves-' } },
        { slug: { contains: '-pitch-kings-' } },
        { slug: { contains: '-rookie-kings-' } },
        { slug: { contains: '-the-rookies-' } },
        { slug: { contains: '-zero-gravity-' } },
        { slug: { contains: '-beautiful-game-autographs-' } },
        { slug: { contains: '-beautiful-game-dual-autographs-' } },
        { slug: { contains: '-signature-series-' } }
      ]
    }
  });

  const nonBaseWithoutSetName = allNonBase - nonBaseWithSetName;

  console.log(`  Base parallels with set name in slug (should be 0): ${baseWithSetName}`);
  console.log(`  Insert/Auto/Mem without set name in slug (should be 0): ${nonBaseWithoutSetName}`);

  if (baseWithSetName === 0 && nonBaseWithoutSetName === 0) {
    console.log('\n✅ ALL CARD SLUGS ARE CORRECT!');
  } else {
    console.log('\n⚠️ Some cards may still have incorrect slugs');
    if (baseWithSetName > 0) {
      console.log(`   - ${baseWithSetName} Base parallel cards incorrectly have set name in slug`);
    }
    if (nonBaseWithoutSetName > 0) {
      console.log(`   - ${nonBaseWithoutSetName} Insert/Auto/Mem cards missing set name in slug`);
    }
  }

  await prisma.$disconnect();
}

verifySpecificCards().catch(console.error);