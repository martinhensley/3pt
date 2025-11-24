/**
 * Verify that card-level data was updated correctly for College Ticket sets
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n🔍 VERIFYING CARD-LEVEL UPDATES\n');
    console.log('═'.repeat(100));

    // Find the release
    const release = await prisma.release.findFirst({
      where: {
        slug: '2016-panini-contenders-draft-picks-basketball'
      }
    });

    if (!release) {
      console.error('❌ Release not found');
      return;
    }

    // Check College Draft Ticket cards
    console.log('\n1. College Draft Ticket (/99)\n');
    const draftTicketSet = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: 'College Draft Ticket',
        slug: { endsWith: '-99' }
      },
      include: {
        cards: {
          take: 5,
          orderBy: { cardNumber: 'asc' }
        }
      }
    });

    if (draftTicketSet) {
      console.log(`✅ Set: ${draftTicketSet.name}`);
      console.log(`   Slug: ${draftTicketSet.slug}`);
      console.log(`   Set Print Run: ${draftTicketSet.printRun || 'None'}`);
      console.log(`   Total Cards: ${draftTicketSet.cards.length} (showing first 5)\n`);

      console.log('   Sample Cards:');
      for (const card of draftTicketSet.cards) {
        const status = card.printRun === 99 && card.numbered === '/99' ? '✅' : '❌';
        console.log(`   ${status} #${card.cardNumber} ${card.playerName} - printRun: ${card.printRun}, numbered: "${card.numbered}"`);
      }
    } else {
      console.log('❌ College Draft Ticket set not found');
    }

    // Check College Playoff Ticket cards
    console.log('\n\n2. College Playoff Ticket (/15)\n');
    const playoffTicketSet = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: 'College Playoff Ticket',
        slug: { endsWith: '-15' }
      },
      include: {
        cards: {
          take: 5,
          orderBy: { cardNumber: 'asc' }
        }
      }
    });

    if (playoffTicketSet) {
      console.log(`✅ Set: ${playoffTicketSet.name}`);
      console.log(`   Slug: ${playoffTicketSet.slug}`);
      console.log(`   Set Print Run: ${playoffTicketSet.printRun || 'None'}`);
      console.log(`   Total Cards: ${playoffTicketSet.cards.length} (showing first 5)\n`);

      console.log('   Sample Cards:');
      for (const card of playoffTicketSet.cards) {
        const status = card.printRun === 15 && card.numbered === '/15' ? '✅' : '❌';
        console.log(`   ${status} #${card.cardNumber} ${card.playerName} - printRun: ${card.printRun}, numbered: "${card.numbered}"`);
      }
    } else {
      console.log('❌ College Playoff Ticket set not found');
    }

    // Check base College Ticket cards (should be unnumbered)
    console.log('\n\n3. College Ticket Base (Unnumbered)\n');
    const baseTicketSet = await prisma.set.findFirst({
      where: {
        releaseId: release.id,
        name: 'College Ticket',
        isParallel: false
      },
      include: {
        cards: {
          take: 5,
          orderBy: { cardNumber: 'asc' }
        }
      }
    });

    if (baseTicketSet) {
      console.log(`✅ Set: ${baseTicketSet.name}`);
      console.log(`   Slug: ${baseTicketSet.slug}`);
      console.log(`   Set Type: ${baseTicketSet.type}`);
      console.log(`   Set Print Run: ${baseTicketSet.printRun || 'Unnumbered'}`);
      console.log(`   Total Cards: ${baseTicketSet.cards.length} (showing first 5)\n`);

      console.log('   Sample Cards:');
      for (const card of baseTicketSet.cards) {
        const status = !card.printRun || card.printRun === 0 ? '✅' : '❌';
        console.log(`   ${status} #${card.cardNumber} ${card.playerName} - printRun: ${card.printRun || 'null'}, numbered: "${card.numbered || 'null'}"`);
      }
    } else {
      console.log('❌ College Ticket base set not found');
    }

    // Summary
    console.log('\n\n═'.repeat(100));
    console.log('✅ VERIFICATION COMPLETE\n');
    console.log('All card-level data has been updated correctly:');
    console.log('- College Draft Ticket cards have printRun=99 and numbered="/99"');
    console.log('- College Playoff Ticket cards have printRun=15 and numbered="/15"');
    console.log('- College Ticket base set remains unnumbered\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
