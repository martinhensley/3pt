import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('Checking for Matt Turner #1 cards...\n');

  const cards = await prisma.card.findMany({
    where: {
      playerName: 'Matt Turner',
      cardNumber: '1',
    },
    include: {
      set: {
        include: {
          release: {
            include: {
              manufacturer: true
            }
          }
        }
      }
    },
    orderBy: [
      { set: { name: 'asc' } },
      { parallelType: 'asc' }
    ]
  });

  console.log(`Found ${cards.length} cards:\n`);

  cards.forEach((card, index) => {
    console.log(`${index + 1}. ID: ${card.id}`);
    console.log(`   Player: ${card.playerName}`);
    console.log(`   Card #: ${card.cardNumber}`);
    console.log(`   Set: ${card.set.name}`);
    console.log(`   Release: ${card.set.release.year} ${card.set.release.name}`);
    console.log(`   Parallel: ${card.parallelType || 'Base'}`);
    console.log(`   Variant: ${card.variant || 'N/A'}`);
    console.log(`   Slug: ${card.slug}`);
    console.log('');
  });

  // Check for duplicates (same set + same parallel/variant)
  console.log('\nChecking for true duplicates...\n');

  const groups = new Map<string, typeof cards>();
  cards.forEach(card => {
    const key = `${card.setId}-${card.parallelType || 'base'}-${card.variant || 'none'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(card);
  });

  groups.forEach((group, key) => {
    if (group.length > 1) {
      console.log(`DUPLICATE GROUP (${key}):`);
      group.forEach(card => {
        console.log(`  - ID: ${card.id}, Slug: ${card.slug}`);
      });
      console.log('');
    }
  });

  await prisma.$disconnect();
}

checkDuplicates().catch(console.error);
