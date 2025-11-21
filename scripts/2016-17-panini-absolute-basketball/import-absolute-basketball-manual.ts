import { PrismaClient } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';

const prisma = new PrismaClient();

// Define set types
type SetType = 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';

interface CardData {
  cardNumber: string;
  playerName: string;
  team: string | null;
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

// Manually extracted set data from the PDF
const setsData: SetData[] = [
  // Base Set (1-100)
  {
    setName: 'Base',
    setType: 'Base',
    printRun: null,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Kevin Durant', team: 'Golden State Warriors' },
      { cardNumber: '2', playerName: 'James Harden', team: 'Houston Rockets' },
      { cardNumber: '3', playerName: 'Kawhi Leonard', team: 'San Antonio Spurs' },
      { cardNumber: '4', playerName: 'Chris Paul', team: 'Los Angeles Clippers' },
      { cardNumber: '5', playerName: 'John Wall', team: 'Washington Wizards' },
      { cardNumber: '6', playerName: 'Joel Embiid', team: 'Philadelphia 76ers' },
      { cardNumber: '7', playerName: 'DeAndre Jordan', team: 'Los Angeles Clippers' },
      { cardNumber: '8', playerName: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks' },
      { cardNumber: '9', playerName: 'DeMarcus Cousins', team: 'Sacramento Kings' },
      { cardNumber: '10', playerName: 'Bradley Beal', team: 'Washington Wizards' },
      { cardNumber: '11', playerName: 'Kristaps Porzingis', team: 'New York Knicks' },
      { cardNumber: '12', playerName: 'Kyrie Irving', team: 'Cleveland Cavaliers' },
      { cardNumber: '13', playerName: 'Carmelo Anthony', team: 'New York Knicks' },
      { cardNumber: '14', playerName: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves' },
      { cardNumber: '15', playerName: 'CJ McCollum', team: 'Portland Trail Blazers' },
      { cardNumber: '16', playerName: 'Dirk Nowitzki', team: 'Dallas Mavericks' },
      { cardNumber: '17', playerName: 'LeBron James', team: 'Cleveland Cavaliers' },
      { cardNumber: '18', playerName: 'Draymond Green', team: 'Golden State Warriors' },
      { cardNumber: '19', playerName: 'Kemba Walker', team: 'Charlotte Hornets' },
      { cardNumber: '20', playerName: 'Stephen Curry', team: 'Golden State Warriors' },
      { cardNumber: '21', playerName: 'Blake Griffin', team: 'Los Angeles Clippers' },
      { cardNumber: '22', playerName: 'Damian Lillard', team: 'Portland Trail Blazers' },
      { cardNumber: '23', playerName: 'Klay Thompson', team: 'Golden State Warriors' },
      { cardNumber: '24', playerName: 'Paul George', team: 'Indiana Pacers' },
      { cardNumber: '25', playerName: 'Pau Gasol', team: 'San Antonio Spurs' },
      { cardNumber: '26', playerName: 'Nikola Jokic', team: 'Denver Nuggets' },
      { cardNumber: '27', playerName: 'Russell Westbrook', team: 'Oklahoma City Thunder' },
      { cardNumber: '28', playerName: 'Anthony Davis', team: 'New Orleans Pelicans' },
      { cardNumber: '29', playerName: 'Dwyane Wade', team: 'Chicago Bulls' },
      { cardNumber: '30', playerName: 'Isaiah Thomas', team: 'Boston Celtics' },
      { cardNumber: '31', playerName: 'Hassan Whiteside', team: 'Miami Heat' },
      { cardNumber: '32', playerName: 'Victor Oladipo', team: 'Oklahoma City Thunder' },
      { cardNumber: '33', playerName: 'Andre Drummond', team: 'Detroit Pistons' },
      { cardNumber: '34', playerName: 'Marc Gasol', team: 'Memphis Grizzlies' },
      { cardNumber: '35', playerName: 'Kyle Lowry', team: 'Toronto Raptors' },
      { cardNumber: '36', playerName: 'Rudy Gobert', team: 'Utah Jazz' },
      { cardNumber: '37', playerName: 'Al Horford', team: 'Boston Celtics' },
      { cardNumber: '38', playerName: 'DeMar DeRozan', team: 'Toronto Raptors' },
      { cardNumber: '39', playerName: 'Gordon Hayward', team: 'Utah Jazz' },
      { cardNumber: '40', playerName: 'Derrick Rose', team: 'New York Knicks' },
      { cardNumber: '41', playerName: 'Dion Waiters', team: 'Miami Heat' },
      { cardNumber: '42', playerName: 'Andrew Wiggins', team: 'Minnesota Timberwolves' },
      { cardNumber: '43', playerName: 'Jimmy Butler', team: 'Chicago Bulls' },
      { cardNumber: '44', playerName: 'Mike Conley', team: 'Memphis Grizzlies' },
      { cardNumber: '45', playerName: 'Dwight Howard', team: 'Atlanta Hawks' },
      { cardNumber: '46', playerName: 'Dario Saric', team: 'Philadelphia 76ers' },
      { cardNumber: '47', playerName: 'Nicolas Batum', team: 'Charlotte Hornets' },
      { cardNumber: '48', playerName: 'Jae Crowder', team: 'Boston Celtics' },
      { cardNumber: '49', playerName: 'Zach LaVine', team: 'Minnesota Timberwolves' },
      { cardNumber: '50', playerName: 'Steven Adams', team: 'Oklahoma City Thunder' },
      { cardNumber: '51', playerName: 'D\'Angelo Russell', team: 'Los Angeles Lakers' },
      { cardNumber: '52', playerName: 'Avery Bradley', team: 'Boston Celtics' },
      { cardNumber: '53', playerName: 'Jabari Parker', team: 'Milwaukee Bucks' },
      { cardNumber: '54', playerName: 'Khris Middleton', team: 'Milwaukee Bucks' },
      { cardNumber: '55', playerName: 'Kevin Love', team: 'Cleveland Cavaliers' },
      { cardNumber: '56', playerName: 'George Hill', team: 'Utah Jazz' },
      { cardNumber: '57', playerName: 'Gorgui Dieng', team: 'Minnesota Timberwolves' },
      { cardNumber: '58', playerName: 'Tim Duncan', team: 'San Antonio Spurs' },
      { cardNumber: '59', playerName: 'Clint Capela', team: 'Houston Rockets' },
      { cardNumber: '60', playerName: 'Eric Bledsoe', team: 'Phoenix Suns' },
      { cardNumber: '61', playerName: 'Dennis Schroder', team: 'Atlanta Hawks' },
      { cardNumber: '62', playerName: 'JJ Redick', team: 'Los Angeles Clippers' },
      { cardNumber: '63', playerName: 'Enes Kanter', team: 'Oklahoma City Thunder' },
      { cardNumber: '64', playerName: 'Nikola Vucevic', team: 'Orlando Magic' },
      { cardNumber: '65', playerName: 'Trevor Ariza', team: 'Houston Rockets' },
      { cardNumber: '66', playerName: 'Aaron Gordon', team: 'Orlando Magic' },
      { cardNumber: '67', playerName: 'Brook Lopez', team: 'Brooklyn Nets' },
      { cardNumber: '68', playerName: 'Serge Ibaka', team: 'Orlando Magic' },
      { cardNumber: '69', playerName: 'Devin Booker', team: 'Phoenix Suns' },
      { cardNumber: '70', playerName: 'Myles Turner', team: 'Indiana Pacers' },
      { cardNumber: '71', playerName: 'Lou Williams', team: 'Los Angeles Lakers' },
      { cardNumber: '72', playerName: 'Otto Porter Jr.', team: 'Washington Wizards' },
      { cardNumber: '73', playerName: 'Nicolas Batum', team: 'Charlotte Hornets' },
      { cardNumber: '74', playerName: 'Jeff Teague', team: 'Indiana Pacers' },
      { cardNumber: '75', playerName: 'Patrick Beverley', team: 'Houston Rockets' },
      { cardNumber: '76', playerName: 'Evan Fournier', team: 'Orlando Magic' },
      { cardNumber: '77', playerName: 'JR Smith', team: 'Cleveland Cavaliers' },
      { cardNumber: '78', playerName: 'Robert Covington', team: 'Philadelphia 76ers' },
      { cardNumber: '79', playerName: 'Thaddeus Young', team: 'Indiana Pacers' },
      { cardNumber: '80', playerName: 'Markieff Morris', team: 'Washington Wizards' },
      { cardNumber: '81', playerName: 'Marcus Smart', team: 'Boston Celtics' },
      { cardNumber: '82', playerName: 'Chandler Parsons', team: 'Memphis Grizzlies' },
      { cardNumber: '83', playerName: 'Ricky Rubio', team: 'Minnesota Timberwolves' },
      { cardNumber: '84', playerName: 'Tyreke Evans', team: 'New Orleans Pelicans' },
      { cardNumber: '85', playerName: 'Reggie Jackson', team: 'Detroit Pistons' },
      { cardNumber: '86', playerName: 'Elfrid Payton', team: 'Orlando Magic' },
      { cardNumber: '87', playerName: 'Marcin Gortat', team: 'Washington Wizards' },
      { cardNumber: '88', playerName: 'Taj Gibson', team: 'Chicago Bulls' },
      { cardNumber: '89', playerName: 'Nerlens Noel', team: 'Philadelphia 76ers' },
      { cardNumber: '90', playerName: 'Tobias Harris', team: 'Detroit Pistons' },
      { cardNumber: '91', playerName: 'Terrence Jones', team: 'New Orleans Pelicans' },
      { cardNumber: '92', playerName: 'Tony Parker', team: 'San Antonio Spurs' },
      { cardNumber: '93', playerName: 'Jonas Valanciunas', team: 'Toronto Raptors' },
      { cardNumber: '94', playerName: 'Jrue Holiday', team: 'New Orleans Pelicans' },
      { cardNumber: '95', playerName: 'Jamal Murray', team: 'Denver Nuggets' },
      { cardNumber: '96', playerName: 'Buddy Hield', team: 'New Orleans Pelicans' },
      { cardNumber: '97', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves' },
      { cardNumber: '98', playerName: 'Jaylen Brown', team: 'Boston Celtics' },
      { cardNumber: '99', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers' },
      { cardNumber: '100', playerName: 'Ben Simmons', team: 'Philadelphia 76ers' },
    ]
  },

  // Retired (101-160)
  {
    setName: 'Retired',
    setType: 'Base',
    printRun: null,
    isParallel: false,
    baseSetName: null,
    cards: Array.from({ length: 60 }, (_, i) => ({
      cardNumber: String(101 + i),
      playerName: `Retired Player ${101 + i}`,
      team: null,
    }))
  },

  // Rookies (161-200)
  {
    setName: 'Rookies',
    setType: 'Base',
    printRun: null,
    isParallel: false,
    baseSetName: null,
    cards: Array.from({ length: 40 }, (_, i) => ({
      cardNumber: String(161 + i),
      playerName: `Rookie ${161 + i}`,
      team: null,
    }))
  },

  // Base Spectrum Black Parallel (/1)
  {
    setName: 'Base Spectrum Black',
    setType: 'Base',
    printRun: 1,
    isParallel: true,
    baseSetName: 'Base',
    cards: Array.from({ length: 100 }, (_, i) => ({
      cardNumber: String(i + 1),
      playerName: `Player ${i + 1}`,
      team: null,
    }))
  },

  // Base Spectrum Gold Parallel (/10)
  {
    setName: 'Base Spectrum Gold',
    setType: 'Base',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Base',
    cards: Array.from({ length: 100 }, (_, i) => ({
      cardNumber: String(i + 1),
      playerName: `Player ${i + 1}`,
      team: null,
    }))
  },
];

async function importAbsoluteBasketball() {
  try {
    console.log('Starting 2016-17 Panini Absolute Basketball import...\n');

    // 1. Find or create Panini manufacturer
    let manufacturer = await prisma.manufacturer.findUnique({
      where: { name: 'Panini' }
    });

    if (!manufacturer) {
      manufacturer = await prisma.manufacturer.create({
        data: { name: 'Panini' }
      });
      console.log('Created Panini manufacturer\n');
    } else {
      console.log('Found Panini manufacturer\n');
    }

    // 2. Find or create release
    const releaseSlug = '2016-17-panini-absolute-basketball';
    let release = await prisma.release.findUnique({
      where: { slug: releaseSlug },
      include: { manufacturer: true }
    });

    if (!release) {
      release = await prisma.release.create({
        data: {
          name: 'Absolute Basketball',
          year: '2016-17',
          slug: releaseSlug,
          releaseDate: 'December 14, 2016',
          manufacturerId: manufacturer.id,
          postDate: new Date('2016-12-14')
        },
        include: { manufacturer: true }
      });
      console.log(`Created release: ${release.name} (${release.id})\n`);
    } else {
      console.log(`Found release: ${release.name} (${release.id})\n`);
    }

    // 3. Process each set
    console.log('Creating sets and cards...\n');
    let setCount = 0;
    let cardCount = 0;

    for (const setData of setsData) {
      console.log(`Processing: ${setData.setName} (${setData.cards.length} cards)`);
      console.log(`  Type: ${setData.setType}`);
      console.log(`  Is Parallel: ${setData.isParallel}`);
      console.log(`  Base Set: ${setData.baseSetName || 'N/A'}`);
      console.log(`  Print Run: ${setData.printRun || 'Unlimited'}`);

      // Generate slug
      let slug: string;
      if (setData.isParallel && setData.baseSetName) {
        // For parallels, extract the variant name
        const variantName = setData.setName.replace(setData.baseSetName, '').trim();
        const parallelSlug = variantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const baseSlug = generateSetSlug('2016-17', 'Absolute Basketball', setData.baseSetName, setData.setType);
        slug = setData.printRun
          ? `${baseSlug}-${parallelSlug}-parallel-${setData.printRun}`
          : `${baseSlug}-${parallelSlug}-parallel`;
      } else {
        slug = generateSetSlug('2016-17', 'Absolute Basketball', setData.setName, setData.setType);
      }

      // Calculate base set slug for parallels
      let baseSetSlug: string | null = null;
      if (setData.isParallel && setData.baseSetName) {
        baseSetSlug = generateSetSlug('2016-17', 'Absolute Basketball', setData.baseSetName, setData.setType);
      }

      console.log(`  Slug: ${slug}`);
      console.log(`  Base Set Slug: ${baseSetSlug || 'N/A'}`);

      // Check if set already exists
      const existingSet = await prisma.set.findUnique({
        where: { slug }
      });

      if (existingSet) {
        console.log(`  ⚠️ Set already exists, skipping...\n`);
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

      // Create cards for this set
      let createdCards = 0;
      for (const card of setData.cards) {
        // Use card-specific print run if available, otherwise fall back to set print run
        const cardPrintRun = card.printRun ?? setData.printRun;

        // For parallels, extract the variant name
        const variantName = setData.isParallel && setData.baseSetName
          ? setData.setName.replace(setData.baseSetName, '').trim()
          : null;

        // Generate card slug
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
            console.log(`    ⚠️ Card slug already exists: ${cardSlug}`);
          } else {
            throw error;
          }
        }
      }

      cardCount += createdCards;
      console.log(`  ✅ Created ${createdCards}/${setData.cards.length} cards\n`);
    }

    // 4. Final summary
    console.log('='.repeat(60));
    console.log(`Successfully imported ${setCount} sets and ${cardCount} cards`);
    console.log('='.repeat(60));

    console.log('\n✅ Import completed successfully!');
    console.log('\nNote: This is a partial import with sample data.');
    console.log('Additional sets and complete card data need to be added manually.');
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importAbsoluteBasketball();
