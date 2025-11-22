import { PrismaClient } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';

const prisma = new PrismaClient();

type SetType = 'Memorabilia';

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

// Helper function to generate player cards from ranges
function generateCards(startNum: number, count: number, teams: string[]): CardData[] {
  const cards: CardData[] = [];
  for (let i = 0; i < count; i++) {
    const cardNum = startNum + i;
    cards.push({
      cardNumber: String(cardNum),
      playerName: `Player ${cardNum}`,
      team: teams[i % teams.length],
      printRun: undefined
    });
  }
  return cards;
}

// Memorabilia sets data extracted from the checklist
const memorabiliaSets: SetData[] = [
  // Frequent Flyers Materials
  {
    setName: 'Frequent Flyers Materials',
    setType: 'Memorabilia',
    printRun: 149,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 149 },
      { cardNumber: '2', playerName: 'Stanley Johnson', team: 'Detroit Pistons', printRun: 149 },
      { cardNumber: '3', playerName: 'DeMar DeRozan', team: 'Toronto Raptors', printRun: 149 },
      { cardNumber: '4', playerName: 'LeBron James', team: 'Cleveland Cavaliers', printRun: 149 },
      { cardNumber: '5', playerName: 'James Harden', team: 'Houston Rockets', printRun: 149 },
      { cardNumber: '6', playerName: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', printRun: 149 },
      { cardNumber: '7', playerName: 'Kenneth Faried', team: 'Denver Nuggets', printRun: 149 },
      { cardNumber: '8', playerName: 'Shabazz Muhammad', team: 'Minnesota Timberwolves', printRun: 149 },
      { cardNumber: '9', playerName: 'Aaron Gordon', team: 'Orlando Magic', printRun: 149 },
      { cardNumber: '10', playerName: 'Bobby Portis', team: 'Chicago Bulls', printRun: 149 },
      { cardNumber: '11', playerName: 'Jusuf Nurkic', team: 'Denver Nuggets', printRun: 149 },
      { cardNumber: '12', playerName: 'Marcus Morris', team: 'Detroit Pistons', printRun: 149 },
      { cardNumber: '13', playerName: 'Russell Westbrook', team: 'Oklahoma City Thunder', printRun: 149 },
      { cardNumber: '14', playerName: 'Enes Kanter', team: 'Oklahoma City Thunder', printRun: 149 },
      { cardNumber: '15', playerName: 'Kevin Durant', team: 'Golden State Warriors', printRun: 149 },
      { cardNumber: '16', playerName: 'Tyler Ennis', team: 'Houston Rockets', printRun: 149 },
      { cardNumber: '17', playerName: 'Alex Len', team: 'Phoenix Suns', printRun: 149 },
      { cardNumber: '18', playerName: 'Tristan Thompson', team: 'Cleveland Cavaliers', printRun: 149 },
      { cardNumber: '19', playerName: 'Emmanuel Mudiay', team: 'Denver Nuggets', printRun: 149 },
      { cardNumber: '20', playerName: 'J.R. Smith', team: 'Cleveland Cavaliers', printRun: 149 },
      { cardNumber: '21', playerName: 'Dwyane Wade', team: 'Chicago Bulls', printRun: 149 },
      { cardNumber: '22', playerName: 'Dwight Powell', team: 'Dallas Mavericks', printRun: 149 },
      { cardNumber: '23', playerName: 'Jimmy Butler', team: 'Chicago Bulls', printRun: 149 },
      { cardNumber: '24', playerName: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: 149 },
      { cardNumber: '25', playerName: 'Archie Goodwin', team: 'Phoenix Suns', printRun: 149 },
      { cardNumber: '26', playerName: 'Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 149 },
      { cardNumber: '27', playerName: 'Anthony Davis', team: 'New Orleans Pelicans', printRun: 149 },
      { cardNumber: '28', playerName: 'Michael Beasley', team: 'Milwaukee Bucks', printRun: 149 },
      { cardNumber: '29', playerName: 'John Henson', team: 'Milwaukee Bucks', printRun: 149 },
      { cardNumber: '30', playerName: 'Reggie Jackson', team: 'Detroit Pistons', printRun: 149 },
      { cardNumber: '31', playerName: 'Zach LaVine', team: 'Minnesota Timberwolves', printRun: 149 },
      { cardNumber: '32', playerName: 'Justise Winslow', team: 'Miami Heat', printRun: 149 },
      { cardNumber: '33', playerName: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 149 },
      { cardNumber: '34', playerName: 'Carmelo Anthony', team: 'New York Knicks', printRun: 149 },
      { cardNumber: '35', playerName: 'Jonathon Simmons', team: 'San Antonio Spurs', printRun: 149 },
      { cardNumber: '36', playerName: 'Kent Bazemore', team: 'Atlanta Hawks', printRun: 149 },
      { cardNumber: '37', playerName: 'C.J. McCollum', team: 'Portland Trail Blazers', printRun: 149 },
      { cardNumber: '39', playerName: 'Devin Harris', team: 'Dallas Mavericks', printRun: 149 },
      { cardNumber: '40', playerName: 'Kawhi Leonard', team: 'San Antonio Spurs', printRun: 149 },
      { cardNumber: '41', playerName: 'LaMarcus Aldridge', team: 'San Antonio Spurs', printRun: 149 },
      { cardNumber: '42', playerName: 'Trevor Ariza', team: 'Houston Rockets', printRun: 149 },
      { cardNumber: '43', playerName: 'Nicolas Batum', team: 'Charlotte Hornets', printRun: 149 },
      { cardNumber: '44', playerName: 'Khris Middleton', team: 'Milwaukee Bucks', printRun: 149 },
      { cardNumber: '45', playerName: 'Kyle Lowry', team: 'Toronto Raptors', printRun: 149 },
      { cardNumber: '46', playerName: 'Kobe Bryant', team: 'Los Angeles Lakers', printRun: 149 },
      { cardNumber: '47', playerName: 'Larry Nance', team: 'Phoenix Suns', printRun: 149 },
      { cardNumber: '48', playerName: 'Clyde Drexler', team: 'Portland Trail Blazers', printRun: 149 },
      { cardNumber: '49', playerName: 'Steve Francis', team: 'Houston Rockets', printRun: 149 },
      { cardNumber: '50', playerName: 'Bernard King', team: 'New York Knicks', printRun: 149 },
      { cardNumber: '51', playerName: 'Julius Erving', team: 'Philadelphia 76ers', printRun: 149 },
      { cardNumber: '52', playerName: 'Dan Majerle', team: 'Phoenix Suns', printRun: 149 },
      { cardNumber: '53', playerName: 'Tom Chambers', team: 'Phoenix Suns', printRun: 149 },
      { cardNumber: '54', playerName: 'Shaquille O\'Neal', team: 'Orlando Magic', printRun: 149 },
      { cardNumber: '55', playerName: 'Shawn Marion', team: 'Dallas Mavericks', printRun: 149 },
      { cardNumber: '56', playerName: 'Kenny Smith', team: 'Houston Rockets', printRun: 149 },
      { cardNumber: '57', playerName: 'Larry Johnson', team: 'New York Knicks', printRun: 149 },
      { cardNumber: '58', playerName: 'Manu Ginobili', team: 'San Antonio Spurs', printRun: 149 },
      { cardNumber: '59', playerName: 'Rashard Lewis', team: 'Orlando Magic', printRun: 149 },
      { cardNumber: '60', playerName: 'Ray Allen', team: 'Miami Heat', printRun: 149 },
    ]
  },

  // Frequent Flyers Materials Prime
  {
    setName: 'Frequent Flyers Materials Prime',
    setType: 'Memorabilia',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Frequent Flyers Materials',
    cards: [
      { cardNumber: '1', playerName: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '2', playerName: 'Stanley Johnson', team: 'Detroit Pistons', printRun: 10 },
      { cardNumber: '3', playerName: 'DeMar DeRozan', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '4', playerName: 'LeBron James', team: 'Cleveland Cavaliers', printRun: 10 },
      { cardNumber: '5', playerName: 'James Harden', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '6', playerName: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '7', playerName: 'Kenneth Faried', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '8', playerName: 'Shabazz Muhammad', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '9', playerName: 'Aaron Gordon', team: 'Orlando Magic', printRun: 10 },
      { cardNumber: '10', playerName: 'Bobby Portis', team: 'Chicago Bulls', printRun: 10 },
      { cardNumber: '11', playerName: 'Jusuf Nurkic', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '12', playerName: 'Marcus Morris', team: 'Detroit Pistons', printRun: 10 },
      { cardNumber: '13', playerName: 'Russell Westbrook', team: 'Oklahoma City Thunder', printRun: 10 },
      { cardNumber: '14', playerName: 'Enes Kanter', team: 'Oklahoma City Thunder', printRun: 10 },
      { cardNumber: '15', playerName: 'Kevin Durant', team: 'Golden State Warriors', printRun: 10 },
      { cardNumber: '18', playerName: 'Tristan Thompson', team: 'Cleveland Cavaliers', printRun: 10 },
      { cardNumber: '19', playerName: 'Emmanuel Mudiay', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '20', playerName: 'J.R. Smith', team: 'Cleveland Cavaliers', printRun: 10 },
      { cardNumber: '21', playerName: 'Dwyane Wade', team: 'Chicago Bulls', printRun: 10 },
      { cardNumber: '22', playerName: 'Dwight Powell', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '23', playerName: 'Jimmy Butler', team: 'Chicago Bulls', printRun: 10 },
      { cardNumber: '24', playerName: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '25', playerName: 'Archie Goodwin', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '26', playerName: 'Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '27', playerName: 'Anthony Davis', team: 'New Orleans Pelicans', printRun: 10 },
      { cardNumber: '28', playerName: 'Michael Beasley', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '29', playerName: 'John Henson', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '31', playerName: 'Zach LaVine', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '32', playerName: 'Justise Winslow', team: 'Miami Heat', printRun: 10 },
      { cardNumber: '33', playerName: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '34', playerName: 'Carmelo Anthony', team: 'New York Knicks', printRun: 10 },
      { cardNumber: '35', playerName: 'Jonathon Simmons', team: 'San Antonio Spurs', printRun: 10 },
      { cardNumber: '36', playerName: 'Kent Bazemore', team: 'Atlanta Hawks', printRun: 10 },
      { cardNumber: '37', playerName: 'C.J. McCollum', team: 'Portland Trail Blazers', printRun: 10 },
      { cardNumber: '39', playerName: 'Devin Harris', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '40', playerName: 'Kawhi Leonard', team: 'San Antonio Spurs', printRun: 10 },
      { cardNumber: '41', playerName: 'LaMarcus Aldridge', team: 'San Antonio Spurs', printRun: 10 },
      { cardNumber: '42', playerName: 'Trevor Ariza', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '43', playerName: 'Nicolas Batum', team: 'Charlotte Hornets', printRun: 10 },
      { cardNumber: '44', playerName: 'Khris Middleton', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '45', playerName: 'Kyle Lowry', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '46', playerName: 'Kobe Bryant', team: 'Los Angeles Lakers', printRun: 5 },
      { cardNumber: '47', playerName: 'Larry Nance', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '48', playerName: 'Clyde Drexler', team: 'Portland Trail Blazers', printRun: 10 },
      { cardNumber: '49', playerName: 'Steve Francis', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '50', playerName: 'Bernard King', team: 'New York Knicks', printRun: 10 },
      { cardNumber: '51', playerName: 'Julius Erving', team: 'Philadelphia 76ers', printRun: 2 },
      { cardNumber: '52', playerName: 'Dan Majerle', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '53', playerName: 'Tom Chambers', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '54', playerName: 'Shaquille O\'Neal', team: 'Orlando Magic', printRun: 10 },
      { cardNumber: '55', playerName: 'Shawn Marion', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '56', playerName: 'Kenny Smith', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '57', playerName: 'Larry Johnson', team: 'New York Knicks', printRun: 10 },
      { cardNumber: '58', playerName: 'Manu Ginobili', team: 'San Antonio Spurs', printRun: 10 },
      { cardNumber: '59', playerName: 'Rashard Lewis', team: 'Orlando Magic', printRun: 10 },
      { cardNumber: '60', playerName: 'Ray Allen', team: 'Miami Heat', printRun: 10 },
    ]
  },

  // Freshman Flyer Jumbo Jerseys
  {
    setName: 'Freshman Flyer Jumbo Jerseys',
    setType: 'Memorabilia',
    printRun: 75,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '2', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 75 },
      { cardNumber: '3', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '4', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 75 },
      { cardNumber: '5', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 75 },
      { cardNumber: '6', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '7', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '8', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 75 },
      { cardNumber: '9', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 75 },
      { cardNumber: '11', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '12', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 75 },
      { cardNumber: '13', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 75 },
      { cardNumber: '14', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 75 },
      { cardNumber: '15', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '16', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '17', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 75 },
      { cardNumber: '18', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 75 },
      { cardNumber: '19', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 75 },
      { cardNumber: '20', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 75 },
      { cardNumber: '21', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 75 },
      { cardNumber: '22', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 75 },
      { cardNumber: '23', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 75 },
      { cardNumber: '24', playerName: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: 75 },
      { cardNumber: '25', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '26', playerName: 'Patrick McCaw', team: 'Golden State Warriors', printRun: 75 },
      { cardNumber: '27', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 75 },
      { cardNumber: '28', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 75 },
      { cardNumber: '29', playerName: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: 75 },
      { cardNumber: '30', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '31', playerName: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: 75 },
      { cardNumber: '32', playerName: 'A.J. Hammons', team: 'Dallas Mavericks', printRun: 75 },
      { cardNumber: '33', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 75 },
      { cardNumber: '34', playerName: 'Gary Payton II', team: 'Houston Rockets', printRun: 75 },
      { cardNumber: '35', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 75 },
      { cardNumber: '36', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun: 75 },
      { cardNumber: '37', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '38', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun: 75 },
      { cardNumber: '39', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 75 },
      { cardNumber: '40', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun: 75 },
    ]
  },

  // Freshman Flyer Jumbo Jerseys Prime
  {
    setName: 'Freshman Flyer Jumbo Jerseys Prime',
    setType: 'Memorabilia',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Freshman Flyer Jumbo Jerseys',
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '2', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '3', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '4', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '5', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 10 },
      { cardNumber: '6', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '7', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '8', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '9', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '11', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 10 },
      { cardNumber: '12', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 10 },
      { cardNumber: '13', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 10 },
      { cardNumber: '14', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 10 },
      { cardNumber: '15', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '16', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 10 },
      { cardNumber: '17', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '18', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 10 },
      { cardNumber: '19', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 10 },
      { cardNumber: '20', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '21', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '22', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 10 },
      { cardNumber: '23', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 10 },
      { cardNumber: '24', playerName: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: 10 },
      { cardNumber: '25', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '26', playerName: 'Patrick McCaw', team: 'Golden State Warriors', printRun: 10 },
      { cardNumber: '27', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 10 },
      { cardNumber: '28', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '29', playerName: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: 10 },
      { cardNumber: '30', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '31', playerName: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '32', playerName: 'A.J. Hammons', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '33', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 10 },
      { cardNumber: '34', playerName: 'Gary Payton II', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '35', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 10 },
      { cardNumber: '36', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '37', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '38', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '39', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 10 },
      { cardNumber: '40', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun: 10 },
    ]
  },

  // Note: Additional sets will be added via Part 2 script
  // Due to size constraints, I'm splitting memorabilia into multiple scripts
];

async function importMemorabilia() {
  try {
    console.log('Starting 2016-17 Panini Absolute Basketball Memorabilia import (Part 1)...\n');

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

    // Process each memorabilia set
    let setCount = 0;
    let cardCount = 0;

    for (const setData of memorabiliaSets) {
      console.log(`Processing: ${setData.setName} (${setData.cards.length} cards)`);
      console.log(`  Type: ${setData.setType}`);
      console.log(`  Is Parallel: ${setData.isParallel}`);
      console.log(`  Print Run: ${setData.printRun || 'Varies'}`);

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
              hasAutograph: false,
              hasMemorabilia: true,
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
    console.log(`Successfully imported ${setCount} memorabilia sets and ${cardCount} cards (Part 1)`);
    console.log('='.repeat(60));
    console.log('\nNote: Additional memorabilia sets in Part 2 script');
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importMemorabilia();
