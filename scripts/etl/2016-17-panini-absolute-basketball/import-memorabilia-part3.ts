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

// Final Memorabilia sets
const memorabiliaSets: SetData[] = [
  // Heroes Materials
  {
    setName: 'Heroes Materials',
    setType: 'Memorabilia',
    printRun: null, // Varies by card
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Alvan Adams', team: 'Phoenix Suns', printRun: 99 },
      { cardNumber: '2', playerName: 'Allen Iverson', team: 'Philadelphia 76ers', printRun: 99 },
      { cardNumber: '3', playerName: 'Manute Bol', team: 'Washington Bullets', printRun: 99 },
      { cardNumber: '4', playerName: 'Kevin McHale', team: 'Boston Celtics', printRun: 99 },
      { cardNumber: '5', playerName: 'Danny Ainge', team: 'Boston Celtics', printRun: 99 },
      { cardNumber: '6', playerName: 'Yao Ming', team: 'Houston Rockets', printRun: 99 },
      { cardNumber: '7', playerName: 'Kobe Bryant', team: 'Los Angeles Lakers', printRun: 149 },
      { cardNumber: '8', playerName: 'Shaquille O\'Neal', team: 'Los Angeles Lakers', printRun: 149 },
      { cardNumber: '9', playerName: 'Christian Laettner', team: 'Minnesota Timberwolves', printRun: 149 },
      { cardNumber: '10', playerName: 'Tim Duncan', team: 'San Antonio Spurs', printRun: 149 },
      { cardNumber: '11', playerName: 'Stephen Curry', team: 'Golden State Warriors', printRun: 149 },
      { cardNumber: '12', playerName: 'LeBron James', team: 'Cleveland Cavaliers', printRun: 149 },
      { cardNumber: '14', playerName: 'Chris Paul', team: 'Los Angeles Clippers', printRun: 149 },
      { cardNumber: '16', playerName: 'Steve Nash', team: 'Phoenix Suns', printRun: 90 },
      { cardNumber: '17', playerName: 'Xavier McDaniel', team: 'Phoenix Suns', printRun: 149 },
      { cardNumber: '18', playerName: 'Detlef Schrempf', team: 'Seattle Supersonics', printRun: 149 },
      { cardNumber: '19', playerName: 'James Harden', team: 'Houston Rockets', printRun: 149 },
      { cardNumber: '20', playerName: 'Joe Johnson', team: 'Utah Jazz', printRun: 149 },
      { cardNumber: '21', playerName: 'Andrei Kirilenko', team: 'Utah Jazz', printRun: 99 },
      { cardNumber: '22', playerName: 'Manu Ginobili', team: 'San Antonio Spurs', printRun: 149 },
      { cardNumber: '23', playerName: 'Walter Davis', team: 'Phoenix Suns', printRun: 149 },
      { cardNumber: '24', playerName: 'Bill Walton', team: 'San Diego Clippers', printRun: 49 },
      { cardNumber: '25', playerName: 'Nate Thurmond', team: 'Golden State Warriors', printRun: 49 },
      { cardNumber: '26', playerName: 'Paul Pierce', team: 'Los Angeles Clippers', printRun: 149 },
      { cardNumber: '27', playerName: 'Rashard Lewis', team: 'Miami Heat', printRun: 149 },
      { cardNumber: '28', playerName: 'Rik Smits', team: 'Indiana Pacers', printRun: 149 },
      { cardNumber: '29', playerName: 'Robert Parish', team: 'Boston Celtics', printRun: 149 },
      { cardNumber: '30', playerName: 'Reggie Lewis', team: 'Boston Celtics', printRun: 149 },
      { cardNumber: '31', playerName: 'Mitch Richmond', team: 'Washington Wizards', printRun: 149 },
      { cardNumber: '32', playerName: 'Kevin Duckworth', team: 'Portland Trail Blazers', printRun: 149 },
      { cardNumber: '33', playerName: 'Glen Rice', team: 'Miami Heat', printRun: 149 },
      { cardNumber: '34', playerName: 'George Mikan', team: 'Minneapolis Lakers', printRun: 49 },
      { cardNumber: '35', playerName: 'Elgin Baylor', team: 'Los Angeles Lakers', printRun: 49 },
      { cardNumber: '36', playerName: 'Dwyane Wade', team: 'Chicago Bulls', printRun: 149 },
      { cardNumber: '37', playerName: 'Derrick Rose', team: 'New York Knicks', printRun: 149 },
      { cardNumber: '38', playerName: 'Chris Bosh', team: 'Miami Heat', printRun: 149 },
      { cardNumber: '39', playerName: 'Walter Berry', team: 'New Jersey Nets', printRun: 149 },
      { cardNumber: '40', playerName: 'Clifford Robinson', team: 'Portland Trail Blazers', printRun: 149 },
    ]
  },

  // Iconic Materials
  {
    setName: 'Iconic Materials',
    setType: 'Memorabilia',
    printRun: null, // Varies by card
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Kobe Bryant', team: 'Los Angeles Lakers', printRun: 149 },
      { cardNumber: '2', playerName: 'Clyde Drexler', team: 'Portland Trail Blazers', printRun: 149 },
      { cardNumber: '3', playerName: 'Hakeem Olajuwon', team: 'Houston Rockets', printRun: 149 },
      { cardNumber: '4', playerName: 'Patrick Ewing', team: 'New York Knicks', printRun: 149 },
      { cardNumber: '5', playerName: 'Shaquille O\'Neal', team: 'Miami Heat', printRun: 149 },
      { cardNumber: '6', playerName: 'Chauncey Billups', team: 'Denver Nuggets', printRun: 149 },
      { cardNumber: '7', playerName: 'Chris Mullin', team: 'Golden State Warriors', printRun: 149 },
      { cardNumber: '8', playerName: 'Dennis Johnson', team: 'Boston Celtics', printRun: 149 },
      { cardNumber: '9', playerName: 'Larry Bird', team: 'Boston Celtics', printRun: 149 },
      { cardNumber: '10', playerName: 'Dikembe Mutombo', team: 'New Jersey Nets', printRun: 149 },
      { cardNumber: '11', playerName: 'Lucius Allen', team: 'Milwaukee Bucks', printRun: 149 },
      { cardNumber: '12', playerName: 'Wilt Chamberlain', team: 'Los Angeles Lakers', printRun: 49 },
      { cardNumber: '13', playerName: 'Karl Malone', team: 'Utah Jazz', printRun: 149 },
      { cardNumber: '14', playerName: 'John Stockton', team: 'Utah Jazz', printRun: 149 },
      { cardNumber: '15', playerName: 'Tom Chambers', team: 'Phoenix Suns', printRun: 149 },
      { cardNumber: '16', playerName: 'Michael Redd', team: 'Milwaukee Bucks', printRun: 149 },
      { cardNumber: '17', playerName: 'Jason Kidd', team: 'New Jersey Nets', printRun: 49 },
      { cardNumber: '18', playerName: 'Magic Johnson', team: 'Los Angeles Lakers', printRun: 149 },
      { cardNumber: '19', playerName: 'Bernard King', team: 'New York Knicks', printRun: 149 },
      { cardNumber: '20', playerName: 'Earl Monroe', team: 'New York Knicks', printRun: 99 },
      { cardNumber: '21', playerName: 'John Starks', team: 'New York Knicks', printRun: 149 },
      { cardNumber: '22', playerName: 'Kelly Tripucka', team: 'Detroit Pistons', printRun: 149 },
      { cardNumber: '23', playerName: 'Jamaal Wilkes', team: 'Los Angeles Lakers', printRun: 149 },
      { cardNumber: '24', playerName: 'James Worthy', team: 'Los Angeles Lakers', printRun: 149 },
      { cardNumber: '25', playerName: 'LeBron James', team: 'Cleveland Cavaliers', printRun: 149 },
      { cardNumber: '26', playerName: 'Kevin Garnett', team: 'Minnesota Timberwolves', printRun: 149 },
      { cardNumber: '27', playerName: 'Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 149 },
      { cardNumber: '28', playerName: 'Tim Duncan', team: 'San Antonio Spurs', printRun: 149 },
      { cardNumber: '29', playerName: 'DeMar DeRozan', team: 'Toronto Raptors', printRun: 149 },
      { cardNumber: '30', playerName: 'Carmelo Anthony', team: 'New York Knicks', printRun: 149 },
    ]
  },

  // Iconic Materials Prime
  {
    setName: 'Iconic Materials Prime',
    setType: 'Memorabilia',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Iconic Materials',
    cards: [
      { cardNumber: '1', playerName: 'Kobe Bryant', team: 'Los Angeles Lakers', printRun: 5 },
      { cardNumber: '2', playerName: 'Clyde Drexler', team: 'Portland Trail Blazers', printRun: 10 },
      { cardNumber: '3', playerName: 'Hakeem Olajuwon', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '4', playerName: 'Patrick Ewing', team: 'New York Knicks', printRun: 10 },
      { cardNumber: '5', playerName: 'Shaquille O\'Neal', team: 'Miami Heat', printRun: 10 },
      { cardNumber: '6', playerName: 'Chauncey Billups', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '7', playerName: 'Chris Mullin', team: 'Golden State Warriors', printRun: 10 },
      { cardNumber: '8', playerName: 'Dennis Johnson', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '9', playerName: 'Larry Bird', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '10', playerName: 'Dikembe Mutombo', team: 'New Jersey Nets', printRun: 10 },
      { cardNumber: '11', playerName: 'Lucius Allen', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '12', playerName: 'Wilt Chamberlain', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '13', playerName: 'Karl Malone', team: 'Utah Jazz', printRun: 10 },
      { cardNumber: '14', playerName: 'John Stockton', team: 'Utah Jazz', printRun: 10 },
      { cardNumber: '15', playerName: 'Tom Chambers', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '16', playerName: 'Michael Redd', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '17', playerName: 'Jason Kidd', team: 'New Jersey Nets', printRun: 10 },
      { cardNumber: '18', playerName: 'Magic Johnson', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '19', playerName: 'Bernard King', team: 'New York Knicks', printRun: 10 },
      { cardNumber: '22', playerName: 'Kelly Tripucka', team: 'Detroit Pistons', printRun: 10 },
      { cardNumber: '23', playerName: 'Jamaal Wilkes', team: 'Los Angeles Lakers', printRun: 8 },
      { cardNumber: '24', playerName: 'James Worthy', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '25', playerName: 'LeBron James', team: 'Cleveland Cavaliers', printRun: 10 },
      { cardNumber: '26', playerName: 'Kevin Garnett', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '27', playerName: 'Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '28', playerName: 'Tim Duncan', team: 'San Antonio Spurs', printRun: 10 },
      { cardNumber: '29', playerName: 'DeMar DeRozan', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '30', playerName: 'Carmelo Anthony', team: 'New York Knicks', printRun: 10 },
    ]
  },

  // NBA Stars Materials
  {
    setName: 'NBA Stars Materials',
    setType: 'Memorabilia',
    printRun: 149,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 149 },
      { cardNumber: '2', playerName: 'Kyrie Irving', team: 'Cleveland Cavaliers', printRun: 149 },
      { cardNumber: '3', playerName: 'Eric Bledsoe', team: 'Phoenix Suns', printRun: 149 },
      { cardNumber: '4', playerName: 'LeBron James', team: 'Cleveland Cavaliers', printRun: 149 },
      { cardNumber: '5', playerName: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 149 },
      { cardNumber: '6', playerName: 'Stephen Curry', team: 'Golden State Warriors', printRun: 149 },
      { cardNumber: '7', playerName: 'DeMar DeRozan', team: 'Toronto Raptors', printRun: 149 },
      { cardNumber: '8', playerName: 'Isaiah Thomas', team: 'Boston Celtics', printRun: 149 },
      { cardNumber: '9', playerName: 'Deron Williams', team: 'Dallas Mavericks', printRun: 149 },
      { cardNumber: '10', playerName: 'James Harden', team: 'Houston Rockets', printRun: 149 },
      { cardNumber: '11', playerName: 'Russell Westbrook', team: 'Oklahoma City Thunder', printRun: 149 },
      { cardNumber: '12', playerName: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 149 },
      { cardNumber: '13', playerName: 'Carmelo Anthony', team: 'New York Knicks', printRun: 149 },
      { cardNumber: '14', playerName: 'Damian Lillard', team: 'Portland Trail Blazers', printRun: 149 },
      { cardNumber: '15', playerName: 'John Wall', team: 'Washington Wizards', printRun: 149 },
      { cardNumber: '16', playerName: 'Anthony Davis', team: 'New Orleans Pelicans', printRun: 149 },
      { cardNumber: '17', playerName: 'Blake Griffin', team: 'Los Angeles Clippers', printRun: 149 },
      { cardNumber: '18', playerName: 'Kevin Garnett', team: 'Minnesota Timberwolves', printRun: 149 },
      { cardNumber: '19', playerName: 'Jabari Parker', team: 'Milwaukee Bucks', printRun: 149 },
      { cardNumber: '20', playerName: 'Jimmy Butler', team: 'Chicago Bulls', printRun: 149 },
      { cardNumber: '21', playerName: 'Paul George', team: 'Indiana Pacers', printRun: 149 },
      { cardNumber: '22', playerName: 'Gordon Hayward', team: 'Utah Jazz', printRun: 149 },
      { cardNumber: '23', playerName: 'DeMarcus Cousins', team: 'Sacramento Kings', printRun: 149 },
      { cardNumber: '24', playerName: 'Draymond Green', team: 'Golden State Warriors', printRun: 149 },
      { cardNumber: '25', playerName: 'Brandon Knight', team: 'Phoenix Suns', printRun: 149 },
      { cardNumber: '26', playerName: 'Kenneth Faried', team: 'Denver Nuggets', printRun: 149 },
      { cardNumber: '27', playerName: 'Myles Turner', team: 'Indiana Pacers', printRun: 149 },
      { cardNumber: '28', playerName: 'Dwight Howard', team: 'Atlanta Hawks', printRun: 149 },
      { cardNumber: '29', playerName: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', printRun: 149 },
      { cardNumber: '30', playerName: 'Nerlens Noel', team: 'Philadelphia 76ers', printRun: 149 },
    ]
  },

  // NBA Star Materials Prime
  {
    setName: 'NBA Star Materials Prime',
    setType: 'Memorabilia',
    printRun: 10,
    isParallel: true,
    baseSetName: 'NBA Stars Materials',
    cards: [
      { cardNumber: '1', playerName: 'Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '2', playerName: 'Kyrie Irving', team: 'Cleveland Cavaliers', printRun: 10 },
      { cardNumber: '3', playerName: 'Eric Bledsoe', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '4', playerName: 'LeBron James', team: 'Cleveland Cavaliers', printRun: 10 },
      { cardNumber: '5', playerName: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '6', playerName: 'Stephen Curry', team: 'Golden State Warriors', printRun: 10 },
      { cardNumber: '7', playerName: 'DeMar DeRozan', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '8', playerName: 'Isaiah Thomas', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '9', playerName: 'Deron Williams', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '10', playerName: 'James Harden', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '11', playerName: 'Russell Westbrook', team: 'Oklahoma City Thunder', printRun: 10 },
      { cardNumber: '12', playerName: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '13', playerName: 'Carmelo Anthony', team: 'New York Knicks', printRun: 10 },
      { cardNumber: '14', playerName: 'Damian Lillard', team: 'Portland Trail Blazers', printRun: 10 },
      { cardNumber: '15', playerName: 'John Wall', team: 'Washington Wizards', printRun: 10 },
      { cardNumber: '16', playerName: 'Anthony Davis', team: 'New Orleans Pelicans', printRun: 10 },
      { cardNumber: '17', playerName: 'Blake Griffin', team: 'Los Angeles Clippers', printRun: 10 },
      { cardNumber: '18', playerName: 'Kevin Garnett', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '19', playerName: 'Jabari Parker', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '20', playerName: 'Jimmy Butler', team: 'Chicago Bulls', printRun: 10 },
      { cardNumber: '21', playerName: 'Paul George', team: 'Indiana Pacers', printRun: 10 },
      { cardNumber: '22', playerName: 'Gordon Hayward', team: 'Utah Jazz', printRun: 10 },
      { cardNumber: '23', playerName: 'DeMarcus Cousins', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '24', playerName: 'Draymond Green', team: 'Golden State Warriors', printRun: 10 },
      { cardNumber: '25', playerName: 'Brandon Knight', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '26', playerName: 'Kenneth Faried', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '27', playerName: 'Myles Turner', team: 'Indiana Pacers', printRun: 10 },
      { cardNumber: '29', playerName: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '30', playerName: 'Nerlens Noel', team: 'Philadelphia 76ers', printRun: 10 },
    ]
  },

  // Team Quads
  {
    setName: 'Team Quads',
    setType: 'Memorabilia',
    printRun: 25,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Zach LaVine/Andrew Wiggins/Karl-Anthony Towns/Kevin Garnett', team: 'Minnesota Timberwolves', printRun: 25 },
      { cardNumber: '2', playerName: 'Kyrie Irving/Tristan Thompson/Kevin Love/LeBron James', team: 'Cleveland Cavaliers', printRun: 25 },
      { cardNumber: '3', playerName: 'Emmanuel Mudiay/Kenneth Faried/Nikola Jokic/Jusuf Nurkic', team: 'Denver Nuggets', printRun: 25 },
      { cardNumber: '4', playerName: 'Deron Williams/Dirk Nowitzki/Justin Anderson/Wesley Matthews', team: 'Dallas Mavericks', printRun: 25 },
      { cardNumber: '5', playerName: 'Avery Bradley/Marcus Smart/Isaiah Thomas/Jae Crowder', team: 'Boston Celtics', printRun: 25 },
    ]
  },

  // Team Quads Prime
  {
    setName: 'Team Quads Prime',
    setType: 'Memorabilia',
    printRun: 5,
    isParallel: true,
    baseSetName: 'Team Quads',
    cards: [
      { cardNumber: '1', playerName: 'Zach LaVine/Andrew Wiggins/Karl-Anthony Towns/Kevin Garnett', team: 'Minnesota Timberwolves', printRun: 5 },
      { cardNumber: '2', playerName: 'Kyrie Irving/Tristan Thompson/Kevin Love/LeBron James', team: 'Cleveland Cavaliers', printRun: 5 },
      { cardNumber: '3', playerName: 'Emmanuel Mudiay/Kenneth Faried/Nikola Jokic/Jusuf Nurkic', team: 'Denver Nuggets', printRun: 5 },
      { cardNumber: '4', playerName: 'Deron Williams/Dirk Nowitzki/Justin Anderson/Wesley Matthews', team: 'Dallas Mavericks', printRun: 5 },
      { cardNumber: '5', playerName: 'Avery Bradley/Marcus Smart/Isaiah Thomas/Jae Crowder', team: 'Boston Celtics', printRun: 5 },
    ]
  },

  // Team Tandems
  {
    setName: 'Team Tandems',
    setType: 'Memorabilia',
    printRun: 149,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Stephen Curry/Klay Thompson', team: 'Golden State Warriors', printRun: 149 },
      { cardNumber: '2', playerName: 'Paul Millsap/Dennis Schroder', team: 'Atlanta Hawks', printRun: 149 },
      { cardNumber: '3', playerName: 'Kristaps Porzingis/Carmelo Anthony', team: 'New York Knicks', printRun: 149 },
      { cardNumber: '4', playerName: 'Tyreke Evans/Anthony Davis', team: 'New Orleans Pelicans', printRun: 149 },
      { cardNumber: '5', playerName: 'Enes Kanter/Steven Adams', team: 'Oklahoma City Thunder', printRun: 149 },
      { cardNumber: '6', playerName: 'Aaron Gordon/Elfrid Payton', team: 'Orlando Magic', printRun: 149 },
      { cardNumber: '7', playerName: 'Blake Griffin/DeAndre Jordan', team: 'Los Angeles Clippers', printRun: 149 },
      { cardNumber: '8', playerName: 'D\'Angelo Russell/Julius Randle', team: 'Los Angeles Lakers', printRun: 149 },
      { cardNumber: '9', playerName: 'Mike Conley/Zach Randolph', team: 'Memphis Grizzlies', printRun: 149 },
      { cardNumber: '10', playerName: 'Zach LaVine/Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 149 },
      { cardNumber: '11', playerName: 'Kyle Lowry/DeMar DeRozan', team: 'Toronto Raptors', printRun: 149 },
      { cardNumber: '12', playerName: 'Bojan Bogdanovic/Brook Lopez', team: 'Brooklyn Nets', printRun: 149 },
      { cardNumber: '13', playerName: 'John Wall/Marcin Gortat', team: 'Washington Wizards', printRun: 149 },
      { cardNumber: '14', playerName: 'Clyde Drexler/Hakeem Olajuwon', team: 'Houston Rockets', printRun: 149 },
      { cardNumber: '15', playerName: 'Kobe Bryant/Shaquille O\'Neal', team: 'Los Angeles Lakers', printRun: 149 },
      { cardNumber: '16', playerName: 'Isiah Thomas/Joe Dumars', team: 'Detroit Pistons', printRun: 149 },
      { cardNumber: '17', playerName: 'Robert Parish/Scottie Pippen', team: 'Chicago Bulls', printRun: 149 },
      { cardNumber: '18', playerName: 'Larry Johnson/Alonzo Mourning', team: 'Charlotte Hornets', printRun: 149 },
      { cardNumber: '19', playerName: 'Jason Kidd/Jim Jackson', team: 'Dallas Mavericks', printRun: 149 },
    ]
  },

  // Team Tandems Prime
  {
    setName: 'Team Tandems Prime',
    setType: 'Memorabilia',
    printRun: 25,
    isParallel: true,
    baseSetName: 'Team Tandems',
    cards: [
      { cardNumber: '1', playerName: 'Stephen Curry/Klay Thompson', team: 'Golden State Warriors', printRun: 25 },
      { cardNumber: '2', playerName: 'Paul Millsap/Dennis Schroder', team: 'Atlanta Hawks', printRun: 25 },
      { cardNumber: '3', playerName: 'Kristaps Porzingis/Carmelo Anthony', team: 'New York Knicks', printRun: 25 },
      { cardNumber: '4', playerName: 'Tyreke Evans/Anthony Davis', team: 'New Orleans Pelicans', printRun: 25 },
      { cardNumber: '5', playerName: 'Enes Kanter/Steven Adams', team: 'Oklahoma City Thunder', printRun: 25 },
      { cardNumber: '6', playerName: 'Aaron Gordon/Elfrid Payton', team: 'Orlando Magic', printRun: 25 },
      { cardNumber: '7', playerName: 'Blake Griffin/DeAndre Jordan', team: 'Los Angeles Clippers', printRun: 25 },
      { cardNumber: '8', playerName: 'D\'Angelo Russell/Julius Randle', team: 'Los Angeles Lakers', printRun: 25 },
      { cardNumber: '9', playerName: 'Mike Conley/Zach Randolph', team: 'Memphis Grizzlies', printRun: 25 },
      { cardNumber: '10', playerName: 'Zach LaVine/Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 25 },
      { cardNumber: '11', playerName: 'Kyle Lowry/DeMar DeRozan', team: 'Toronto Raptors', printRun: 25 },
      { cardNumber: '12', playerName: 'Bojan Bogdanovic/Brook Lopez', team: 'Brooklyn Nets', printRun: 25 },
      { cardNumber: '13', playerName: 'John Wall/Marcin Gortat', team: 'Washington Wizards', printRun: 25 },
      { cardNumber: '14', playerName: 'Clyde Drexler/Hakeem Olajuwon', team: 'Houston Rockets', printRun: 25 },
      { cardNumber: '15', playerName: 'Kobe Bryant/Shaquille O\'Neal', team: 'Los Angeles Lakers', printRun: 25 },
      { cardNumber: '16', playerName: 'Isiah Thomas/Joe Dumars', team: 'Detroit Pistons', printRun: 25 },
      { cardNumber: '17', playerName: 'Robert Parish/Scottie Pippen', team: 'Chicago Bulls', printRun: 25 },
      { cardNumber: '18', playerName: 'Larry Johnson/Alonzo Mourning', team: 'Charlotte Hornets', printRun: 25 },
      { cardNumber: '19', playerName: 'Jason Kidd/Jim Jackson', team: 'Dallas Mavericks', printRun: 25 },
    ]
  },

  // Team Trios
  {
    setName: 'Team Trios',
    setType: 'Memorabilia',
    printRun: 49,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Karl-Anthony Towns/Zach LaVine/Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 49 },
      { cardNumber: '2', playerName: 'Kevin Love/Kyrie Irving/LeBron James', team: 'Cleveland Cavaliers', printRun: 49 },
      { cardNumber: '3', playerName: 'Emmanuel Mudiay/Kenneth Faried/Nikola Jokic', team: 'Denver Nuggets', printRun: 49 },
      { cardNumber: '4', playerName: 'Deron Williams/Justin Anderson/Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 49 },
      { cardNumber: '5', playerName: 'Avery Bradley/Isaiah Thomas/Jae Crowder', team: 'Boston Celtics', printRun: 49 },
      { cardNumber: '6', playerName: 'Corey Brewer/James Harden/Clint Capela', team: 'Houston Rockets', printRun: 49 },
      { cardNumber: '7', playerName: 'Monta Ellis/Myles Turner/Paul George', team: 'Indiana Pacers', printRun: 49 },
      { cardNumber: '8', playerName: 'Blake Griffin/DeAndre Jordan/Chris Paul', team: 'Los Angeles Clippers', printRun: 49 },
      { cardNumber: '9', playerName: 'Kentavious Caldwell-Pope/Andre Drummond/Reggie Jackson', team: 'Detroit Pistons', printRun: 49 },
      { cardNumber: '10', playerName: 'Michael Carter-Williams/Giannis Antetokounmpo/Greg Monroe', team: 'Milwaukee Bucks', printRun: 49 },
    ]
  },

  // Team Trios Prime
  {
    setName: 'Team Trios Prime',
    setType: 'Memorabilia',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Team Trios',
    cards: [
      { cardNumber: '1', playerName: 'Karl-Anthony Towns/Zach LaVine/Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '2', playerName: 'Kevin Love/Kyrie Irving/LeBron James', team: 'Cleveland Cavaliers', printRun: 10 },
      { cardNumber: '3', playerName: 'Emmanuel Mudiay/Kenneth Faried/Nikola Jokic', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '4', playerName: 'Deron Williams/Justin Anderson/Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '5', playerName: 'Avery Bradley/Isaiah Thomas/Jae Crowder', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '6', playerName: 'Corey Brewer/James Harden/Clint Capela', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '7', playerName: 'Monta Ellis/Myles Turner/Paul George', team: 'Indiana Pacers', printRun: 10 },
      { cardNumber: '8', playerName: 'Blake Griffin/DeAndre Jordan/Chris Paul', team: 'Los Angeles Clippers', printRun: 10 },
      { cardNumber: '10', playerName: 'Michael Carter-Williams/Giannis Antetokounmpo/Greg Monroe', team: 'Milwaukee Bucks', printRun: 10 },
    ]
  },
];

async function importMemorabiliapart3() {
  try {
    console.log('Starting 2016-17 Panini Absolute Basketball Memorabilia import (Part 3 - Final)...\n');

    const releaseSlug = '2016-17-panini-absolute-basketball';
    const release = await prisma.release.findUnique({
      where: { slug: releaseSlug },
      include: { manufacturer: true }
    });

    if (!release) {
      throw new Error(`Release not found: ${releaseSlug}`);
    }

    console.log(`Found release: ${release.name} (${release.id})\n`);

    let setCount = 0;
    let cardCount = 0;

    for (const setData of memorabiliaSets) {
      console.log(`Processing: ${setData.setName} (${setData.cards.length} cards)`);
      console.log(`  Type: ${setData.setType}`);
      console.log(`  Is Parallel: ${setData.isParallel}`);
      console.log(`  Print Run: ${setData.printRun || 'Varies'}`);

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

      const existingSet = await prisma.set.findUnique({ where: { slug } });

      if (existingSet) {
        console.log(`  ⚠️  Set already exists, skipping...\n`);
        continue;
      }

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
    console.log(`Successfully imported ${setCount} memorabilia sets and ${cardCount} cards (Part 3 - FINAL)`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importMemorabiliapart3();
