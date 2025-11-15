#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { generateCardSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function fixCardSlugs() {
  console.log('🔧 FIXING CARD SLUGS - Adding Set Names for Insert/Auto/Mem Cards\n');

  // Get all cards grouped by set, but only for non-Base sets
  const sets = await prisma.set.findMany({
    where: {
      release: {
        slug: '2024-25-panini-donruss-soccer'
      },
      // Focus on sets that need fixing - Insert, Autograph, and Memorabilia sets
      type: {
        in: ['Insert', 'Autograph', 'Memorabilia']
      }
    },
    include: {
      cards: {
        orderBy: {
          cardNumber: 'asc'
        }
      },
      release: {
        include: {
          manufacturer: true
        }
      }
    }
  });

  console.log(`📊 Found ${sets.length} Insert/Auto/Mem sets to fix\n`);

  let totalFixed = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  for (const set of sets) {
    console.log(`\n📦 Processing: ${set.name} (${set.type})`);
    console.log(`   Cards: ${set.cards.length}`);

    let setFixed = 0;
    let setErrors = 0;
    let setSkipped = 0;

    for (const card of set.cards) {
      // Check if the current slug is missing the set name
      // It should include the set name for all Insert/Auto/Mem cards
      const currentSlug = card.slug || '';

      // Generate the correct slug with set name included
      const correctSlug = generateCardSlug(
        set.release.manufacturer.name,
        set.release.name,
        set.release.year || '2024-25',
        set.name,
        card.cardNumber || '',
        card.playerName || '',
        card.variant,
        card.printRun,
        set.type  // Pass the set type to ensure set name is included
      );

      // Check if the slug needs updating
      if (currentSlug !== correctSlug) {
        try {
          // Check if the new slug would conflict with an existing card
          const existingCard = await prisma.card.findUnique({
            where: { slug: correctSlug }
          });

          if (existingCard && existingCard.id !== card.id) {
            console.log(`   ⚠️ Slug conflict for card #${card.cardNumber} ${card.playerName}`);
            console.log(`      Current: ${currentSlug}`);
            console.log(`      Desired: ${correctSlug}`);
            console.log(`      Conflict with card: ${existingCard.id}`);
            setErrors++;
            continue;
          }

          // Update the card slug
          await prisma.card.update({
            where: { id: card.id },
            data: { slug: correctSlug }
          });

          // Log first few updates and special cases
          if (setFixed < 3 || card.printRun === 1) {
            console.log(`   ✅ Fixed: #${card.cardNumber} ${card.playerName}`);
            console.log(`      Old: ${currentSlug}`);
            console.log(`      New: ${correctSlug}`);
          }

          setFixed++;
        } catch (error) {
          console.error(`   ❌ Error updating card ${card.id}: ${error}`);
          setErrors++;
        }
      } else {
        setSkipped++;
      }
    }

    console.log(`   📊 Results: Fixed ${setFixed}, Skipped ${setSkipped}, Errors ${setErrors}`);

    totalFixed += setFixed;
    totalErrors += setErrors;
    totalSkipped += setSkipped;
  }

  // Also check Base sets to ensure they're still correct
  console.log('\n\n🔍 Verifying Base sets remain unchanged...\n');

  const baseSets = await prisma.set.findMany({
    where: {
      release: {
        slug: '2024-25-panini-donruss-soccer'
      },
      type: 'Base'
    },
    include: {
      cards: {
        take: 5  // Just check a sample
      }
    }
  });

  console.log(`Found ${baseSets.length} Base sets to verify\n`);

  for (const set of baseSets) {
    console.log(`📦 ${set.name}: Checking ${set.cards.length} sample cards`);

    for (const card of set.cards) {
      const slug = card.slug || '';
      const hasSetName = slug.includes(set.name.toLowerCase().replace(/\s+/g, '-'));

      // Base cards without variants should have set name
      // Base cards with variants (parallels) should NOT have set name
      if (!card.variant && !hasSetName) {
        console.log(`   ⚠️ Base card missing set name: ${slug}`);
      } else if (card.variant && card.variant !== set.name && hasSetName) {
        console.log(`   ⚠️ Base parallel has set name (should not): ${slug}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ CARD SLUG FIX COMPLETE');
  console.log(`   Total cards fixed: ${totalFixed}`);
  console.log(`   Total cards skipped: ${totalSkipped}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log('='.repeat(60) + '\n');

  // Show some example URLs for verification
  if (totalFixed > 0) {
    console.log('📎 Example URLs to verify:');

    const examples = await prisma.card.findMany({
      where: {
        set: {
          type: { in: ['Autograph', 'Insert'] },
          release: { slug: '2024-25-panini-donruss-soccer' }
        }
      },
      take: 3,
      include: {
        set: true
      }
    });

    for (const card of examples) {
      console.log(`   http://localhost:3000/cards/${card.slug}`);
      console.log(`     → ${card.set.name} #${card.cardNumber} ${card.playerName}`);
    }
  }
}

// Run the fix
fixCardSlugs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());