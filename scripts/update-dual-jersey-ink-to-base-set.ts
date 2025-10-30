import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateDualJerseyInkToBaseSet() {
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

  console.log(`Found: ${set.name} (ID: ${set.id}, isBaseSet: ${set.isBaseSet})\n`);

  if (set.isBaseSet) {
    console.log('Already a base set, no update needed.');
    return;
  }

  const updated = await prisma.set.update({
    where: {
      id: set.id
    },
    data: {
      isBaseSet: true
    }
  });

  console.log(`✓ Updated "${updated.name}" to isBaseSet: ${updated.isBaseSet}`);

  await prisma.$disconnect();
}

updateDualJerseyInkToBaseSet()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
