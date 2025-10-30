import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDualJerseyBaseCards() {
  console.log('Finding Dual Jersey Ink set...\n');

  const set = await prisma.set.findFirst({
    where: {
      name: 'Dual Jersey Ink',
      release: {
        slug: '2024-25-panini-obsidian-soccer'
      }
    }
  });

  if (!set) {
    console.error('Dual Jersey Ink set not found!');
    return;
  }

  console.log(`Found: ${set.name} (ID: ${set.id})\n`);

  // Find all cards with parallelType "Base" for this set
  const baseCards = await prisma.card.findMany({
    where: {
      setId: set.id,
      parallelType: 'Base'
    }
  });

  console.log(`Found ${baseCards.length} cards with parallelType "Base"\n`);

  let updated = 0;

  for (const card of baseCards) {
    console.log(`Updating card #${card.cardNumber} - ${card.playerName}`);
    console.log(`  Current: parallelType="${card.parallelType}", serial=${card.serialNumber}, printRun=${card.printRun}`);

    await prisma.card.update({
      where: { id: card.id },
      data: {
        parallelType: null  // Change to null for base cards
      }
    });

    console.log(`  Updated: parallelType=null`);
    updated++;
  }

  console.log(`\n✅ Updated ${updated} base cards`);

  await prisma.$disconnect();
}

fixDualJerseyBaseCards()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
