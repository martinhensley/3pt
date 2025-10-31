import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillNumberedField() {
  console.log('Backfilling numbered field from serialNumber and printRun...\n');

  // Get all cards with serial numbers or print runs
  const cards = await prisma.card.findMany({
    where: {
      OR: [
        { serialNumber: { not: null } },
        { printRun: { not: null } },
      ],
    },
  });

  console.log(`Found ${cards.length} cards with serial/print run data\n`);

  let updated = 0;

  for (const card of cards) {
    let numberedValue: string | null = null;

    // Determine the numbered display string
    if (card.printRun === 1) {
      numberedValue = '1 of 1';
    } else if (card.serialNumber) {
      numberedValue = card.serialNumber;
    } else if (card.printRun) {
      numberedValue = `/${card.printRun}`;
    }

    if (numberedValue) {
      await prisma.card.update({
        where: { id: card.id },
        data: { numbered: numberedValue },
      });

      updated++;

      if (updated <= 10 || updated % 100 === 0) {
        console.log(`✓ #${card.cardNumber} ${card.playerName} → ${numberedValue}`);
      }
    }
  }

  console.log(`\n✅ Updated ${updated} cards with numbered field`);

  await prisma.$disconnect();
}

backfillNumberedField()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
