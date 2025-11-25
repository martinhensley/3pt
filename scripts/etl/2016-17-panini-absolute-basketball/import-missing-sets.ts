import { PrismaClient } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';

const prisma = new PrismaClient();

type SetType = 'Insert' | 'Autograph' | 'Memorabilia';

interface CardData {
  cardNumber: string;
  playerName: string;
  team: string;
  printRun?: number;
}

interface SetData {
  setName: string;
  setType: SetType;
  printRun: number | null;
  isParallel: boolean;
  baseSetName: string | null;
  cards: CardData[];
}

// Insert sets data
const insertSets: SetData[] = [
  {
    setName: 'Glass',
    setType: 'Insert',
    printRun: null,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Ben Simmons', team: 'Philadelphia 76ers' },
      { cardNumber: '2', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers' },
      { cardNumber: '3', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves' },
      { cardNumber: '4', playerName: 'Jaylen Brown', team: 'Boston Celtics' },
      { cardNumber: '5', playerName: 'Buddy Hield', team: 'New Orleans Pelicans' },
      { cardNumber: '6', playerName: 'Jamal Murray', team: 'Denver Nuggets' },
      { cardNumber: '7', playerName: 'Anthony Davis', team: 'New Orleans Pelicans' },
      { cardNumber: '8', playerName: 'Kyrie Irving', team: 'Cleveland Cavaliers' },
      { cardNumber: '9', playerName: 'Kevin Durant', team: 'Golden State Warriors' },
      { cardNumber: '10', playerName: 'Chris Paul', team: 'Los Angeles Clippers' },
      { cardNumber: '11', playerName: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves' },
      { cardNumber: '12', playerName: 'Russell Westbrook', team: 'Oklahoma City Thunder' },
      { cardNumber: '13', playerName: 'Andrew Wiggins', team: 'Minnesota Timberwolves' },
      { cardNumber: '14', playerName: 'Stephen Curry', team: 'Golden State Warriors' },
      { cardNumber: '15', playerName: 'LeBron James', team: 'Cleveland Cavaliers' },
      { cardNumber: '16', playerName: 'Kawhi Leonard', team: 'San Antonio Spurs' },
      { cardNumber: '17', playerName: 'Dirk Nowitzki', team: 'Dallas Mavericks' },
      { cardNumber: '18', playerName: 'Jimmy Butler', team: 'Chicago Bulls' },
      { cardNumber: '19', playerName: 'James Harden', team: 'Houston Rockets' },
      { cardNumber: '20', playerName: 'Karl Malone', team: 'Utah Jazz' },
      { cardNumber: '21', playerName: 'Kobe Bryant', team: 'Los Angeles Lakers' },
      { cardNumber: '22', playerName: 'Steve Nash', team: 'Phoenix Suns' },
      { cardNumber: '23', playerName: 'Patrick Ewing', team: 'New York Knicks' },
      { cardNumber: '24', playerName: 'Scottie Pippen', team: 'Chicago Bulls' },
      { cardNumber: '25', playerName: 'Allen Iverson', team: 'Philadelphia 76ers' },
    ]
  },
];

// Note: Due to the large size, memorabilia sets will be imported via a separate data file
// This script will be extended in the next iteration

async function importMissingSets() {
  try {
    console.log('Starting 2016-17 Panini Absolute Basketball - Missing Sets import...\n');

    // Find the release
    const releaseSlug = '2016-17-panini-absolute-basketball';
    const release = await prisma.release.findUnique({
      where: { slug: releaseSlug },
      include: { manufacturer: true }
    });

    if (!release) {
      throw new Error(`Release not found: ${releaseSlug}`);
    }

    console.log(`Found release: ${release.name} (${release.id})\n`);

    // Import Insert sets
    console.log('=== IMPORTING INSERT SETS ===\n');
    await importSets(insertSets, release);

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function importSets(sets: SetData[], release: any) {
  let setCount = 0;
  let cardCount = 0;

  for (const setData of sets) {
    console.log(`Processing: ${setData.setName} (${setData.cards.length} cards)`);
    console.log(`  Type: ${setData.setType}`);
    console.log(`  Is Parallel: ${setData.isParallel}`);
    console.log(`  Print Run: ${setData.printRun || 'Unlimited'}`);

    // Generate slug
    let slug: string;
    if (setData.isParallel && setData.baseSetName) {
      const variantName = setData.setName.replace(setData.baseSetName, '').trim();
      const parallelSlug = variantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const baseSlug = generateSetSlug('2016-17', 'Absolute Basketball', setData.baseSetName, setData.setType);
      slug = setData.printRun
        ? `${baseSlug}-${parallelSlug}-parallel-${setData.printRun}`
        : `${baseSlug}-${parallelSlug}-parallel`;
    } else {
      slug = generateSetSlug('2016-17', 'Absolute Basketball', setData.setName, setData.setType);
    }

    let baseSetSlug: string | null = null;
    if (setData.isParallel && setData.baseSetName) {
      baseSetSlug = generateSetSlug('2016-17', 'Absolute Basketball', setData.baseSetName, setData.setType);
    }

    console.log(`  Slug: ${slug}`);

    // Check if set exists
    const existingSet = await prisma.set.findUnique({ where: { slug } });

    if (existingSet) {
      console.log(`  ⚠️  Set already exists, skipping...\n`);
      continue;
    }

    // Create set
    const dbSet = await prisma.set.create({
      data: {
        name: setData.setName,
        slug,
        type: setData.setType,
        releaseId: release.id,
        expectedCardCount: setData.cards.length,
        printRun: setData.printRun,
        isParallel: setData.isParallel,
        baseSetSlug,
      },
    });
    setCount++;
    console.log(`  ✅ Created set: ${dbSet.id}`);

    // Create cards
    let createdCards = 0;
    for (const card of setData.cards) {
      const cardPrintRun = card.printRun ?? setData.printRun;
      const variantName = setData.isParallel && setData.baseSetName
        ? setData.setName.replace(setData.baseSetName, '').trim()
        : null;

      const cardSlug = generateCardSlug(
        release.manufacturer.name,
        release.name,
        release.year || '2016-17',
        setData.baseSetName || setData.setName,
        card.cardNumber,
        card.playerName,
        variantName,
        cardPrintRun || undefined,
        setData.setType
      );

      try {
        await prisma.card.create({
          data: {
            slug: cardSlug,
            playerName: card.playerName,
            team: card.team,
            cardNumber: card.cardNumber,
            variant: variantName,
            printRun: cardPrintRun,
            isNumbered: cardPrintRun !== null,
            numbered: cardPrintRun ? (cardPrintRun === 1 ? '1 of 1' : `/${cardPrintRun}`) : null,
            rarity: cardPrintRun === 1 ? 'one_of_one' :
                    cardPrintRun && cardPrintRun <= 10 ? 'ultra_rare' :
                    cardPrintRun && cardPrintRun <= 50 ? 'super_rare' :
                    cardPrintRun && cardPrintRun <= 199 ? 'rare' : 'base',
            hasAutograph: setData.setType === 'Autograph',
            hasMemorabilia: setData.setType === 'Memorabilia',
            setId: dbSet.id,
          },
        });
        createdCards++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`    ⚠️  Card slug already exists: ${cardSlug}`);
        } else {
          throw error;
        }
      }
    }

    cardCount += createdCards;
    console.log(`  ✅ Created ${createdCards}/${setData.cards.length} cards\n`);
  }

  console.log('='.repeat(60));
  console.log(`Successfully imported ${setCount} sets and ${cardCount} cards`);
  console.log('='.repeat(60));
}

importMissingSets();
