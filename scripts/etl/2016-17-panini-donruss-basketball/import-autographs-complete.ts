import { PrismaClient } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';

const prisma = new PrismaClient();

interface CardData {
  number: string;
  player: string;
  team: string;
  printRun: number | null;
}

interface SetData {
  name: string;
  cards: CardData[];
  isParallel?: boolean;
  baseSetName?: string;
  hasMemorabilia?: boolean;  // For sets that have both auto + mem
}

// Helper function to calculate rarity based on print run
function calculateRarity(printRun: number | null): string | null {
  if (!printRun) return null;
  if (printRun === 1) return 'one_of_one';
  if (printRun <= 10) return 'ultra_rare';
  if (printRun <= 50) return 'super_rare';
  if (printRun <= 199) return 'rare';
  return 'base';
}

// Helper function to format numbered display
function formatNumbered(printRun: number | null): string | null {
  if (!printRun) return null;
  if (printRun === 1) return '1 of 1';
  return `/${printRun}`;
}

const autographSets: SetData[] = [
  // ==========================================
  // DOMINATOR SIGNATURES
  // ==========================================
  {
    name: 'Dominator Signatures',
    cards: [
      { number: '1', player: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 49 },
      { number: '2', player: 'Kristaps Porzingis', team: 'New York Knicks', printRun: 49 },
      { number: '3', player: 'Devin Booker', team: 'Phoenix Suns', printRun: 25 },
      { number: '4', player: 'Justise Winslow', team: 'Miami Heat', printRun: 49 },
      { number: '5', player: 'Nikola Jokic', team: 'Denver Nuggets', printRun: 25 },
      { number: '6', player: 'Jabari Parker', team: 'Milwaukee Bucks', printRun: 49 },
      { number: '7', player: 'Victor Oladipo', team: 'Oklahoma City Thunder', printRun: 25 },
      { number: '8', player: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 49 },
      { number: '9', player: 'Kevin Durant', team: 'Golden State Warriors', printRun: 49 },
      { number: '10', player: 'Kyrie Irving', team: 'Cleveland Cavaliers', printRun: 49 },
      { number: '11', player: 'John Wall', team: 'Washington Wizards', printRun: 49 },
      { number: '12', player: 'Bobby Portis', team: 'Chicago Bulls', printRun: 49 },
      { number: '13', player: 'Dwyane Wade', team: 'Chicago Bulls', printRun: 49 },
      { number: '14', player: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: 49 },
      { number: '15', player: 'Eric Bledsoe', team: 'Phoenix Suns', printRun: 25 },
      { number: '16', player: 'Carmelo Anthony', team: 'New York Knicks', printRun: 25 },
      { number: '17', player: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', printRun: 25 },
      { number: '18', player: 'Isaiah Thomas', team: 'Boston Celtics', printRun: 49 },
      { number: '19', player: 'Kyle Lowry', team: 'Toronto Raptors', printRun: 25 },
      { number: '20', player: 'Klay Thompson', team: 'Golden State Warriors', printRun: 25 },
      { number: '21', player: 'Draymond Green', team: 'Golden State Warriors', printRun: 25 },
      { number: '22', player: 'Mike Conley', team: 'Memphis Grizzlies', printRun: 25 },
      { number: '23', player: 'Marcus Smart', team: 'Boston Celtics', printRun: 25 },
      { number: '24', player: 'Chris Paul', team: 'Los Angeles Clippers', printRun: 49 },
      { number: '25', player: 'Blake Griffin', team: 'Los Angeles Clippers', printRun: 49 },
      { number: '26', player: 'Goran Dragic', team: 'Miami Heat', printRun: 25 },
      { number: '27', player: 'Allen Iverson', team: 'Philadelphia 76ers', printRun: 49 },
      { number: '28', player: 'Latrell Sprewell', team: 'Minnesota Timberwolves', printRun: 25 },
      { number: '29', player: 'James Worthy', team: 'Los Angeles Lakers', printRun: 25 },
      { number: '30', player: 'Nick Van Exel', team: 'Dallas Mavericks', printRun: 25 },
      { number: '31', player: 'George Gervin', team: 'San Antonio Spurs', printRun: 25 },
      { number: '32', player: 'Steve Francis', team: 'Houston Rockets', printRun: 25 },
      { number: '33', player: 'Jalen Rose', team: 'Chicago Bulls', printRun: 25 },
      { number: '34', player: 'John Starks', team: 'New York Knicks', printRun: 25 },
      { number: '35', player: 'Bill Russell', team: 'Boston Celtics', printRun: 49 },
      { number: '36', player: 'Ray Allen', team: 'Milwaukee Bucks', printRun: 49 },
      { number: '37', player: 'John Stockton', team: 'Utah Jazz', printRun: 49 },
      { number: '38', player: 'Julius Erving', team: 'Philadelphia 76ers', printRun: 49 },
      { number: '39', player: 'Jason Kidd', team: 'New Jersey Nets', printRun: 25 },
      { number: '40', player: 'Anfernee Hardaway', team: 'Orlando Magic', printRun: 25 },
    ]
  },
  {
    name: 'Dominator Signatures Black',
    isParallel: true,
    baseSetName: 'Dominator Signatures',
    cards: [
      { number: '1', player: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 1 },
      { number: '2', player: 'Kristaps Porzingis', team: 'New York Knicks', printRun: 1 },
      { number: '3', player: 'Devin Booker', team: 'Phoenix Suns', printRun: 1 },
      { number: '4', player: 'Justise Winslow', team: 'Miami Heat', printRun: 1 },
      { number: '5', player: 'Nikola Jokic', team: 'Denver Nuggets', printRun: 1 },
      { number: '6', player: 'Jabari Parker', team: 'Milwaukee Bucks', printRun: 1 },
      { number: '7', player: 'Victor Oladipo', team: 'Oklahoma City Thunder', printRun: 1 },
      { number: '8', player: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 1 },
      { number: '9', player: 'Kevin Durant', team: 'Golden State Warriors', printRun: 1 },
      { number: '10', player: 'Kyrie Irving', team: 'Cleveland Cavaliers', printRun: 1 },
      { number: '11', player: 'John Wall', team: 'Washington Wizards', printRun: 1 },
      { number: '12', player: 'Bobby Portis', team: 'Chicago Bulls', printRun: 1 },
      { number: '13', player: 'Dwyane Wade', team: 'Chicago Bulls', printRun: 1 },
      { number: '14', player: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: 1 },
      { number: '15', player: 'Eric Bledsoe', team: 'Phoenix Suns', printRun: 1 },
      { number: '16', player: 'Carmelo Anthony', team: 'New York Knicks', printRun: 1 },
      { number: '17', player: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', printRun: 1 },
      { number: '18', player: 'Isaiah Thomas', team: 'Boston Celtics', printRun: 1 },
      { number: '19', player: 'Kyle Lowry', team: 'Toronto Raptors', printRun: 1 },
      { number: '20', player: 'Klay Thompson', team: 'Golden State Warriors', printRun: 1 },
      { number: '21', player: 'Draymond Green', team: 'Golden State Warriors', printRun: 1 },
      { number: '22', player: 'Mike Conley', team: 'Memphis Grizzlies', printRun: 1 },
      { number: '23', player: 'Marcus Smart', team: 'Boston Celtics', printRun: 1 },
      { number: '24', player: 'Chris Paul', team: 'Los Angeles Clippers', printRun: 1 },
      { number: '25', player: 'Blake Griffin', team: 'Los Angeles Clippers', printRun: 1 },
      { number: '26', player: 'Goran Dragic', team: 'Miami Heat', printRun: 1 },
      { number: '27', player: 'Allen Iverson', team: 'Philadelphia 76ers', printRun: 1 },
      { number: '28', player: 'Latrell Sprewell', team: 'Minnesota Timberwolves', printRun: 1 },
      { number: '29', player: 'James Worthy', team: 'Los Angeles Lakers', printRun: 1 },
      { number: '30', player: 'Nick Van Exel', team: 'Dallas Mavericks', printRun: 1 },
      { number: '31', player: 'George Gervin', team: 'San Antonio Spurs', printRun: 1 },
      { number: '32', player: 'Steve Francis', team: 'Houston Rockets', printRun: 1 },
      { number: '33', player: 'Jalen Rose', team: 'Chicago Bulls', printRun: 1 },
      { number: '34', player: 'John Starks', team: 'New York Knicks', printRun: 1 },
      { number: '35', player: 'Bill Russell', team: 'Boston Celtics', printRun: 1 },
      { number: '36', player: 'Ray Allen', team: 'Milwaukee Bucks', printRun: 1 },
      { number: '37', player: 'John Stockton', team: 'Utah Jazz', printRun: 1 },
      { number: '38', player: 'Julius Erving', team: 'Philadelphia 76ers', printRun: 1 },
      { number: '39', player: 'Jason Kidd', team: 'New Jersey Nets', printRun: 1 },
      { number: '40', player: 'Anfernee Hardaway', team: 'Orlando Magic', printRun: 1 },
    ]
  },
  {
    name: 'Dominator Signatures Gold',
    isParallel: true,
    baseSetName: 'Dominator Signatures',
    cards: [
      { number: '1', player: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '2', player: 'Kristaps Porzingis', team: 'New York Knicks', printRun: 10 },
      { number: '3', player: 'Devin Booker', team: 'Phoenix Suns', printRun: 10 },
      { number: '4', player: 'Justise Winslow', team: 'Miami Heat', printRun: 10 },
      { number: '5', player: 'Nikola Jokic', team: 'Denver Nuggets', printRun: 10 },
      { number: '6', player: 'Jabari Parker', team: 'Milwaukee Bucks', printRun: 10 },
      { number: '7', player: 'Victor Oladipo', team: 'Oklahoma City Thunder', printRun: 10 },
      { number: '8', player: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '9', player: 'Kevin Durant', team: 'Golden State Warriors', printRun: 10 },
      { number: '10', player: 'Kyrie Irving', team: 'Cleveland Cavaliers', printRun: 10 },
      { number: '11', player: 'John Wall', team: 'Washington Wizards', printRun: 10 },
      { number: '12', player: 'Bobby Portis', team: 'Chicago Bulls', printRun: 10 },
      { number: '13', player: 'Dwyane Wade', team: 'Chicago Bulls', printRun: 10 },
      { number: '14', player: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: 10 },
      { number: '15', player: 'Eric Bledsoe', team: 'Phoenix Suns', printRun: 10 },
      { number: '16', player: 'Carmelo Anthony', team: 'New York Knicks', printRun: 10 },
      { number: '17', player: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', printRun: 10 },
      { number: '18', player: 'Isaiah Thomas', team: 'Boston Celtics', printRun: 10 },
      { number: '19', player: 'Kyle Lowry', team: 'Toronto Raptors', printRun: 10 },
      { number: '20', player: 'Klay Thompson', team: 'Golden State Warriors', printRun: 10 },
      { number: '21', player: 'Draymond Green', team: 'Golden State Warriors', printRun: 10 },
      { number: '22', player: 'Mike Conley', team: 'Memphis Grizzlies', printRun: 10 },
      { number: '23', player: 'Marcus Smart', team: 'Boston Celtics', printRun: 10 },
      { number: '24', player: 'Chris Paul', team: 'Los Angeles Clippers', printRun: 10 },
      { number: '25', player: 'Blake Griffin', team: 'Los Angeles Clippers', printRun: 10 },
      { number: '26', player: 'Goran Dragic', team: 'Miami Heat', printRun: 10 },
      { number: '27', player: 'Allen Iverson', team: 'Philadelphia 76ers', printRun: 10 },
      { number: '28', player: 'Latrell Sprewell', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '29', player: 'James Worthy', team: 'Los Angeles Lakers', printRun: 10 },
      { number: '30', player: 'Nick Van Exel', team: 'Dallas Mavericks', printRun: 10 },
      { number: '31', player: 'George Gervin', team: 'San Antonio Spurs', printRun: 10 },
      { number: '32', player: 'Steve Francis', team: 'Houston Rockets', printRun: 10 },
      { number: '33', player: 'Jalen Rose', team: 'Chicago Bulls', printRun: 10 },
      { number: '34', player: 'John Starks', team: 'New York Knicks', printRun: 10 },
      { number: '35', player: 'Bill Russell', team: 'Boston Celtics', printRun: 10 },
      { number: '36', player: 'Ray Allen', team: 'Milwaukee Bucks', printRun: 10 },
      { number: '37', player: 'John Stockton', team: 'Utah Jazz', printRun: 10 },
      { number: '38', player: 'Julius Erving', team: 'Philadelphia 76ers', printRun: 10 },
      { number: '39', player: 'Jason Kidd', team: 'New Jersey Nets', printRun: 10 },
      { number: '40', player: 'Anfernee Hardaway', team: 'Orlando Magic', printRun: 10 },
    ]
  },
];

async function main() {
  console.log('Starting import of 2016-17 Donruss Basketball Autograph Cards...\n');
  console.log('NOTE: This is Part 1 - Dominator Signatures sets only');
  console.log('      Additional sets will be added in subsequent imports.\n');

  // Find the release
  const release = await prisma.release.findUnique({
    where: { slug: '2016-17-panini-donruss-basketball' }
  });

  if (!release) {
    throw new Error('Release not found: 2016-17-panini-donruss-basketball');
  }

  console.log(`Found release: ${release.name}\n`);

  let totalSetsCreated = 0;
  let totalCardsCreated = 0;
  const setSlugMap = new Map<string, string>(); // Map set name to slug for parallel references

  // Process each set
  for (const setData of autographSets) {
    console.log(`Processing set: ${setData.name} (${setData.cards.length} cards)...`);

    // Generate slug for the set
    const setSlug = generateSetSlug(
      '2016-17',
      'Donruss Basketball',
      setData.name,
      'Autograph',
      setData.isParallel ? 'parallel' : undefined
    );

    // Store slug for parallel reference
    setSlugMap.set(setData.name, setSlug);

    // Get base set slug if this is a parallel
    let baseSetSlug: string | null = null;
    if (setData.isParallel && setData.baseSetName) {
      baseSetSlug = setSlugMap.get(setData.baseSetName) || null;
    }

    // Check if set already exists
    const existingSet = await prisma.set.findUnique({
      where: { slug: setSlug }
    });

    if (existingSet) {
      console.log(`  ⚠️  Set already exists: ${setSlug}`);
      console.log(`     Skipping...\n`);
      continue;
    }

    // Create the set
    const set = await prisma.set.create({
      data: {
        slug: setSlug,
        name: setData.name,
        type: 'Autograph',
        releaseId: release.id,
        isParallel: setData.isParallel || false,
        baseSetSlug: baseSetSlug,
      }
    });

    totalSetsCreated++;
    console.log(`  ✓ Created set: ${set.name}`);

    // Create cards for this set
    let cardsCreated = 0;
    for (const cardData of setData.cards) {
      // Determine variant based on set name
      let variant: string | null = null;
      if (setData.name.includes('Black')) {
        variant = 'Black';
      } else if (setData.name.includes('Gold')) {
        variant = 'Gold';
      } else if (setData.name.includes('Green')) {
        variant = 'Green';
      }

      const cardSlug = generateCardSlug(
        'Panini',               // manufacturer
        'Donruss Basketball',   // releaseName
        '2016-17',             // year
        setData.name,          // setName
        cardData.number,       // cardNumber
        cardData.player,       // playerName
        variant,               // variant
        cardData.printRun,     // printRun
        'Autograph'            // setType
      );

      const rarity = calculateRarity(cardData.printRun);
      const numbered = formatNumbered(cardData.printRun);

      await prisma.card.create({
        data: {
          slug: cardSlug,
          playerName: cardData.player,
          team: cardData.team,
          cardNumber: cardData.number,
          setId: set.id,
          variant: variant,
          printRun: cardData.printRun,
          isNumbered: cardData.printRun !== null,
          numbered: numbered,
          rarity: rarity,
          hasAutograph: true,
          hasMemorabilia: setData.hasMemorabilia || false,
        }
      });

      cardsCreated++;
    }

    totalCardsCreated += cardsCreated;
    console.log(`  ✓ Created ${cardsCreated} cards\n`);
  }

  console.log('═══════════════════════════════════════');
  console.log('Import Complete! (Part 1)');
  console.log('═══════════════════════════════════════');
  console.log(`Sets created: ${totalSetsCreated}`);
  console.log(`Cards created: ${totalCardsCreated}`);
  console.log('═══════════════════════════════════════\n');
  console.log('Next: Run import scripts for remaining autograph sets');
}

main()
  .catch((e) => {
    console.error('Error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
