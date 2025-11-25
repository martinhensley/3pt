import { PrismaClient, SetType } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to create slug from set name
function createSlug(setName: string, year: string, releaseName: string, printRun: number | null): string {
  const parts = ['2016', 'contenders', 'draft', 'picks'];

  // Normalize set name for slug
  const normalizedName = setName
    .toLowerCase()
    .replace('college ', '')
    .replace(' ticket', '-ticket')
    .replace(/ /g, '-')
    .replace('printing-plate-', 'ticket-printing-plate-');

  parts.push(normalizedName);

  // Add parallel suffix for parallels
  if (printRun !== null) {
    parts.push('parallel', printRun.toString());
  } else if (setName.includes('Blue Foil') || setName.includes('Red Foil')) {
    parts.push('parallel');
  }

  return parts.join('-');
}

// Define the expected 74 card numbers (missing 126, 145, 147, 155, 170, 174, 175, 177)
const expectedCardNumbers = [
  102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
  122, 123, 124, 125, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142,
  143, 144, 146, 148, 149, 150, 151, 152, 153, 154, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165,
  166, 167, 168, 169, 171, 172, 173, 176, 178, 179, 180, 181, 182, 183, 184
];

interface CardData {
  cardNumber: string;
  playerName: string;
  team: string;
}

interface SetConfig {
  name: string;
  isParallel: boolean;
  printRun: number | null;
  description: string;
}

