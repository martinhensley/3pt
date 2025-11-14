import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const release = await prisma.release.findFirst({
    where: { slug: '2024-25-panini-donruss-soccer' },
    include: {
      sets: {
        include: {
          cards: {
            orderBy: { cardNumber: 'asc' }
          }
        }
      }
    },
  });

  const base = release?.sets.find(s => s.name === 'Base');
  const optic = release?.sets.find(s => s.name === 'Optic');
  const ratedRookies = release?.sets.find(s => s.name === 'Rated Rookies');
  const ratedRookiesOptic = release?.sets.find(s => s.name === 'Rated Rookies Optic');

  console.log('Current state:');
  console.log(`\nBase: ${base?.cards.length} cards`);
  if (base && base.cards.length > 0) {
    const lastIdx = base.cards.length - 1;
    console.log(`  Range: ${base.cards[0]?.cardNumber} - ${base.cards[lastIdx]?.cardNumber}`);
  }

  console.log(`\nOptic: ${optic?.cards.length} cards`);
  if (optic && optic.cards.length > 0) {
    const lastIdx = optic.cards.length - 1;
    console.log(`  Range: ${optic.cards[0]?.cardNumber} - ${optic.cards[lastIdx]?.cardNumber}`);
  }

  console.log(`\nRated Rookies: ${ratedRookies?.cards.length} cards`);
  if (ratedRookies && ratedRookies.cards.length > 0) {
    const lastIdx = ratedRookies.cards.length - 1;
    console.log(`  Range: ${ratedRookies.cards[0]?.cardNumber} - ${ratedRookies.cards[lastIdx]?.cardNumber}`);
  }

  console.log(`\nRated Rookies Optic: ${ratedRookiesOptic?.cards.length} cards`);
  if (ratedRookiesOptic && ratedRookiesOptic.cards.length > 0) {
    const lastIdx = ratedRookiesOptic.cards.length - 1;
    console.log(`  Range: ${ratedRookiesOptic.cards[0]?.cardNumber} - ${ratedRookiesOptic.cards[lastIdx]?.cardNumber}`);
  }

  console.log('\n\nISSUE IDENTIFIED:');
  console.log('===============================================================================');
  console.log('The Excel file treats "Rated Rookies" as separate sets,');
  console.log('but they should be cards 176-200 of Base and Optic sets.');
  console.log('\nCurrently:');
  console.log(`  - Base has ${base?.cards.length} cards (should be 200)`);
  console.log(`  - Optic has ${optic?.cards.length} cards (should be 200)`);
  console.log(`  - Rated Rookies is a separate set with ${ratedRookies?.cards.length} cards (should be merged into Base)`);
  console.log(`  - Rated Rookies Optic is a separate set with ${ratedRookiesOptic?.cards.length} cards (should be merged into Optic)`);
  console.log('\nRequired fix:');
  console.log('  1. Merge Rated Rookies cards (#176-200) into Base set');
  console.log('  2. Merge Rated Rookies Optic cards (#176-200) into Optic set');
  console.log('  3. Delete Rated Rookies and Rated Rookies Optic parent sets');
  console.log('  4. Reassign Rated Rookies parallels to Base as parent');
  console.log('  5. Reassign Rated Rookies Optic parallels to Optic as parent');
  console.log('===============================================================================');
}

main().finally(() => prisma.$disconnect());
