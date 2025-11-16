import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRatedRookies() {
  try {
    console.log('🔧 FIXING ROAD TO QATAR RATED ROOKIES STRUCTURE\n');
    console.log('='.repeat(80));

    // Get the release
    const release = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        sets: {
          include: {
            cards: true
          }
        }
      }
    });

    if (!release) {
      console.log('❌ Release not found!');
      return;
    }

    console.log(`\n📦 Release: ${release.name}`);
    console.log(`Total sets before fix: ${release.sets.length}`);

    // Step 1: Identify all Base and Rated Rookies sets
    console.log('\n\n📋 STEP 1: Identifying sets to merge');
    console.log('-'.repeat(80));

    const baseSets = release.sets.filter(s =>
      s.name === 'Base' ||
      (s.name.startsWith('Base ') && !s.name.includes('Optic') && !s.name.includes('Rated Rookies'))
    );

    const ratedRookiesSets = release.sets.filter(s =>
      s.name === 'Rated Rookies' ||
      (s.name.startsWith('Rated Rookies ') && !s.name.includes('Optic'))
    );

    console.log(`\nFound ${baseSets.length} Base sets (should have 200 cards each):`);
    baseSets.forEach(s => {
      console.log(`  • ${s.name.padEnd(40)} ${s.cards.length.toString().padStart(3)} cards`);
    });

    console.log(`\nFound ${ratedRookiesSets.length} Rated Rookies sets (to be merged):`);
    ratedRookiesSets.forEach(s => {
      console.log(`  • ${s.name.padEnd(40)} ${s.cards.length.toString().padStart(3)} cards`);
    });

    // Step 2: Merge Rated Rookies into Base sets
    console.log('\n\n🔄 STEP 2: Merging Rated Rookies into Base sets');
    console.log('-'.repeat(80));

    let totalMerged = 0;
    let totalDeleted = 0;

    for (const rrSet of ratedRookiesSets) {
      // Find matching base set by removing "Rated Rookies" prefix
      const baseName = rrSet.name.replace('Rated Rookies ', 'Base ').replace('Rated Rookies', 'Base');
      const matchingBase = baseSets.find(b => b.name === baseName);

      if (!matchingBase) {
        console.log(`\n⚠️  No matching base set found for: ${rrSet.name}`);
        continue;
      }

      console.log(`\n📌 Merging "${rrSet.name}" → "${matchingBase.name}"`);
      console.log(`   Source: ${rrSet.cards.length} cards`);
      console.log(`   Target: ${matchingBase.cards.length} cards (before merge)`);

      // Move all cards from Rated Rookies set to Base set
      const updateResult = await prisma.card.updateMany({
        where: { setId: rrSet.id },
        data: { setId: matchingBase.id }
      });

      totalMerged += updateResult.count;
      console.log(`   ✅ Moved ${updateResult.count} cards`);

      // Update the base set's totalCards
      const newCardCount = matchingBase.cards.length + rrSet.cards.length;
      await prisma.set.update({
        where: { id: matchingBase.id },
        data: { totalCards: newCardCount.toString() }
      });

      console.log(`   ✅ Updated totalCards to ${newCardCount}`);

      // Delete the empty Rated Rookies set
      await prisma.set.delete({
        where: { id: rrSet.id }
      });

      totalDeleted++;
      console.log(`   ✅ Deleted empty set: ${rrSet.name}`);
    }

    // Step 3: Handle Optic sets (Base Optic + Rated Rookies Optic)
    console.log('\n\n🔵 STEP 3: Handling Optic sets');
    console.log('-'.repeat(80));

    const opticBase = release.sets.find(s => s.name === 'Optic');
    console.log(`\nCurrent Optic set: ${opticBase?.cards.length || 0} cards`);

    // Import the missing Rated Rookies Optic cards
    console.log('\n📥 Importing Rated Rookies Optic cards from spreadsheet...');

    const XLSX = require('xlsx');
    const workbook = XLSX.readFile('/Users/mh/Desktop/2021-22-Donruss-Soccer-Road-to-Qatar-checklist-Excel-spreadsheet-updated.xlsx');
    const sheet = workbook.Sheets['Sheet 1'];
    const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

    let rrOpticCards = 0;
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row[0]) continue;

      const cardSet = String(row[0]).trim();

      // Only process Rated Rookies Optic cards
      if (cardSet !== 'Rated Rookies Optic') continue;

      const cardNumber = row[1] ? String(row[1]).trim() : '';
      const player = row[2] ? String(row[2]).trim() : '';
      const team = row[3] ? String(row[3]).trim() : '';

      if (!opticBase) {
        console.log('❌ Optic base set not found!');
        break;
      }

      // Generate card slug
      const { generateCardSlug } = require('../lib/slugGenerator');
      const cardSlug = generateCardSlug(
        'Panini',
        'Donruss Road to Qatar Soccer',
        '2021-22',
        'Base Optic',
        cardNumber,
        player,
        null,
        undefined,
        'Base'
      );

      try {
        await prisma.card.create({
          data: {
            slug: cardSlug,
            playerName: player || null,
            team: team || null,
            cardNumber: cardNumber || null,
            variant: null,
            printRun: null,
            setId: opticBase.id,
          },
        });
        rrOpticCards++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`    ⚠️  Card already exists: ${cardSlug}`);
        } else {
          console.error(`    ❌ Error creating card ${cardSlug}:`, error.message);
        }
      }
    }

    if (opticBase && rrOpticCards > 0) {
      // Update Optic totalCards
      const newOpticCount = opticBase.cards.length + rrOpticCards;
      await prisma.set.update({
        where: { id: opticBase.id },
        data: { totalCards: newOpticCount.toString() }
      });
      console.log(`✅ Added ${rrOpticCards} Rated Rookies Optic cards`);
      console.log(`✅ Updated Optic totalCards to ${newOpticCount}`);
    }

    // Step 4: Handle Optic parallel sets
    console.log('\n\n🎨 STEP 4: Handling Optic parallel sets');
    console.log('-'.repeat(80));

    const opticParallels = release.sets.filter(s =>
      s.isParallel &&
      s.baseSetSlug === '2021-22-donruss-road-to-qatar-soccer-optic' &&
      !s.name.includes('Rated Rookies')
    );

    const rrOpticParallels = release.sets.filter(s =>
      s.name.startsWith('Rated Rookies Optic ') &&
      s.isParallel
    );

    console.log(`\nFound ${opticParallels.length} Optic parallels (should have 200 cards each)`);
    console.log(`Found ${rrOpticParallels.length} Rated Rookies Optic parallels (to be merged)`);

    let opticParallelsMerged = 0;
    let opticParallelsDeleted = 0;

    for (const rrParallel of rrOpticParallels) {
      // Extract the parallel variant (e.g., "Holo", "Blue Velocity", etc.)
      const variant = rrParallel.name.replace('Rated Rookies Optic ', '');

      // Find matching Optic parallel
      const matchingParallel = opticParallels.find(p => {
        // Check if the parallel has the same variant
        const baseOpticVariant = p.name.replace('Optic ', '');
        return baseOpticVariant === variant;
      });

      if (!matchingParallel) {
        console.log(`\n⚠️  No matching Optic parallel found for: ${rrParallel.name}`);
        continue;
      }

      console.log(`\n📌 Merging "${rrParallel.name}" → "${matchingParallel.name}"`);
      console.log(`   Source: ${rrParallel.cards.length} cards`);
      console.log(`   Target: ${matchingParallel.cards.length} cards (before merge)`);

      // Move all cards
      const updateResult = await prisma.card.updateMany({
        where: { setId: rrParallel.id },
        data: { setId: matchingParallel.id }
      });

      opticParallelsMerged += updateResult.count;
      console.log(`   ✅ Moved ${updateResult.count} cards`);

      // Update totalCards
      const newCardCount = matchingParallel.cards.length + rrParallel.cards.length;
      await prisma.set.update({
        where: { id: matchingParallel.id },
        data: { totalCards: newCardCount.toString() }
      });

      console.log(`   ✅ Updated totalCards to ${newCardCount}`);

      // Delete the empty set
      await prisma.set.delete({
        where: { id: rrParallel.id }
      });

      opticParallelsDeleted++;
      console.log(`   ✅ Deleted empty set: ${rrParallel.name}`);
    }

    // Step 5: Final verification
    console.log('\n\n✅ STEP 5: Final verification');
    console.log('-'.repeat(80));

    const updatedRelease = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        sets: {
          include: {
            cards: true
          }
        }
      }
    });

    if (!updatedRelease) {
      console.log('❌ Could not verify!');
      return;
    }

    const totalCards = updatedRelease.sets.reduce((sum, set) => sum + set.cards.length, 0);

    console.log(`\nTotal sets after fix: ${updatedRelease.sets.length}`);
    console.log(`Total cards: ${totalCards}`);

    // Check Base sets now have 200 cards
    console.log(`\n📊 Base sets verification:`);
    const updatedBaseSets = updatedRelease.sets.filter(s =>
      s.name === 'Base' ||
      (s.name.startsWith('Base ') && !s.name.includes('Optic'))
    );

    updatedBaseSets.forEach(s => {
      const status = s.cards.length === 200 ? '✅' : '⚠️';
      console.log(`  ${status} ${s.name.padEnd(40)} ${s.cards.length.toString().padStart(3)} cards`);
    });

    // Check Optic sets now have 200 cards
    console.log(`\n🔵 Optic sets verification:`);
    const updatedOpticSets = updatedRelease.sets.filter(s =>
      s.name === 'Optic' ||
      (s.name.startsWith('Optic ') && !s.name.includes('Rated Rookies'))
    );

    updatedOpticSets.forEach(s => {
      const status = s.cards.length === 200 ? '✅' : '⚠️';
      console.log(`  ${status} ${s.name.padEnd(40)} ${s.cards.length.toString().padStart(3)} cards`);
    });

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 FIX SUMMARY');
    console.log('='.repeat(80));
    console.log(`Base sets merged: ${totalMerged} cards from ${totalDeleted} sets`);
    console.log(`Optic cards added: ${rrOpticCards} cards`);
    console.log(`Optic parallels merged: ${opticParallelsMerged} cards from ${opticParallelsDeleted} sets`);
    console.log(`Total sets removed: ${totalDeleted + opticParallelsDeleted}`);
    console.log(`Final set count: ${updatedRelease.sets.length}`);
    console.log(`Final card count: ${totalCards}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRatedRookies()
  .catch(console.error);
