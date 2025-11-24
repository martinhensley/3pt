/**
 * Fix multiple issues with College Ticket sets in 2016 Panini Contenders Draft Picks Basketball
 *
 * Fixes:
 * 1. Change all College Ticket sets from Base → Autograph type
 * 2. Change College Playoff Ticket print run from 99 → 15 (and update slug)
 * 3. Change College Draft Ticket from unnumbered → /99
 * 4. Update all cards in affected sets with correct printRun and numbered fields
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n🔧 FIXING COLLEGE TICKET SETS\n');
    console.log('═'.repeat(80));

    // Step 1: Find the release
    const release = await prisma.release.findFirst({
      where: {
        slug: '2016-panini-contenders-draft-picks-basketball'
      }
    });

    if (!release) {
      console.error('❌ Release not found: 2016-panini-contenders-draft-picks-basketball');
      return;
    }

    console.log(`✅ Found release: ${release.name} (${release.slug})\n`);

    // Step 2: Find all College Ticket sets
    const sets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        OR: [
          { name: { contains: 'College', mode: 'insensitive' } },
          { slug: { contains: 'college', mode: 'insensitive' } }
        ]
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    console.log(`📊 Found ${sets.length} College Ticket sets to fix\n`);

    // Step 3: Fix all set types from Base → Autograph
    console.log('═'.repeat(80));
    console.log('STEP 1: Changing all set types from Base → Autograph\n');

    let typeFixCount = 0;
    for (const set of sets) {
      if (set.type === 'Base') {
        await prisma.set.update({
          where: { id: set.id },
          data: { type: 'Autograph' }
        });
        console.log(`✅ Updated type for: ${set.name}`);
        typeFixCount++;
      }
    }
    console.log(`\n✅ Updated type for ${typeFixCount} sets\n`);

    // Step 4: Fix College Draft Ticket print run (unnumbered → 99)
    console.log('═'.repeat(80));
    console.log('STEP 2: Fixing College Draft Ticket print run to 99\n');

    const draftTicket = sets.find(s =>
      s.name === 'College Draft Ticket' &&
      !s.name.includes('Variation') &&
      !s.name.includes('Blue Foil') &&
      !s.name.includes('Red Foil')
    );

    if (draftTicket) {
      // Update set
      const newSlug = draftTicket.slug.replace('-parallel', '-parallel-99');
      await prisma.set.update({
        where: { id: draftTicket.id },
        data: {
          printRun: 99,
          slug: newSlug
        }
      });
      console.log(`✅ Updated set: ${draftTicket.name}`);
      console.log(`   - Print Run: Unnumbered → 99`);
      console.log(`   - Slug: ${draftTicket.slug} → ${newSlug}`);

      // Update all cards in this set
      const cardUpdateResult = await prisma.card.updateMany({
        where: { setId: draftTicket.id },
        data: {
          printRun: 99,
          numbered: '/99'
        }
      });
      console.log(`   - Updated ${cardUpdateResult.count} cards with printRun=99 and numbered="/99"\n`);
    } else {
      console.log('⚠️  College Draft Ticket not found\n');
    }

    // Step 5: Fix College Playoff Ticket print run (99 → 15)
    console.log('═'.repeat(80));
    console.log('STEP 3: Fixing College Playoff Ticket print run from 99 → 15\n');

    const playoffTicket = sets.find(s =>
      s.name === 'College Playoff Ticket' &&
      !s.name.includes('Variation')
    );

    if (playoffTicket) {
      // Update set
      const newSlug = playoffTicket.slug.replace('-99', '-15');
      await prisma.set.update({
        where: { id: playoffTicket.id },
        data: {
          printRun: 15,
          slug: newSlug
        }
      });
      console.log(`✅ Updated set: ${playoffTicket.name}`);
      console.log(`   - Print Run: 99 → 15`);
      console.log(`   - Slug: ${playoffTicket.slug} → ${newSlug}`);

      // Update all cards in this set
      const cardUpdateResult = await prisma.card.updateMany({
        where: { setId: playoffTicket.id },
        data: {
          printRun: 15,
          numbered: '/15'
        }
      });
      console.log(`   - Updated ${cardUpdateResult.count} cards with printRun=15 and numbered="/15"\n`);
    } else {
      console.log('⚠️  College Playoff Ticket not found\n');
    }

    // Step 6: Fix College Playoff Ticket Variation print run (99 → 15)
    const playoffTicketVar = sets.find(s =>
      s.name === 'College Playoff Ticket Variation'
    );

    if (playoffTicketVar) {
      // Update set
      const newSlug = playoffTicketVar.slug.replace('-99', '-15');
      await prisma.set.update({
        where: { id: playoffTicketVar.id },
        data: {
          printRun: 15,
          slug: newSlug
        }
      });
      console.log(`✅ Updated set: ${playoffTicketVar.name}`);
      console.log(`   - Print Run: 99 → 15`);
      console.log(`   - Slug: ${playoffTicketVar.slug} → ${newSlug}`);

      // Update all cards in this set (if any)
      const cardUpdateResult = await prisma.card.updateMany({
        where: { setId: playoffTicketVar.id },
        data: {
          printRun: 15,
          numbered: '/15'
        }
      });
      console.log(`   - Updated ${cardUpdateResult.count} cards with printRun=15 and numbered="/15"\n`);
    } else {
      console.log('⚠️  College Playoff Ticket Variation not found\n');
    }

    // Summary
    console.log('═'.repeat(80));
    console.log('✅ ALL FIXES COMPLETED\n');
    console.log('Summary:');
    console.log(`- Changed ${typeFixCount} sets from Base → Autograph type`);
    console.log(`- Fixed College Draft Ticket print run to 99`);
    console.log(`- Fixed College Playoff Ticket print run to 15`);
    console.log(`- Fixed College Playoff Ticket Variation print run to 15`);
    console.log('\nRun query-college-ticket-sets.ts to verify all changes.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
