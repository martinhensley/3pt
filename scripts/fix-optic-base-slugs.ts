#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { generateCardSlug } from '../lib/slugGenerator';

const prisma = new PrismaClient();

async function fixOpticBaseSlugs() {
  console.log('🔧 FIXING OPTIC PARALLEL CARD SLUGS\n');
  console.log('Optic PARALLEL cards (those with variants like Argyle, Black, etc.)');
  console.log('should NOT have "optic" in their slugs according to the Base parallel convention.');
  console.log('Base Optic cards (no variant) should KEEP "optic" in their slugs.\n');

  // Get all Optic sets (Base type with "Optic" in name)
  const opticSets = await prisma.set.findMany({
    where: {
      release: {
        slug: '2024-25-panini-donruss-soccer'
      },
      type: 'Base',
      name: { contains: 'Optic' }
    },
    include: {
      cards: true,
      release: {
        include: {
          manufacturer: true
        }
      }
    }
  });

  console.log(`Found ${opticSets.length} Optic sets to fix\n`);

  let totalFixed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const set of opticSets) {
    console.log(`\n📦 Processing: ${set.name} (${set.cards.length} cards)`);

    // Skip the base Optic set (cards with no variant should keep "optic")
    if (set.name === 'Optic') {
      console.log('   ⏭️ Skipping base Optic set (these cards correctly have "optic" in slug)');
      continue;
    }

    let setFixed = 0;
    let setSkipped = 0;
    let setErrors = 0;

    for (const card of set.cards) {
      const currentSlug = card.slug || '';

      // Check if slug contains "-optic-" AND card has a variant (incorrect for parallels)
      if (currentSlug.includes('-optic-') && card.variant) {
        // Generate correct slug for Optic parallel cards
        // These should NOT have "optic" in the slug per Base parallel convention
        const variantName = card.variant || set.name.replace('Optic ', '').trim();
        const correctSlug = generateCardSlug(
          set.release.manufacturer.name,
          set.release.name,
          set.release.year || '2024-25',
          'Optic',  // Base set name (will be excluded by generateCardSlug for parallels)
          card.cardNumber || '',
          card.playerName || '',
          variantName,  // Parallel variant
          card.printRun,
          'Base'  // It's a Base type parallel
        );

        if (correctSlug !== currentSlug) {
          try {
            // Check for conflicts
            const existingCard = await prisma.card.findUnique({
              where: { slug: correctSlug }
            });

            if (existingCard && existingCard.id !== card.id) {
              console.log(`   ⚠️ Slug conflict for #${card.cardNumber} ${card.playerName}`);
              console.log(`      Current: ${currentSlug}`);
              console.log(`      Desired: ${correctSlug}`);
              console.log(`      Conflicts with card ID: ${existingCard.id}`);
              setErrors++;
              continue;
            }

            // Update the slug
            await prisma.card.update({
              where: { id: card.id },
              data: { slug: correctSlug }
            });

            if (setFixed < 3) {
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
      } else {
        setSkipped++;
      }
    }

    if (setFixed > 3) {
      console.log(`   ... and ${setFixed - 3} more cards`);
    }
    console.log(`   📊 Results: Fixed ${setFixed}, Skipped ${setSkipped}, Errors ${setErrors}`);

    totalFixed += setFixed;
    totalSkipped += setSkipped;
    totalErrors += setErrors;
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ OPTIC SLUG FIX COMPLETE');
  console.log(`   Total cards fixed: ${totalFixed}`);
  console.log(`   Total cards skipped: ${totalSkipped}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log('='.repeat(60) + '\n');

  // Show example URLs
  if (totalFixed > 0) {
    console.log('📎 Example URLs to verify:');

    const examples = await prisma.card.findMany({
      where: {
        set: {
          type: 'Base',
          name: { contains: 'Optic' },
          release: { slug: '2024-25-panini-donruss-soccer' }
        }
      },
      take: 5,
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
fixOpticBaseSlugs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());