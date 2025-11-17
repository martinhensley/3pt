import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 2022-23 Donruss Soccer - Rated Rookies Merge Script\n');

  // Get the release
  const release = await prisma.release.findUnique({
    where: { slug: '2022-23-panini-donruss-soccer' },
    include: {
      sets: {
        orderBy: { name: 'asc' }
      }
    }
  });

  if (!release) {
    throw new Error('Release not found');
  }

  console.log(`📦 Release: ${release.name}\n`);

  // Find all Rated Rookies sets
  const ratedRookiesSets = release.sets.filter(s =>
    s.name.startsWith('Rated Rookies') && !s.name.includes('Optic')
  );

  const ratedRookiesOpticSets = release.sets.filter(s =>
    s.name.startsWith('Rated Rookies Optic')
  );

  console.log(`Found ${ratedRookiesSets.length} Rated Rookies sets (non-Optic)`);
  console.log(`Found ${ratedRookiesOpticSets.length} Rated Rookies Optic sets\n`);

  let setsMerged = 0;
  let setsDeleted = 0;
  let cardsMoved = 0;

  // Process non-Optic Rated Rookies sets
  console.log('1️⃣ Processing Rated Rookies sets...\n');

  for (const rrSet of ratedRookiesSets) {
    // Convert "Rated Rookies" to "Base Set" or "Rated Rookies {Parallel}" to "Base Set {Parallel}"
    let baseName: string;
    if (rrSet.name === 'Rated Rookies') {
      baseName = 'Base Set';
    } else {
      // e.g., "Rated Rookies Black" -> "Base Set Black"
      baseName = rrSet.name.replace('Rated Rookies', 'Base Set');
    }

    // Find matching Base set
    const baseSet = release.sets.find(s => s.name === baseName);

    if (!baseSet) {
      console.log(`⚠️  No matching Base set found for: ${rrSet.name} (looking for: ${baseName})`);
      continue;
    }

    // Move all cards from RR set to Base set
    const result = await prisma.card.updateMany({
      where: { setId: rrSet.id },
      data: { setId: baseSet.id }
    });

    cardsMoved += result.count;

    // Update Base set totalCards to 200
    await prisma.set.update({
      where: { id: baseSet.id },
      data: { totalCards: '200' }
    });

    console.log(`✅ Merged "${rrSet.name}" (${result.count} cards) into "${baseName}"`);

    // Delete the empty RR set
    await prisma.set.delete({
      where: { id: rrSet.id }
    });

    setsMerged++;
    setsDeleted++;
  }

  // Process Optic Rated Rookies sets
  console.log('\n2️⃣ Processing Rated Rookies Optic sets...\n');

  for (const rrSet of ratedRookiesOpticSets) {
    // Convert "Rated Rookies Optic" to "Base Optic" or "Rated Rookies Optic {Parallel}" to "Base Optic {Parallel}"
    let baseName: string;
    if (rrSet.name === 'Rated Rookies Optic') {
      baseName = 'Base Optic';
    } else {
      // e.g., "Rated Rookies Optic Black" -> "Base Optic Black"
      baseName = rrSet.name.replace('Rated Rookies Optic', 'Base Optic');
    }

    // Find matching Base Optic set
    const baseSet = release.sets.find(s => s.name === baseName);

    if (!baseSet) {
      console.log(`⚠️  No matching Base Optic set found for: ${rrSet.name} (looking for: ${baseName})`);
      continue;
    }

    // Move all cards from RR set to Base set
    const result = await prisma.card.updateMany({
      where: { setId: rrSet.id },
      data: { setId: baseSet.id }
    });

    cardsMoved += result.count;

    // Update Base set totalCards to 200
    await prisma.set.update({
      where: { id: baseSet.id },
      data: { totalCards: '200' }
    });

    console.log(`✅ Merged "${rrSet.name}" (${result.count} cards) into "${baseName}"`);

    // Delete the empty RR set
    await prisma.set.delete({
      where: { id: rrSet.id }
    });

    setsMerged++;
    setsDeleted++;
  }

  // Get final counts
  const finalSetCount = await prisma.set.count({
    where: { releaseId: release.id }
  });

  const finalCardCount = await prisma.card.count({
    where: {
      set: { releaseId: release.id }
    }
  });

  console.log('\n📊 Merge Summary:');
  console.log(`   Sets merged: ${setsMerged}`);
  console.log(`   Sets deleted: ${setsDeleted}`);
  console.log(`   Cards moved: ${cardsMoved}`);
  console.log(`   Final set count: ${finalSetCount}`);
  console.log(`   Final card count: ${finalCardCount}`);
  console.log('\n✅ Merge complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
