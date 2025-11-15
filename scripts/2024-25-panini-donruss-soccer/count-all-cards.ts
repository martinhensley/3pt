import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const release = await prisma.release.findFirst({
    where: { slug: '2024-25-panini-donruss-soccer' },
    include: {
      sets: {
        include: {
          cards: true,
          parentSet: {
            include: {
              cards: true
            }
          }
        }
      }
    },
  });

  if (!release) {
    console.error('Release not found!');
    return;
  }

  const parentSets = release.sets.filter(s => !s.parentSetId);
  const parallelSets = release.sets.filter(s => s.parentSetId);

  // Cards stored in database (on parent sets only)
  const storedCards = release.sets.reduce((sum, set) => sum + set.cards.length, 0);

  // Total cards across all sets (including parallels inheriting from parents)
  let totalCardsAcrossAllSets = 0;

  for (const set of release.sets) {
    if (set.parentSetId) {
      // Parallel set - count cards from parent
      const parent = release.sets.find(s => s.id === set.parentSetId);
      totalCardsAcrossAllSets += parent?.cards.length || 0;
    } else {
      // Parent set - count its own cards
      totalCardsAcrossAllSets += set.cards.length;
    }
  }

  console.log('🎴 DONRUSS SOCCER CARD COUNT ANALYSIS');
  console.log('='.repeat(80));

  console.log('\n📊 Database Storage:');
  console.log(`  Cards stored in database: ${storedCards}`);
  console.log(`  (Cards are stored only on parent sets)`);

  console.log('\n📈 Total Cards Across All Sets:');
  console.log(`  Total sets: ${release.sets.length} (${parentSets.length} parents + ${parallelSets.length} parallels)`);
  console.log(`  Total cards (counting all parallels): ${totalCardsAcrossAllSets.toLocaleString()}`);

  console.log('\n🔍 Breakdown by Parent Set:');

  for (const parent of parentSets.sort((a, b) => a.name.localeCompare(b.name))) {
    const parallels = release.sets.filter(s => s.parentSetId === parent.id);
    const cardCount = parent.cards.length;
    const parallelCount = parallels.length;
    const totalForThisSet = cardCount * (1 + parallelCount);

    console.log(`\n  ${parent.name} (${parent.type}):`);
    console.log(`    - Base cards: ${cardCount}`);
    console.log(`    - Parallels: ${parallelCount}`);
    console.log(`    - Total (base + all parallels): ${totalForThisSet.toLocaleString()}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`💳 GRAND TOTAL: ${totalCardsAcrossAllSets.toLocaleString()} cards`);
  console.log(`   (Across ${release.sets.length} sets: ${parentSets.length} base + ${parallelSets.length} parallels)`);
  console.log('='.repeat(80));
}

main().finally(() => prisma.$disconnect());
