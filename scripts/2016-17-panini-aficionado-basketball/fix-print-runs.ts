import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Correct print run mappings based on the checklist
const CORRECT_PRINT_RUNS: Record<string, number | null> = {
  'Artist\'s Proof Gold': 1,      // /1 (1 of 1)
  'Artist\'s Proof Red': 99,      // /99
  'Artist\'s Proof Bronze': 49,   // /49
  'Artist\'s Proof': null,        // Unnumbered
  'Prime': null,                  // Variable (15, 25) - will handle individually
  'Tip-off': null,                // Unnumbered
};

async function fixPrintRuns() {
  console.log('🔧 Fixing Print Runs for 2016-17 Panini Aficionado Basketball\n');

  const release = await prisma.release.findUnique({
    where: { slug: '2016-17-panini-aficionado-basketball' },
    include: { sets: true }
  });

  if (!release) {
    console.error('❌ Release not found');
    return;
  }

  console.log(`Found ${release.sets.length} sets\n`);

  let updatedCount = 0;

  for (const set of release.sets) {
    let newPrintRun: number | null | undefined = undefined;

    // Check each variant type
    for (const [variant, correctPrintRun] of Object.entries(CORRECT_PRINT_RUNS)) {
      if (set.name.endsWith(' ' + variant)) {
        if (set.printRun !== correctPrintRun) {
          newPrintRun = correctPrintRun;
          console.log(`Updating "${set.name}":`);
          console.log(`  Old: ${set.printRun === null ? 'null' : '/' + set.printRun}`);
          console.log(`  New: ${correctPrintRun === null ? 'null' : '/' + correctPrintRun}`);

          await prisma.set.update({
            where: { id: set.id },
            data: { printRun: correctPrintRun }
          });

          updatedCount++;
        }
        break;
      }
    }
  }

  console.log(`\n✅ Updated ${updatedCount} sets`);
}

fixPrintRuns()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
