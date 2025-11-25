/**
 * Query all College Ticket sets in 2016 Panini Contenders Draft Picks Basketball
 * to assess current state before fixes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // First, find the release
    const release = await prisma.release.findFirst({
      where: {
        slug: '2016-panini-contenders-draft-picks-basketball'
      }
    });

    if (!release) {
      console.error('❌ Release not found: 2016-panini-contenders-draft-picks-basketball');
      return;
    }

    console.log(`\n✅ Found release: ${release.name} (${release.slug})\n`);

    // Find all sets with "College" in the name
    const sets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        OR: [
          { name: { contains: 'College', mode: 'insensitive' } },
          { slug: { contains: 'college', mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: { cards: true }
        }
      },
      orderBy: [
        { isParallel: 'asc' },
        { printRun: 'desc' }
      ]
    });

    console.log(`📊 Found ${sets.length} College Ticket sets:\n`);
    console.log('═'.repeat(120));
    console.log('SET NAME'.padEnd(50), 'TYPE'.padEnd(12), 'PARALLEL'.padEnd(10), 'PRINT RUN'.padEnd(12), 'CARDS');
    console.log('═'.repeat(120));

    for (const set of sets) {
      const name = set.name.length > 48 ? set.name.substring(0, 45) + '...' : set.name;
      const type = set.type;
      const isParallel = set.isParallel ? 'Yes' : 'No';
      const printRun = set.printRun ? `/${set.printRun}` : 'Unnumbered';
      const cardCount = set._count.cards;

      console.log(
        name.padEnd(50),
        type.padEnd(12),
        isParallel.padEnd(10),
        printRun.padEnd(12),
        cardCount.toString()
      );
    }

    console.log('═'.repeat(120));

    // Detailed analysis
    console.log('\n\n📋 DETAILED ANALYSIS:\n');

    // Check base set
    const baseSet = sets.find(s => s.name === 'College Ticket' && !s.isParallel);
    if (baseSet) {
      console.log(`✅ Base Set Found: "${baseSet.name}"`);
      console.log(`   - Type: ${baseSet.type} ${baseSet.type === 'Base' ? '❌ (should be Autograph)' : '✅'}`);
      console.log(`   - Cards: ${baseSet._count.cards} ${baseSet._count.cards === 74 ? '✅' : '❌ (should be 74)'}`);
      console.log(`   - Slug: ${baseSet.slug}\n`);
    }

    // Check Draft Ticket (should be /99)
    const draftTicket = sets.find(s => s.name.includes('Draft Ticket') && !s.name.includes('Variation'));
    if (draftTicket) {
      console.log(`✅ Draft Ticket Found: "${draftTicket.name}"`);
      console.log(`   - Type: ${draftTicket.type} ${draftTicket.type === 'Base' ? '❌ (should be Autograph)' : '✅'}`);
      console.log(`   - Print Run: ${draftTicket.printRun || 'Unnumbered'} ${draftTicket.printRun === 99 ? '✅' : '❌ (should be 99)'}`);
      console.log(`   - Cards: ${draftTicket._count.cards}`);
      console.log(`   - Slug: ${draftTicket.slug}\n`);
    }

    // Check Playoff Ticket (should be /15, currently /99)
    const playoffTicket = sets.find(s => s.name.includes('Playoff Ticket') && !s.name.includes('Variation'));
    if (playoffTicket) {
      console.log(`✅ Playoff Ticket Found: "${playoffTicket.name}"`);
      console.log(`   - Type: ${playoffTicket.type} ${playoffTicket.type === 'Base' ? '❌ (should be Autograph)' : '✅'}`);
      console.log(`   - Print Run: ${playoffTicket.printRun || 'Unnumbered'} ${playoffTicket.printRun === 15 ? '✅' : '❌ (should be 15, currently ' + playoffTicket.printRun + ')'}`);
      console.log(`   - Cards: ${playoffTicket._count.cards}`);
      console.log(`   - Slug: ${playoffTicket.slug} ${playoffTicket.slug.endsWith('-15') ? '✅' : '❌ (should end with -15)'}\n`);
    }

    // Check Playoff Ticket Variation
    const playoffTicketVar = sets.find(s => s.name.includes('Playoff Ticket') && s.name.includes('Variation'));
    if (playoffTicketVar) {
      console.log(`✅ Playoff Ticket Variation Found: "${playoffTicketVar.name}"`);
      console.log(`   - Type: ${playoffTicketVar.type} ${playoffTicketVar.type === 'Base' ? '❌ (should be Autograph)' : '✅'}`);
      console.log(`   - Print Run: ${playoffTicketVar.printRun || 'Unnumbered'} ${playoffTicketVar.printRun === 15 ? '✅' : '❌ (should be 15, currently ' + playoffTicketVar.printRun + ')'}`);
      console.log(`   - Cards: ${playoffTicketVar._count.cards}`);
      console.log(`   - Slug: ${playoffTicketVar.slug} ${playoffTicketVar.slug.endsWith('-15') ? '✅' : '❌ (should end with -15)'}\n`);
    }

    // Check all variation sets
    const variationSets = sets.filter(s => s.name.includes('Variation'));
    if (variationSets.length > 0) {
      console.log(`\n📌 Variation Sets (${variationSets.length}):`);
      for (const varSet of variationSets) {
        console.log(`   - ${varSet.name}`);
        console.log(`     Type: ${varSet.type} ${varSet.type === 'Base' ? '❌ (should be Autograph)' : '✅'}`);
        console.log(`     Print Run: ${varSet.printRun || 'Unnumbered'}`);
        console.log(`     Cards: ${varSet._count.cards}`);
      }
    }

    // Summary of issues
    console.log('\n\n🔍 ISSUES FOUND:\n');

    const wrongTypeCount = sets.filter(s => s.type === 'Base').length;
    if (wrongTypeCount > 0) {
      console.log(`❌ ${wrongTypeCount} sets have type "Base" (should be "Autograph")`);
    }

    if (playoffTicket && playoffTicket.printRun !== 15) {
      console.log(`❌ Playoff Ticket has print run ${playoffTicket.printRun} (should be 15)`);
    }

    if (playoffTicketVar && playoffTicketVar.printRun !== 15) {
      console.log(`❌ Playoff Ticket Variation has print run ${playoffTicketVar.printRun} (should be 15)`);
    }

    if (baseSet && baseSet._count.cards !== 74) {
      console.log(`❌ Base set has ${baseSet._count.cards} cards (should be 74)`);
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