async function main() {
  console.log('=== COLLEGE TICKET NON-VARIATION RESTORATION ===\n');

  // Find the release
  const release = await prisma.release.findFirst({
    where: {
      slug: '2016-panini-contenders-draft-picks-basketball'
    }
  });

  if (!release || !release.sourceFiles) {
    throw new Error('Release not found or has no source files');
  }

  console.log(`Found release: ${release.name}\n`);

  // Parse CSV data
  const sourceFiles = release.sourceFiles as any[];
  const csvFile = sourceFiles.find(f => f.type === 'csv');

  if (!csvFile) {
    throw new Error('CSV file not found in source files');
  }

  // The CSV has doubled quotes ("") for escaping, parse manually
  const lines = csvFile.content.split(/\r?\n/);
  const records: any[] = [];

  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;

    // Format: "Set Name,""Num"",""Player"",""Team"",""Seq"""
    // Remove leading/trailing quotes and split by ,"" pattern
    const cleaned = line.replace(/^"|"$/g, '');
    const parts = cleaned.split(/,\s*""/);

    if (parts.length >= 4) {
      // Remove trailing quotes from each part
      const setName = parts[0];
      const num = parts[1].replace(/"/g, '');
      const player = parts[2].replace(/"/g, '');
      const team = parts[3].replace(/"/g, '');
      const seq = parts.length > 4 ? parts[4].replace(/"/g, '') : '';

      records.push({
        'Card Set': setName,
        'Num': num,
        'Player': player,
        'Team': team,
        'Seq.': seq
      });
    }
  }

  console.log(`Parsed ${records.length} records from CSV\n`);

  // Extract non-variation College Ticket cards (card numbers 102-184)
  const collegeTicketCards: CardData[] = [];
  const seenNumbers = new Set<string>();

  for (const record of records) {
    const setName = (record as any)['Card Set'];
    const cardNumber = (record as any)['Num'];
    const playerName = (record as any)['Player'];
    const team = (record as any)['Team'];

    // Look for College Ticket sets without "Variation" in the name
    if (setName && setName.includes('College') && setName.includes('Ticket') && !setName.includes('Variation')) {
      const num = parseInt(cardNumber);

      // Only include cards 102-184 (non-variation range)
      if (num >= 102 && num <= 184 && !seenNumbers.has(cardNumber)) {
        collegeTicketCards.push({
          cardNumber,
          playerName,
          team
        });
        seenNumbers.add(cardNumber);
      }
    }
  }

  console.log(`Found ${collegeTicketCards.length} unique non-variation College Ticket cards`);
  console.log(`Expected card count: ${expectedCardNumbers.length}`);

  if (collegeTicketCards.length !== expectedCardNumbers.length) {
    console.warn(`WARNING: Card count mismatch! Found ${collegeTicketCards.length}, expected ${expectedCardNumbers.length}`);
  }

  // Sort cards by card number
  collegeTicketCards.sort((a, b) => parseInt(a.cardNumber) - parseInt(b.cardNumber));

  console.log(`Card number range: ${collegeTicketCards[0].cardNumber} - ${collegeTicketCards[collegeTicketCards.length - 1].cardNumber}\n`);

  // Define the sets to create/fix
  const setsToCreate: SetConfig[] = [
    {
      name: 'College Ticket',
      isParallel: false,
      printRun: null,
      description: 'Base College Ticket autograph set featuring 2016 NBA Draft prospects in their college uniforms'
    },
    {
      name: 'College Championship Ticket',
      isParallel: true,
      printRun: 1,
      description: 'Championship parallel of College Ticket autographs, limited to 1 of 1'
    },
    {
      name: 'College Cracked Ice Ticket',
      isParallel: true,
      printRun: 23,
      description: 'Cracked Ice parallel of College Ticket autographs, numbered to 23'
    },
    {
      name: 'College Draft Ticket',
      isParallel: true,
      printRun: 99,
      description: 'Draft parallel of College Ticket autographs, numbered to 99'
    },
    {
      name: 'College Playoff Ticket',
      isParallel: true,
      printRun: 15,
      description: 'Playoff parallel of College Ticket autographs, numbered to 15'
    },
    {
      name: 'College Ticket Printing Plate Black',
      isParallel: true,
      printRun: 1,
      description: 'Black printing plate of College Ticket autographs, 1 of 1'
    },
    {
      name: 'College Ticket Printing Plate Cyan',
      isParallel: true,
      printRun: 1,
      description: 'Cyan printing plate of College Ticket autographs, 1 of 1'
    },
    {
      name: 'College Ticket Printing Plate Magenta',
      isParallel: true,
      printRun: 1,
      description: 'Magenta printing plate of College Ticket autographs, 1 of 1'
    },
    {
      name: 'College Ticket Printing Plate Yellow',
      isParallel: true,
      printRun: 1,
      description: 'Yellow printing plate of College Ticket autographs, 1 of 1'
    }
  ];

  console.log('=== CREATING MISSING SETS ===\n');

  for (const setConfig of setsToCreate) {
    console.log(`Creating set: ${setConfig.name}`);

    const slug = createSlug(setConfig.name, '2016', 'contenders-draft-picks', setConfig.printRun);
    console.log(`  Slug: ${slug}`);

    // Check if set already exists
    const existingSet = await prisma.set.findUnique({
      where: { slug }
    });

    if (existingSet) {
      console.log(`  ⚠️  Set already exists, skipping creation`);
      continue;
    }

    // Create the set
    const newSet = await prisma.set.create({
      data: {
        name: setConfig.name,
        slug,
        type: SetType.Autograph,
        isParallel: setConfig.isParallel,
        printRun: setConfig.printRun,
        description: setConfig.description,
        expectedCardCount: expectedCardNumbers.length,
        baseSetSlug: setConfig.isParallel ? '2016-contenders-draft-picks-college-ticket' : null,
        releaseId: release.id
      }
    });

    console.log(`  ✓ Created set (ID: ${newSet.id})`);

    // Create cards for this set
    console.log(`  Creating ${collegeTicketCards.length} cards...`);

    const cardPromises = collegeTicketCards.map(cardData => {
      const cardNumber = parseInt(cardData.cardNumber);
      const numbered = setConfig.printRun ? `/${setConfig.printRun}` : null;

      // Generate slug for card
      const playerSlug = cardData.playerName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      const cardSlug = setConfig.printRun
        ? `2016-contenders-draft-picks-${cardNumber}-${playerSlug}-${setConfig.name.toLowerCase().replace(/\s+/g, '-')}-${setConfig.printRun === 1 ? '1-of-1' : setConfig.printRun}`
        : `2016-contenders-draft-picks-college-ticket-${cardNumber}-${playerSlug}`;

      return prisma.card.create({
        data: {
          slug: cardSlug,
          playerName: cardData.playerName,
          team: cardData.team,
          cardNumber: cardData.cardNumber,
          hasAutograph: true,
          isNumbered: setConfig.printRun !== null,
          printRun: setConfig.printRun,
          numbered,
          setId: newSet.id
        }
      });
    });

    await Promise.all(cardPromises);
    console.log(`  ✓ Created ${collegeTicketCards.length} cards\n`);
  }

  console.log('\n=== FIXING EXISTING SETS ===\n');

  // Fix Blue Foil and Red Foil sets (should have 74 cards, not 75)
  const setsToFix = [
    {
      name: 'College Draft Ticket Blue Foil',
      slug: '2016-contenders-draft-picks-college-draft-ticket-blue-foil-parallel'
    },
    {
      name: 'College Draft Ticket Red Foil',
      slug: '2016-contenders-draft-picks-college-draft-ticket-red-foil-parallel'
    }
  ];

  for (const setToFix of setsToFix) {
    console.log(`Fixing set: ${setToFix.name}`);

    const set = await prisma.set.findUnique({
      where: { slug: setToFix.slug },
      include: {
        cards: {
          orderBy: {
            cardNumber: 'asc'
          }
        }
      }
    });

    if (!set) {
      console.log(`  ⚠️  Set not found, skipping`);
      continue;
    }

    console.log(`  Current card count: ${set.cards.length}`);

    // Get all card numbers
    const cardNumbers = set.cards.map(c => parseInt(c.cardNumber || '0')).filter(n => n > 0);
    const uniqueNumbers = new Set(cardNumbers);

    console.log(`  Unique card numbers: ${uniqueNumbers.size}`);

    // Find cards that shouldn't be there (not in expectedCardNumbers)
    const invalidCards = set.cards.filter(card => {
      const num = parseInt(card.cardNumber || '0');
      return !expectedCardNumbers.includes(num);
    });

    if (invalidCards.length > 0) {
      console.log(`  Found ${invalidCards.length} invalid cards to remove:`);
      invalidCards.forEach(card => {
        console.log(`    - Card #${card.cardNumber}: ${card.playerName}`);
      });

      // Delete invalid cards
      for (const card of invalidCards) {
        await prisma.card.delete({
          where: { id: card.id }
        });
      }

      console.log(`  ✓ Removed ${invalidCards.length} invalid cards`);
    }

    // Update expectedCardCount
    await prisma.set.update({
      where: { id: set.id },
      data: {
        expectedCardCount: expectedCardNumbers.length
      }
    });

    console.log(`  ✓ Updated expectedCardCount to ${expectedCardNumbers.length}\n`);
  }

  console.log('\n=== VERIFICATION ===\n');

  // Verify all non-variation College Ticket sets
  const allSets = await prisma.set.findMany({
    where: {
      releaseId: release.id,
      name: {
        contains: 'College Ticket'
      },
      NOT: {
        name: {
          contains: 'Variation'
        }
      }
    },
    include: {
      _count: {
        select: { cards: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log(`Found ${allSets.length} non-variation College Ticket sets:\n`);

  let allCorrect = true;
  for (const set of allSets) {
    const status = set._count.cards === expectedCardNumbers.length ? '✓' : '✗';
    console.log(`${status} ${set.name}: ${set._count.cards} cards (expected ${expectedCardNumbers.length})`);

    if (set._count.cards !== expectedCardNumbers.length) {
      allCorrect = false;
    }
  }

  if (allCorrect) {
    console.log('\n✓ All non-variation College Ticket sets have the correct card count!');
  } else {
    console.log('\n✗ Some sets have incorrect card counts');
  }

  console.log('\n=== RESTORATION COMPLETE ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
