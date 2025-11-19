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

const memorabiliaSets: SetData[] = [
  // Back to the Future Materials (Base)
  {
    name: 'Back to the Future Materials',
    cards: [
      { number: '1', player: 'Brandon Jennings', team: 'Detroit Pistons', printRun: 199 },
      { number: '2', player: 'Pau Gasol', team: 'Los Angeles Lakers', printRun: 199 },
      { number: '3', player: 'Chris Paul', team: 'New Orleans Hornets', printRun: 199 },
      { number: '4', player: 'Carmelo Anthony', team: 'Denver Nuggets', printRun: 150 },
      { number: '5', player: 'Markieff Morris', team: 'Phoenix Suns', printRun: 199 },
      { number: '6', player: 'Rajon Rondo', team: 'Boston Celtics', printRun: 199 },
      { number: '7', player: 'Vince Carter', team: 'Dallas Mavericks', printRun: 199 },
      { number: '8', player: 'Kevin Garnett', team: 'Brooklyn Nets', printRun: 199 },
      { number: '9', player: 'Reggie Jackson', team: 'Oklahoma City Thunder', printRun: 199 },
      { number: '10', player: 'Wesley Matthews', team: 'Portland Trail Blazers', printRun: 199 },
      { number: '11', player: 'LaMarcus Aldridge', team: 'Portland Trail Blazers', printRun: 199 },
      { number: '12', player: 'Monta Ellis', team: 'Dallas Mavericks', printRun: 199 },
      { number: '13', player: 'Paul Pierce', team: 'Boston Celtics', printRun: 199 },
      { number: '14', player: 'Danilo Gallinari', team: 'New York Knicks', printRun: 199 },
      { number: '15', player: 'LeBron James', team: 'Miami Heat', printRun: 199 },
    ]
  },
  // Back to the Future Materials Prime (Parallel)
  {
    name: 'Back to the Future Materials Prime',
    isParallel: true,
    baseSetName: 'Back to the Future Materials',
    cards: [
      { number: '1', player: 'Brandon Jennings', team: 'Detroit Pistons', printRun: 10 },
      { number: '2', player: 'Pau Gasol', team: 'Los Angeles Lakers', printRun: 10 },
      { number: '3', player: 'Chris Paul', team: 'New Orleans Hornets', printRun: 10 },
      { number: '4', player: 'Carmelo Anthony', team: 'Denver Nuggets', printRun: 3 },
      { number: '5', player: 'Markieff Morris', team: 'Phoenix Suns', printRun: 10 },
      { number: '6', player: 'Rajon Rondo', team: 'Boston Celtics', printRun: 10 },
      { number: '7', player: 'Vince Carter', team: 'Dallas Mavericks', printRun: 10 },
      { number: '8', player: 'Kevin Garnett', team: 'Brooklyn Nets', printRun: 10 },
      { number: '9', player: 'Reggie Jackson', team: 'Oklahoma City Thunder', printRun: 10 },
      { number: '10', player: 'Wesley Matthews', team: 'Portland Trail Blazers', printRun: 10 },
      { number: '11', player: 'LaMarcus Aldridge', team: 'Portland Trail Blazers', printRun: 10 },
      { number: '12', player: 'Monta Ellis', team: 'Dallas Mavericks', printRun: 10 },
      { number: '13', player: 'Paul Pierce', team: 'Boston Celtics', printRun: 10 },
      { number: '14', player: 'Danilo Gallinari', team: 'New York Knicks', printRun: 10 },
      { number: '15', player: 'LeBron James', team: 'Miami Heat', printRun: 10 },
    ]
  },
  // Jersey Kings (Base)
  {
    name: 'Jersey Kings',
    cards: [
      { number: '1', player: 'Jabari Parker', team: 'Milwaukee Bucks', printRun: null },
      { number: '2', player: 'Jimmy Butler', team: 'Chicago Bulls', printRun: null },
      { number: '3', player: 'LeBron James', team: 'Cleveland Cavaliers', printRun: null },
      { number: '4', player: 'Isaiah Thomas', team: 'Boston Celtics', printRun: null },
      { number: '5', player: 'DeAndre Jordan', team: 'Los Angeles Clippers', printRun: null },
      { number: '6', player: 'Marc Gasol', team: 'Memphis Grizzlies', printRun: null },
      { number: '7', player: 'Paul Millsap', team: 'Atlanta Hawks', printRun: null },
      { number: '8', player: 'Kemba Walker', team: 'Charlotte Hornets', printRun: null },
      { number: '9', player: 'DeMarcus Cousins', team: 'Sacramento Kings', printRun: null },
      { number: '10', player: 'Carmelo Anthony', team: 'New York Knicks', printRun: null },
      { number: '11', player: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: null },
      { number: '12', player: 'Brook Lopez', team: 'Brooklyn Nets', printRun: null },
      { number: '13', player: 'Danilo Gallinari', team: 'Denver Nuggets', printRun: null },
      { number: '14', player: 'Paul George', team: 'Indiana Pacers', printRun: null },
      { number: '15', player: 'Jrue Holiday', team: 'New Orleans Pelicans', printRun: null },
      { number: '16', player: 'Andre Drummond', team: 'Detroit Pistons', printRun: null },
      { number: '17', player: 'DeMar DeRozan', team: 'Toronto Raptors', printRun: null },
      { number: '18', player: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: null },
      { number: '19', player: 'Kawhi Leonard', team: 'San Antonio Spurs', printRun: null },
      { number: '20', player: 'Gordon Hayward', team: 'Utah Jazz', printRun: null },
      { number: '21', player: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: null },
      { number: '22', player: 'Damian Lillard', team: 'Portland Trail Blazers', printRun: null },
      { number: '23', player: 'Stephen Curry', team: 'Golden State Warriors', printRun: null },
      { number: '24', player: 'John Wall', team: 'Washington Wizards', printRun: null },
      { number: '25', player: 'Russell Westbrook', team: 'Oklahoma City Thunder', printRun: null },
    ]
  },
  // Jersey Kings Prime (Parallel)
  {
    name: 'Jersey Kings Prime',
    isParallel: true,
    baseSetName: 'Jersey Kings',
    cards: [
      { number: '1', player: 'Jabari Parker', team: 'Milwaukee Bucks', printRun: 10 },
      { number: '2', player: 'Jimmy Butler', team: 'Chicago Bulls', printRun: 10 },
      { number: '3', player: 'LeBron James', team: 'Cleveland Cavaliers', printRun: 10 },
      { number: '4', player: 'Isaiah Thomas', team: 'Boston Celtics', printRun: 10 },
      { number: '5', player: 'DeAndre Jordan', team: 'Los Angeles Clippers', printRun: 10 },
      { number: '6', player: 'Marc Gasol', team: 'Memphis Grizzlies', printRun: 10 },
      { number: '7', player: 'Paul Millsap', team: 'Atlanta Hawks', printRun: 10 },
      { number: '8', player: 'Kemba Walker', team: 'Charlotte Hornets', printRun: 10 },
      { number: '9', player: 'DeMarcus Cousins', team: 'Sacramento Kings', printRun: 10 },
      { number: '10', player: 'Carmelo Anthony', team: 'New York Knicks', printRun: 10 },
      { number: '11', player: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: 10 },
      { number: '12', player: 'Brook Lopez', team: 'Brooklyn Nets', printRun: 10 },
      { number: '13', player: 'Danilo Gallinari', team: 'Denver Nuggets', printRun: 10 },
      { number: '14', player: 'Paul George', team: 'Indiana Pacers', printRun: 10 },
      { number: '15', player: 'Jrue Holiday', team: 'New Orleans Pelicans', printRun: 10 },
      { number: '16', player: 'Andre Drummond', team: 'Detroit Pistons', printRun: 10 },
      { number: '17', player: 'DeMar DeRozan', team: 'Toronto Raptors', printRun: 10 },
      { number: '18', player: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '19', player: 'Kawhi Leonard', team: 'San Antonio Spurs', printRun: 10 },
      { number: '20', player: 'Gordon Hayward', team: 'Utah Jazz', printRun: 10 },
      { number: '21', player: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '22', player: 'Damian Lillard', team: 'Portland Trail Blazers', printRun: 10 },
      { number: '23', player: 'Stephen Curry', team: 'Golden State Warriors', printRun: 10 },
      { number: '24', player: 'John Wall', team: 'Washington Wizards', printRun: 10 },
      { number: '25', player: 'Russell Westbrook', team: 'Oklahoma City Thunder', printRun: 10 },
    ]
  },
  // Jersey Series (Base)
  {
    name: 'Jersey Series',
    cards: [
      { number: '1', player: 'Jusuf Nurkic', team: 'Denver Nuggets', printRun: null },
      { number: '2', player: 'Al Horford', team: 'Boston Celtics', printRun: null },
      { number: '3', player: 'Zach LaVine', team: 'Minnesota Timberwolves', printRun: null },
      { number: '4', player: 'Ben McLemore', team: 'Sacramento Kings', printRun: null },
      { number: '5', player: 'Bojan Bogdanovic', team: 'Brooklyn Nets', printRun: null },
      { number: '6', player: 'Bradley Beal', team: 'Washington Wizards', printRun: null },
      { number: '7', player: 'Brook Lopez', team: 'Brooklyn Nets', printRun: null },
      { number: '8', player: 'Carmelo Anthony', team: 'New York Knicks', printRun: null },
      { number: '9', player: 'Chandler Parsons', team: 'Memphis Grizzlies', printRun: null },
      { number: '10', player: 'Chris Bosh', team: 'Miami Heat', printRun: null },
      { number: '11', player: 'Cody Zeller', team: 'Charlotte Hornets', printRun: null },
      { number: '12', player: 'Danilo Gallinari', team: 'Denver Nuggets', printRun: null },
      { number: '13', player: 'Danny Green', team: 'San Antonio Spurs', printRun: null },
      { number: '14', player: 'DeMarcus Cousins', team: 'Sacramento Kings', printRun: null },
      { number: '15', player: 'DeMarre Carroll', team: 'Toronto Raptors', printRun: null },
      { number: '16', player: 'Derrick Rose', team: 'New York Knicks', printRun: null },
      { number: '17', player: 'Dirk Nowitzki', team: 'Dallas Mavericks', printRun: null },
      { number: '18', player: 'Donatas Motiejunas', team: 'Houston Rockets', printRun: null },
      { number: '19', player: 'Dwight Howard', team: 'Atlanta Hawks', printRun: null },
      { number: '20', player: 'Dwyane Wade', team: 'Chicago Bulls', printRun: null },
      { number: '21', player: 'Eric Gordon', team: 'Houston Rockets', printRun: null },
      { number: '22', player: 'George Hill', team: 'Utah Jazz', printRun: null },
      { number: '23', player: 'Gorgui Dieng', team: 'Minnesota Timberwolves', printRun: null },
      { number: '24', player: 'Terrence Ross', team: 'Toronto Raptors', printRun: null },
      { number: '25', player: 'Jabari Parker', team: 'Milwaukee Bucks', printRun: null },
      { number: '26', player: 'Jared Sullinger', team: 'Toronto Raptors', printRun: null },
      { number: '27', player: 'Jeff Teague', team: 'Indiana Pacers', printRun: null },
      { number: '28', player: 'John Henson', team: 'Milwaukee Bucks', printRun: null },
      { number: '29', player: 'John Wall', team: 'Washington Wizards', printRun: null },
      { number: '30', player: 'Jonas Valanciunas', team: 'Toronto Raptors', printRun: null },
      { number: '31', player: 'Jrue Holiday', team: 'New Orleans Pelicans', printRun: null },
      { number: '32', player: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: null },
      { number: '33', player: 'Kemba Walker', team: 'Charlotte Hornets', printRun: null },
      { number: '34', player: 'Kenneth Faried', team: 'Denver Nuggets', printRun: null },
      { number: '35', player: 'Kevin Durant', team: 'Golden State Warriors', printRun: null },
      { number: '36', player: 'Kevin Garnett', team: 'Minnesota Timberwolves', printRun: null },
      { number: '37', player: 'Kevin Love', team: 'Cleveland Cavaliers', printRun: null },
      { number: '38', player: 'Kyle Lowry', team: 'Toronto Raptors', printRun: null },
      { number: '39', player: 'Kyrie Irving', team: 'Cleveland Cavaliers', printRun: null },
      { number: '40', player: 'LeBron James', team: 'Cleveland Cavaliers', printRun: null },
      { number: '41', player: 'Marc Gasol', team: 'Memphis Grizzlies', printRun: null },
      { number: '42', player: 'Marcin Gortat', team: 'Washington Wizards', printRun: null },
      { number: '43', player: 'Matthew Dellavedova', team: 'Milwaukee Bucks', printRun: null },
      { number: '44', player: 'Mike Conley', team: 'Memphis Grizzlies', printRun: null },
      { number: '45', player: 'Nerlens Noel', team: 'Philadelphia 76ers', printRun: null },
      { number: '46', player: 'Otto Porter', team: 'Washington Wizards', printRun: null },
      { number: '47', player: 'Patrick Beverley', team: 'Houston Rockets', printRun: null },
      { number: '48', player: 'Ricky Rubio', team: 'Minnesota Timberwolves', printRun: null },
      { number: '49', player: 'Shabazz Muhammad', team: 'Minnesota Timberwolves', printRun: null },
      { number: '50', player: 'Andrew Bogut', team: 'Dallas Mavericks', printRun: null },
    ]
  },
  // Jersey Series Prime (Parallel)
  {
    name: 'Jersey Series Prime',
    isParallel: true,
    baseSetName: 'Jersey Series',
    cards: [
      { number: '1', player: 'Jusuf Nurkic', team: 'Denver Nuggets', printRun: 10 },
      { number: '2', player: 'Al Horford', team: 'Boston Celtics', printRun: 10 },
      { number: '3', player: 'Zach LaVine', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '4', player: 'Ben McLemore', team: 'Sacramento Kings', printRun: 10 },
      { number: '5', player: 'Bojan Bogdanovic', team: 'Brooklyn Nets', printRun: 10 },
      { number: '6', player: 'Bradley Beal', team: 'Washington Wizards', printRun: 10 },
      { number: '7', player: 'Brook Lopez', team: 'Brooklyn Nets', printRun: 10 },
      { number: '8', player: 'Carmelo Anthony', team: 'New York Knicks', printRun: 10 },
      { number: '9', player: 'Chandler Parsons', team: 'Memphis Grizzlies', printRun: 10 },
      { number: '10', player: 'Chris Bosh', team: 'Miami Heat', printRun: 10 },
      { number: '11', player: 'Cody Zeller', team: 'Charlotte Hornets', printRun: 10 },
      { number: '12', player: 'Danilo Gallinari', team: 'Denver Nuggets', printRun: 10 },
      { number: '13', player: 'Danny Green', team: 'San Antonio Spurs', printRun: 10 },
      { number: '14', player: 'DeMarcus Cousins', team: 'Sacramento Kings', printRun: 10 },
      { number: '15', player: 'DeMarre Carroll', team: 'Toronto Raptors', printRun: 10 },
      { number: '16', player: 'Derrick Rose', team: 'New York Knicks', printRun: 10 },
      { number: '17', player: 'Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 3 },
      { number: '18', player: 'Donatas Motiejunas', team: 'Houston Rockets', printRun: 10 },
      { number: '19', player: 'Dwight Howard', team: 'Atlanta Hawks', printRun: 8 },
      { number: '20', player: 'Dwyane Wade', team: 'Chicago Bulls', printRun: 10 },
      { number: '21', player: 'Eric Gordon', team: 'Houston Rockets', printRun: 10 },
      { number: '22', player: 'George Hill', team: 'Utah Jazz', printRun: 10 },
      { number: '23', player: 'Gorgui Dieng', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '24', player: 'Terrence Ross', team: 'Toronto Raptors', printRun: 10 },
      { number: '25', player: 'Jabari Parker', team: 'Milwaukee Bucks', printRun: 7 },
      { number: '26', player: 'Jared Sullinger', team: 'Toronto Raptors', printRun: 10 },
      { number: '27', player: 'Jeff Teague', team: 'Indiana Pacers', printRun: 10 },
      { number: '28', player: 'John Henson', team: 'Milwaukee Bucks', printRun: 10 },
      { number: '29', player: 'John Wall', team: 'Washington Wizards', printRun: 10 },
      { number: '30', player: 'Jonas Valanciunas', team: 'Toronto Raptors', printRun: 10 },
      { number: '31', player: 'Jrue Holiday', team: 'New Orleans Pelicans', printRun: 10 },
      { number: '32', player: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '33', player: 'Kemba Walker', team: 'Charlotte Hornets', printRun: 10 },
      { number: '34', player: 'Kenneth Faried', team: 'Denver Nuggets', printRun: 10 },
      { number: '35', player: 'Kevin Durant', team: 'Golden State Warriors', printRun: 10 },
      { number: '36', player: 'Kevin Garnett', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '37', player: 'Kevin Love', team: 'Cleveland Cavaliers', printRun: 10 },
      { number: '38', player: 'Kyle Lowry', team: 'Toronto Raptors', printRun: 10 },
      { number: '39', player: 'Kyrie Irving', team: 'Cleveland Cavaliers', printRun: 10 },
      { number: '40', player: 'LeBron James', team: 'Cleveland Cavaliers', printRun: 10 },
      { number: '41', player: 'Marc Gasol', team: 'Memphis Grizzlies', printRun: 10 },
      { number: '42', player: 'Marcin Gortat', team: 'Washington Wizards', printRun: 10 },
      { number: '43', player: 'Matthew Dellavedova', team: 'Milwaukee Bucks', printRun: 10 },
      { number: '44', player: 'Mike Conley', team: 'Memphis Grizzlies', printRun: 10 },
      { number: '45', player: 'Nerlens Noel', team: 'Philadelphia 76ers', printRun: 10 },
      { number: '46', player: 'Otto Porter', team: 'Washington Wizards', printRun: 10 },
      { number: '47', player: 'Patrick Beverley', team: 'Houston Rockets', printRun: 10 },
      { number: '48', player: 'Ricky Rubio', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '49', player: 'Shabazz Muhammad', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '50', player: 'Andrew Bogut', team: 'Dallas Mavericks', printRun: 10 },
    ]
  },
  // Newly Crowned Rookie Jerseys (Base) - Note: Card #1 and #27 missing from checklist
  {
    name: 'Newly Crowned Rookie Jerseys',
    cards: [
      { number: '2', player: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: null },
      { number: '3', player: 'Jaylen Brown', team: 'Boston Celtics', printRun: null },
      { number: '4', player: 'Dragan Bender', team: 'Phoenix Suns', printRun: null },
      { number: '5', player: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: null },
      { number: '6', player: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: null },
      { number: '7', player: 'Jamal Murray', team: 'Denver Nuggets', printRun: null },
      { number: '8', player: 'Marquese Chriss', team: 'Phoenix Suns', printRun: null },
      { number: '9', player: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: null },
      { number: '10', player: 'Thon Maker', team: 'Milwaukee Bucks', printRun: null },
      { number: '11', player: 'Taurean Prince', team: 'Atlanta Hawks', printRun: null },
      { number: '12', player: 'Denzel Valentine', team: 'Chicago Bulls', printRun: null },
      { number: '13', player: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: null },
      { number: '14', player: 'Henry Ellenson', team: 'Detroit Pistons', printRun: null },
      { number: '15', player: 'Malik Beasley', team: 'Denver Nuggets', printRun: null },
      { number: '16', player: 'Caris LeVert', team: 'Brooklyn Nets', printRun: null },
      { number: '17', player: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: null },
      { number: '18', player: 'Malachi Richardson', team: 'Sacramento Kings', printRun: null },
      { number: '19', player: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: null },
      { number: '20', player: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: null },
      { number: '21', player: 'Pascal Siakam', team: 'Toronto Raptors', printRun: null },
      { number: '22', player: 'Skal Labissiere', team: 'Sacramento Kings', printRun: null },
      { number: '23', player: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: null },
      { number: '24', player: 'Damian Jones', team: 'Golden State Warriors', printRun: null },
      { number: '25', player: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: null },
      { number: '26', player: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: null },
      { number: '28', player: 'Gary Payton II', team: 'Houston Rockets', printRun: null },
      { number: '29', player: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: null },
      { number: '30', player: 'Tyler Ulis', team: 'Phoenix Suns', printRun: null },
      { number: '31', player: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: null },
      { number: '32', player: 'Patrick McCaw', team: 'Golden State Warriors', printRun: null },
      { number: '33', player: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: null },
      { number: '34', player: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: null },
      { number: '35', player: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: null },
    ]
  },
  // Newly Crowned Rookie Jerseys Prime (Parallel)
  {
    name: 'Newly Crowned Rookie Jerseys Prime',
    isParallel: true,
    baseSetName: 'Newly Crowned Rookie Jerseys',
    cards: [
      { number: '2', player: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 10 },
      { number: '3', player: 'Jaylen Brown', team: 'Boston Celtics', printRun: 10 },
      { number: '4', player: 'Dragan Bender', team: 'Phoenix Suns', printRun: 10 },
      { number: '5', player: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '6', player: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 10 },
      { number: '7', player: 'Jamal Murray', team: 'Denver Nuggets', printRun: 10 },
      { number: '8', player: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 10 },
      { number: '9', player: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 10 },
      { number: '10', player: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 10 },
      { number: '11', player: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 10 },
      { number: '12', player: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 10 },
      { number: '13', player: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 10 },
      { number: '14', player: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 10 },
      { number: '15', player: 'Malik Beasley', team: 'Denver Nuggets', printRun: 10 },
      { number: '16', player: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 10 },
      { number: '17', player: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 10 },
      { number: '18', player: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 10 },
      { number: '19', player: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 10 },
      { number: '20', player: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 10 },
      { number: '21', player: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 10 },
      { number: '22', player: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 10 },
      { number: '23', player: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 10 },
      { number: '24', player: 'Damian Jones', team: 'Golden State Warriors', printRun: 10 },
      { number: '25', player: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 10 },
      { number: '26', player: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 10 },
      { number: '28', player: 'Gary Payton II', team: 'Houston Rockets', printRun: 10 },
      { number: '29', player: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: 10 },
      { number: '30', player: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 10 },
      { number: '31', player: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: 10 },
      { number: '32', player: 'Patrick McCaw', team: 'Golden State Warriors', printRun: 10 },
      { number: '33', player: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: 10 },
      { number: '34', player: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 10 },
      { number: '35', player: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 10 },
    ]
  },
  // Rookie Jerseys (Base) - Note: Many gaps in numbering (1-100 range)
  {
    name: 'Rookie Jerseys',
    cards: [
      { number: '1', player: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: null },
      { number: '2', player: 'Jaylen Brown', team: 'Boston Celtics', printRun: null },
      { number: '3', player: 'Dragan Bender', team: 'Phoenix Suns', printRun: null },
      { number: '4', player: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: null },
      { number: '5', player: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: null },
      { number: '6', player: 'Jamal Murray', team: 'Denver Nuggets', printRun: null },
      { number: '7', player: 'Marquese Chriss', team: 'Phoenix Suns', printRun: null },
      { number: '8', player: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: null },
      { number: '9', player: 'Thon Maker', team: 'Milwaukee Bucks', printRun: null },
      { number: '10', player: 'Taurean Prince', team: 'Atlanta Hawks', printRun: null },
      { number: '11', player: 'Denzel Valentine', team: 'Chicago Bulls', printRun: null },
      { number: '12', player: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: null },
      { number: '13', player: 'Henry Ellenson', team: 'Detroit Pistons', printRun: null },
      { number: '14', player: 'Malik Beasley', team: 'Denver Nuggets', printRun: null },
      { number: '15', player: 'Caris LeVert', team: 'Brooklyn Nets', printRun: null },
      { number: '16', player: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: null },
      { number: '17', player: 'Malachi Richardson', team: 'Sacramento Kings', printRun: null },
      { number: '18', player: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: null },
      { number: '19', player: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: null },
      { number: '20', player: 'Pascal Siakam', team: 'Toronto Raptors', printRun: null },
      { number: '21', player: 'Skal Labissiere', team: 'Sacramento Kings', printRun: null },
      { number: '22', player: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: null },
      { number: '23', player: 'Gary Payton II', team: 'Houston Rockets', printRun: null },
      { number: '24', player: 'Damian Jones', team: 'Golden State Warriors', printRun: null },
      { number: '25', player: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: null },
      { number: '26', player: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: null },
      { number: '28', player: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: null },
      { number: '29', player: 'Tyler Ulis', team: 'Phoenix Suns', printRun: null },
      { number: '30', player: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: null },
      { number: '31', player: 'Patrick McCaw', team: 'Golden State Warriors', printRun: null },
      { number: '32', player: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: null },
      { number: '33', player: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: null },
      { number: '34', player: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: null },
      { number: '35', player: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: null },
      { number: '36', player: 'Dragan Bender', team: 'Phoenix Suns', printRun: null },
      { number: '37', player: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: null },
      { number: '38', player: 'Jamal Murray', team: 'Denver Nuggets', printRun: null },
      { number: '39', player: 'Marquese Chriss', team: 'Phoenix Suns', printRun: null },
      { number: '40', player: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: null },
      { number: '41', player: 'Thon Maker', team: 'Milwaukee Bucks', printRun: null },
      { number: '42', player: 'Taurean Prince', team: 'Atlanta Hawks', printRun: null },
      { number: '43', player: 'Denzel Valentine', team: 'Chicago Bulls', printRun: null },
      { number: '44', player: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: null },
      { number: '45', player: 'Henry Ellenson', team: 'Detroit Pistons', printRun: null },
      { number: '46', player: 'Malik Beasley', team: 'Denver Nuggets', printRun: null },
      { number: '47', player: 'Caris LeVert', team: 'Brooklyn Nets', printRun: null },
      { number: '48', player: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: null },
      { number: '49', player: 'Malachi Richardson', team: 'Sacramento Kings', printRun: null },
      { number: '50', player: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: null },
      { number: '51', player: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: null },
      { number: '52', player: 'Pascal Siakam', team: 'Toronto Raptors', printRun: null },
      { number: '53', player: 'Skal Labissiere', team: 'Sacramento Kings', printRun: null },
      { number: '54', player: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: null },
      { number: '55', player: 'Gary Payton II', team: 'Houston Rockets', printRun: null },
      { number: '56', player: 'Damian Jones', team: 'Golden State Warriors', printRun: null },
      { number: '57', player: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: null },
      { number: '58', player: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: null },
      { number: '60', player: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: null },
      { number: '61', player: 'Tyler Ulis', team: 'Phoenix Suns', printRun: null },
      { number: '62', player: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: null },
      { number: '63', player: 'Patrick McCaw', team: 'Golden State Warriors', printRun: null },
      { number: '64', player: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: null },
      { number: '65', player: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: null },
      { number: '66', player: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: null },
      { number: '67', player: 'Jaylen Brown', team: 'Boston Celtics', printRun: null },
      { number: '68', player: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: null },
      { number: '69', player: 'Jaylen Brown', team: 'Boston Celtics', printRun: null },
      { number: '70', player: 'Dragan Bender', team: 'Phoenix Suns', printRun: null },
      { number: '71', player: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: null },
      { number: '72', player: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: null },
      { number: '73', player: 'Jamal Murray', team: 'Denver Nuggets', printRun: null },
      { number: '74', player: 'Marquese Chriss', team: 'Phoenix Suns', printRun: null },
      { number: '75', player: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: null },
      { number: '76', player: 'Thon Maker', team: 'Milwaukee Bucks', printRun: null },
      { number: '77', player: 'Taurean Prince', team: 'Atlanta Hawks', printRun: null },
      { number: '78', player: 'Denzel Valentine', team: 'Chicago Bulls', printRun: null },
      { number: '79', player: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: null },
      { number: '80', player: 'Henry Ellenson', team: 'Detroit Pistons', printRun: null },
      { number: '81', player: 'Malik Beasley', team: 'Denver Nuggets', printRun: null },
      { number: '82', player: 'Caris LeVert', team: 'Brooklyn Nets', printRun: null },
      { number: '83', player: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: null },
      { number: '84', player: 'Malachi Richardson', team: 'Sacramento Kings', printRun: null },
      { number: '85', player: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: null },
      { number: '86', player: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: null },
      { number: '87', player: 'Pascal Siakam', team: 'Toronto Raptors', printRun: null },
      { number: '88', player: 'Skal Labissiere', team: 'Sacramento Kings', printRun: null },
      { number: '89', player: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: null },
      { number: '90', player: 'Gary Payton II', team: 'Houston Rockets', printRun: null },
      { number: '91', player: 'Damian Jones', team: 'Golden State Warriors', printRun: null },
      { number: '92', player: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: null },
      { number: '93', player: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: null },
      { number: '95', player: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: null },
      { number: '96', player: 'Tyler Ulis', team: 'Phoenix Suns', printRun: null },
      { number: '97', player: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: null },
      { number: '98', player: 'Patrick McCaw', team: 'Golden State Warriors', printRun: null },
      { number: '99', player: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: null },
      { number: '100', player: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: null },
    ]
  },
  // Rookie Jerseys Prime (Parallel)
  {
    name: 'Rookie Jerseys Prime',
    isParallel: true,
    baseSetName: 'Rookie Jerseys',
    cards: [
      { number: '1', player: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 25 },
      { number: '2', player: 'Jaylen Brown', team: 'Boston Celtics', printRun: 25 },
      { number: '3', player: 'Dragan Bender', team: 'Phoenix Suns', printRun: 25 },
      { number: '4', player: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 25 },
      { number: '5', player: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 25 },
      { number: '6', player: 'Jamal Murray', team: 'Denver Nuggets', printRun: 25 },
      { number: '7', player: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 25 },
      { number: '8', player: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 25 },
      { number: '9', player: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 25 },
      { number: '10', player: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 25 },
      { number: '11', player: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 25 },
      { number: '12', player: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 25 },
      { number: '13', player: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 25 },
      { number: '14', player: 'Malik Beasley', team: 'Denver Nuggets', printRun: 25 },
      { number: '15', player: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 25 },
      { number: '16', player: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 25 },
      { number: '17', player: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 25 },
      { number: '18', player: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 25 },
      { number: '19', player: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 25 },
      { number: '20', player: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 25 },
      { number: '21', player: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 25 },
      { number: '22', player: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 25 },
      { number: '23', player: 'Gary Payton II', team: 'Houston Rockets', printRun: 25 },
      { number: '24', player: 'Damian Jones', team: 'Golden State Warriors', printRun: 25 },
      { number: '25', player: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 25 },
      { number: '26', player: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 25 },
      { number: '28', player: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: 25 },
      { number: '29', player: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 25 },
      { number: '30', player: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: 25 },
      { number: '31', player: 'Patrick McCaw', team: 'Golden State Warriors', printRun: 25 },
      { number: '32', player: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: 25 },
      { number: '33', player: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 25 },
      { number: '34', player: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 25 },
      { number: '35', player: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 25 },
      { number: '36', player: 'Dragan Bender', team: 'Phoenix Suns', printRun: 25 },
      { number: '37', player: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 25 },
      { number: '38', player: 'Jamal Murray', team: 'Denver Nuggets', printRun: 25 },
      { number: '39', player: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 25 },
      { number: '40', player: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 25 },
      { number: '41', player: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 25 },
      { number: '42', player: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 25 },
      { number: '43', player: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 25 },
      { number: '44', player: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 25 },
      { number: '45', player: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 25 },
      { number: '46', player: 'Malik Beasley', team: 'Denver Nuggets', printRun: 25 },
      { number: '47', player: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 25 },
      { number: '48', player: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 25 },
      { number: '49', player: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 25 },
      { number: '50', player: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 25 },
      { number: '51', player: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 25 },
      { number: '52', player: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 25 },
      { number: '53', player: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 25 },
      { number: '54', player: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 25 },
      { number: '55', player: 'Gary Payton II', team: 'Houston Rockets', printRun: 25 },
      { number: '56', player: 'Damian Jones', team: 'Golden State Warriors', printRun: 25 },
      { number: '57', player: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 25 },
      { number: '58', player: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 25 },
      { number: '60', player: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: 25 },
      { number: '61', player: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 25 },
      { number: '62', player: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: 25 },
      { number: '63', player: 'Patrick McCaw', team: 'Golden State Warriors', printRun: 25 },
      { number: '64', player: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: 25 },
      { number: '65', player: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 25 },
      { number: '66', player: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 25 },
      { number: '67', player: 'Jaylen Brown', team: 'Boston Celtics', printRun: 25 },
      { number: '68', player: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 25 },
      { number: '69', player: 'Jaylen Brown', team: 'Boston Celtics', printRun: 25 },
      { number: '70', player: 'Dragan Bender', team: 'Phoenix Suns', printRun: 25 },
      { number: '71', player: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 25 },
      { number: '72', player: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 25 },
      { number: '73', player: 'Jamal Murray', team: 'Denver Nuggets', printRun: 25 },
      { number: '74', player: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 25 },
      { number: '75', player: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 25 },
      { number: '76', player: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 25 },
      { number: '77', player: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 25 },
      { number: '78', player: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 25 },
      { number: '79', player: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 25 },
      { number: '80', player: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 25 },
      { number: '81', player: 'Malik Beasley', team: 'Denver Nuggets', printRun: 25 },
      { number: '82', player: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 25 },
      { number: '83', player: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 25 },
      { number: '84', player: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 25 },
      { number: '85', player: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 25 },
      { number: '86', player: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 25 },
      { number: '87', player: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 25 },
      { number: '88', player: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 25 },
      { number: '89', player: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 25 },
      { number: '90', player: 'Gary Payton II', team: 'Houston Rockets', printRun: 25 },
      { number: '91', player: 'Damian Jones', team: 'Golden State Warriors', printRun: 25 },
      { number: '92', player: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 25 },
      { number: '93', player: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 25 },
      { number: '95', player: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: 25 },
      { number: '96', player: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 25 },
      { number: '97', player: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: 25 },
      { number: '98', player: 'Patrick McCaw', team: 'Golden State Warriors', printRun: 25 },
      { number: '99', player: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 25 },
      { number: '100', player: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 25 },
    ]
  },
  // Swatch Kings Jumbo (Base)
  {
    name: 'Swatch Kings Jumbo',
    cards: [
      { number: '1', player: 'Nerlens Noel', team: 'Philadelphia 76ers', printRun: 99 },
      { number: '2', player: 'Russell Westbrook', team: 'Oklahoma City Thunder', printRun: 99 },
      { number: '3', player: 'Dwyane Wade', team: 'Chicago Bulls', printRun: 99 },
      { number: '4', player: 'Kyrie Irving', team: 'Cleveland Cavaliers', printRun: 99 },
      { number: '5', player: 'Marcus Smart', team: 'Boston Celtics', printRun: 99 },
      { number: '6', player: 'J.J. Redick', team: 'Los Angeles Clippers', printRun: 99 },
      { number: '7', player: 'Chandler Parsons', team: 'Memphis Grizzlies', printRun: 99 },
      { number: '8', player: 'Kent Bazemore', team: 'Atlanta Hawks', printRun: 99 },
      { number: '9', player: 'Goran Dragic', team: 'Miami Heat', printRun: 99 },
      { number: '10', player: 'Nicolas Batum', team: 'Charlotte Hornets', printRun: 99 },
      { number: '11', player: 'Jeremy Lin', team: 'Brooklyn Nets', printRun: 99 },
      { number: '12', player: 'Paul George', team: 'Indiana Pacers', printRun: 99 },
      { number: '13', player: 'Marcus Morris', team: 'Detroit Pistons', printRun: 99 },
      { number: '14', player: 'Kyle Lowry', team: 'Toronto Raptors', printRun: 99 },
      { number: '15', player: 'Derrick Rose', team: 'New York Knicks', printRun: 99 },
      { number: '16', player: 'Patrick Beverley', team: 'Houston Rockets', printRun: 99 },
      { number: '17', player: 'Tony Parker', team: 'San Antonio Spurs', printRun: 99 },
      { number: '18', player: 'Damian Lillard', team: 'Portland Trail Blazers', printRun: 99 },
      { number: '19', player: 'Kevin Durant', team: 'Golden State Warriors', printRun: 99 },
      { number: '20', player: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 99 },
      { number: '21', player: 'Zach LaVine', team: 'Minnesota Timberwolves', printRun: 99 },
      { number: '22', player: 'Kevin Love', team: 'Cleveland Cavaliers', printRun: 99 },
      { number: '23', player: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: 99 },
      { number: '24', player: 'Kentavious Caldwell-Pope', team: 'Detroit Pistons', printRun: 99 },
      { number: '25', player: 'Nikola Vucevic', team: 'Orlando Magic', printRun: 99 },
    ]
  },
  // Swatch Kings Jumbo Prime (Parallel) - Note: Missing card #9 from checklist
  {
    name: 'Swatch Kings Jumbo Prime',
    isParallel: true,
    baseSetName: 'Swatch Kings Jumbo',
    cards: [
      { number: '1', player: 'Nerlens Noel', team: 'Philadelphia 76ers', printRun: 6 },
      { number: '2', player: 'Russell Westbrook', team: 'Oklahoma City Thunder', printRun: 10 },
      { number: '3', player: 'Dwyane Wade', team: 'Chicago Bulls', printRun: 10 },
      { number: '4', player: 'Kyrie Irving', team: 'Cleveland Cavaliers', printRun: 10 },
      { number: '5', player: 'Marcus Smart', team: 'Boston Celtics', printRun: 10 },
      { number: '6', player: 'J.J. Redick', team: 'Los Angeles Clippers', printRun: 10 },
      { number: '7', player: 'Chandler Parsons', team: 'Memphis Grizzlies', printRun: 10 },
      { number: '8', player: 'Kent Bazemore', team: 'Atlanta Hawks', printRun: 10 },
      { number: '10', player: 'Nicolas Batum', team: 'Charlotte Hornets', printRun: 10 },
      { number: '11', player: 'Jeremy Lin', team: 'Brooklyn Nets', printRun: 6 },
      { number: '12', player: 'Paul George', team: 'Indiana Pacers', printRun: 10 },
      { number: '13', player: 'Marcus Morris', team: 'Detroit Pistons', printRun: 10 },
      { number: '14', player: 'Kyle Lowry', team: 'Toronto Raptors', printRun: 10 },
      { number: '15', player: 'Derrick Rose', team: 'New York Knicks', printRun: 10 },
      { number: '16', player: 'Patrick Beverley', team: 'Houston Rockets', printRun: 10 },
      { number: '17', player: 'Tony Parker', team: 'San Antonio Spurs', printRun: 10 },
      { number: '18', player: 'Damian Lillard', team: 'Portland Trail Blazers', printRun: 10 },
      { number: '19', player: 'Kevin Durant', team: 'Golden State Warriors', printRun: 7 },
      { number: '20', player: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '21', player: 'Zach LaVine', team: 'Minnesota Timberwolves', printRun: 10 },
      { number: '22', player: 'Kevin Love', team: 'Cleveland Cavaliers', printRun: 10 },
      { number: '23', player: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: 10 },
      { number: '24', player: 'Kentavious Caldwell-Pope', team: 'Detroit Pistons', printRun: 10 },
      { number: '25', player: 'Nikola Vucevic', team: 'Orlando Magic', printRun: 10 },
    ]
  },
];

async function main() {
  console.log('Starting import of 2016-17 Donruss Basketball Memorabilia Cards...\n');

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
  for (const setData of memorabiliaSets) {
    console.log(`Processing set: ${setData.name} (${setData.cards.length} cards)...`);

    // Generate slug for the set
    const setSlug = generateSetSlug(
      '2016-17',
      'Donruss Basketball',
      setData.name,
      'Memorabilia',
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
        type: 'Memorabilia',
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
      const variant = setData.isParallel ? 'Prime' : null;

      const cardSlug = generateCardSlug(
        'Panini',               // manufacturer
        'Donruss Basketball',   // releaseName
        '2016-17',             // year
        setData.name,          // setName
        cardData.number,       // cardNumber
        cardData.player,       // playerName
        variant,               // variant
        cardData.printRun,     // printRun
        'Memorabilia'          // setType
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
          hasMemorabilia: true,
        }
      });

      cardsCreated++;
    }

    totalCardsCreated += cardsCreated;
    console.log(`  ✓ Created ${cardsCreated} cards\n`);
  }

  console.log('═══════════════════════════════════════');
  console.log('Import Complete!');
  console.log('═══════════════════════════════════════');
  console.log(`Sets created: ${totalSetsCreated}`);
  console.log(`Cards created: ${totalCardsCreated}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
