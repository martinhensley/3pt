import { PrismaClient } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';

const prisma = new PrismaClient();

type SetType = 'Autograph';

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

// Autograph sets data extracted from the checklist
const autographSets: SetData[] = [
  // Draft Day Ink
  {
    setName: 'Draft Day Ink',
    setType: 'Autograph',
    printRun: 25,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 25 },
      { cardNumber: '2', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 25 },
      { cardNumber: '3', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 25 },
      { cardNumber: '4', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 25 },
      { cardNumber: '5', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 25 },
      { cardNumber: '6', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 25 },
      { cardNumber: '7', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 25 },
      { cardNumber: '8', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 25 },
      { cardNumber: '9', playerName: 'Domantas Sabonis', team: 'Oklahoma City Thunder', printRun: 25 },
      { cardNumber: '10', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 25 },
      { cardNumber: '11', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 25 },
      { cardNumber: '12', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 25 },
      { cardNumber: '13', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 25 },
      { cardNumber: '14', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 25 },
      { cardNumber: '15', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 25 },
    ]
  },

  // Frequent Flyer Material Autographs
  {
    setName: 'Frequent Flyer Material Autographs',
    setType: 'Autograph',
    printRun: 75,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Bobby Portis', team: 'Chicago Bulls', printRun: 75 },
      { cardNumber: '2', playerName: 'Tristan Thompson', team: 'Cleveland Cavaliers', printRun: 75 },
      { cardNumber: '3', playerName: 'Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 75 },
      { cardNumber: '4', playerName: 'Devin Harris', team: 'Dallas Mavericks', printRun: 75 },
      { cardNumber: '5', playerName: 'Reggie Jackson', team: 'Detroit Pistons', printRun: 75 },
      { cardNumber: '6', playerName: 'Justise Winslow', team: 'Miami Heat', printRun: 75 },
      { cardNumber: '7', playerName: 'Zach LaVine', team: 'Minnesota Timberwolves', printRun: 75 },
      { cardNumber: '8', playerName: 'Carmelo Anthony', team: 'New York Knicks', printRun: 75 },
      { cardNumber: '9', playerName: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '10', playerName: 'Tyler Ennis', team: 'Houston Rockets', printRun: 75 },
      { cardNumber: '12', playerName: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 75 },
      { cardNumber: '13', playerName: 'Aaron Gordon', team: 'Orlando Magic', printRun: 75 },
      { cardNumber: '14', playerName: 'Alex Len', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '15', playerName: 'Archie Goodwin', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '16', playerName: 'C.J. McCollum', team: 'Portland Trail Blazers', printRun: 75 },
      { cardNumber: '17', playerName: 'Jonathon Simmons', team: 'San Antonio Spurs', printRun: 75 },
      { cardNumber: '18', playerName: 'Kent Bazemore', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '20', playerName: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 75 },
    ]
  },

  // Frequent Flyer Material Autographs Prime
  {
    setName: 'Frequent Flyer Material Autographs Prime',
    setType: 'Autograph',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Frequent Flyer Material Autographs',
    cards: [
      { cardNumber: '1', playerName: 'Bobby Portis', team: 'Chicago Bulls', printRun: 10 },
      { cardNumber: '2', playerName: 'Tristan Thompson', team: 'Cleveland Cavaliers', printRun: 10 },
      { cardNumber: '3', playerName: 'Dirk Nowitzki', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '4', playerName: 'Devin Harris', team: 'Dallas Mavericks', printRun: 10 },
      { cardNumber: '5', playerName: 'Reggie Jackson', team: 'Detroit Pistons', printRun: 5 },
      { cardNumber: '6', playerName: 'Justise Winslow', team: 'Miami Heat', printRun: 10 },
      { cardNumber: '7', playerName: 'Zach LaVine', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '8', playerName: 'Carmelo Anthony', team: 'New York Knicks', printRun: 10 },
      { cardNumber: '9', playerName: 'Jordan Clarkson', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '12', playerName: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '13', playerName: 'Aaron Gordon', team: 'Orlando Magic', printRun: 10 },
      { cardNumber: '14', playerName: 'Alex Len', team: 'Phoenix Suns', printRun: 5 },
      { cardNumber: '15', playerName: 'Archie Goodwin', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '16', playerName: 'C.J. McCollum', team: 'Portland Trail Blazers', printRun: 10 },
      { cardNumber: '17', playerName: 'Jonathon Simmons', team: 'San Antonio Spurs', printRun: 10 },
      { cardNumber: '18', playerName: 'Kent Bazemore', team: 'Atlanta Hawks', printRun: 10 },
      { cardNumber: '20', playerName: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 10 },
    ]
  },

  // Freshman Flyer Jersey Autographs
  {
    setName: 'Freshman Flyer Jersey Autographs',
    setType: 'Autograph',
    printRun: 75,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '2', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 75 },
      { cardNumber: '3', playerName: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: 75 },
      { cardNumber: '4', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '5', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 75 },
      { cardNumber: '6', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 75 },
      { cardNumber: '7', playerName: 'Patrick McCaw', team: 'Golden State Warriors', printRun: 75 },
      { cardNumber: '8', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '9', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '10', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 75 },
      { cardNumber: '11', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '12', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 75 },
      { cardNumber: '13', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 75 },
      { cardNumber: '14', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 75 },
      { cardNumber: '15', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 75 },
      { cardNumber: '16', playerName: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: 75 },
      { cardNumber: '17', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '18', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 75 },
      { cardNumber: '19', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '20', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 75 },
      { cardNumber: '21', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '22', playerName: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: 75 },
      { cardNumber: '23', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 75 },
      { cardNumber: '24', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 75 },
      { cardNumber: '25', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 75 },
      { cardNumber: '26', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 75 },
      { cardNumber: '27', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 75 },
      { cardNumber: '28', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '29', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 75 },
      { cardNumber: '30', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 75 },
      { cardNumber: '31', playerName: 'Gary Payton II', team: 'Houston Rockets', printRun: 75 },
      { cardNumber: '32', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 75 },
      { cardNumber: '33', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 75 },
      { cardNumber: '34', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 75 },
      { cardNumber: '35', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun: 75 },
      { cardNumber: '36', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '37', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun: 75 },
      { cardNumber: '38', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun: 75 },
    ]
  },

  // Freshman Flyer Jersey Autographs Prime
  {
    setName: 'Freshman Flyer Jersey Autographs Prime',
    setType: 'Autograph',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Freshman Flyer Jersey Autographs',
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '2', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 10 },
      { cardNumber: '3', playerName: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: 10 },
      { cardNumber: '4', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '5', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '6', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 10 },
      { cardNumber: '7', playerName: 'Patrick McCaw', team: 'Golden State Warriors', printRun: 10 },
      { cardNumber: '8', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '9', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '10', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '11', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 10 },
      { cardNumber: '12', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 10 },
      { cardNumber: '13', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '14', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 10 },
      { cardNumber: '15', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '16', playerName: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: 10 },
      { cardNumber: '17', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '18', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 10 },
      { cardNumber: '19', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '20', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 10 },
      { cardNumber: '21', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '22', playerName: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '23', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '24', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '25', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 10 },
      { cardNumber: '26', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '27', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '28', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 10 },
      { cardNumber: '29', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 10 },
      { cardNumber: '30', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 10 },
      { cardNumber: '31', playerName: 'Gary Payton II', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '32', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 10 },
      { cardNumber: '33', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 10 },
      { cardNumber: '34', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 10 },
      { cardNumber: '35', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '36', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '37', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '38', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun: 10 },
    ]
  },

  // Heroes Autographs
  {
    setName: 'Heroes Autographs',
    setType: 'Autograph',
    printRun: null, // Varies by card
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '3', playerName: 'Kevin Durant', team: 'Golden State Warriors', printRun: 60 },
      { cardNumber: '4', playerName: 'Blake Griffin', team: 'Los Angeles Clippers', printRun: 60 },
      { cardNumber: '5', playerName: 'Elfrid Payton', team: 'Orlando Magic', printRun: 75 },
      { cardNumber: '6', playerName: 'Kevin Love', team: 'Cleveland Cavaliers', printRun: 60 },
      { cardNumber: '7', playerName: 'D\'Angelo Russell', team: 'Los Angeles Lakers', printRun: 60 },
      { cardNumber: '8', playerName: 'Chris Paul', team: 'Los Angeles Clippers', printRun: 60 },
      { cardNumber: '9', playerName: 'Devin Booker', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '10', playerName: 'Bobby Portis', team: 'Chicago Bulls', printRun: 75 },
      { cardNumber: '11', playerName: 'Jabari Parker', team: 'Milwaukee Bucks', printRun: 60 },
      { cardNumber: '12', playerName: 'Myles Turner', team: 'Indiana Pacers', printRun: 75 },
      { cardNumber: '13', playerName: 'Anthony Davis', team: 'New Orleans Pelicans', printRun: 60 },
      { cardNumber: '14', playerName: 'Victor Oladipo', team: 'Oklahoma City Thunder', printRun: 75 },
      { cardNumber: '15', playerName: 'Reggie Jackson', team: 'Detroit Pistons', printRun: 75 },
      { cardNumber: '16', playerName: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 60 },
      { cardNumber: '17', playerName: 'Julius Randle', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '18', playerName: 'Tony Parker', team: 'San Antonio Spurs', printRun: 60 },
      { cardNumber: '19', playerName: 'Paul Millsap', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '21', playerName: 'Eric Bledsoe', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '22', playerName: 'LaMarcus Aldridge', team: 'San Antonio Spurs', printRun: 75 },
      { cardNumber: '23', playerName: 'Chris Bosh', team: 'Miami Heat', printRun: 60 },
      { cardNumber: '24', playerName: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', printRun: 60 },
      { cardNumber: '25', playerName: 'Kristaps Porzingis', team: 'New York Knicks', printRun: 75 },
      { cardNumber: '26', playerName: 'Jahlil Okafor', team: 'Philadelphia 76ers', printRun: 60 },
      { cardNumber: '27', playerName: 'Draymond Green', team: 'Golden State Warriors', printRun: 75 },
      { cardNumber: '28', playerName: 'Dwyane Wade', team: 'Chicago Bulls', printRun: 60 },
      { cardNumber: '29', playerName: 'Emmanuel Mudiay', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '30', playerName: 'Carmelo Anthony', team: 'New York Knicks', printRun: 60 },
    ]
  },

  // Iconic Autographs
  {
    setName: 'Iconic Autographs',
    setType: 'Autograph',
    printRun: null, // Varies by card
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Jason Kidd', team: 'New Jersey Nets', printRun: 60 },
      { cardNumber: '2', playerName: 'Danny Manning', team: 'Los Angeles Clippers', printRun: 75 },
      { cardNumber: '3', playerName: 'Isiah Thomas', team: 'Detroit Pistons', printRun: 75 },
      { cardNumber: '4', playerName: 'Ray Allen', team: 'Seattle Supersonics', printRun: 60 },
      { cardNumber: '5', playerName: 'Robert Parish', team: 'Boston Celtics', printRun: 75 },
      { cardNumber: '6', playerName: 'Gary Payton', team: 'Seattle Supersonics', printRun: 60 },
      { cardNumber: '7', playerName: 'Jalen Rose', team: 'Indiana Pacers', printRun: 75 },
      { cardNumber: '8', playerName: 'Walt Frazier', team: 'New York Knicks', printRun: 75 },
      { cardNumber: '9', playerName: 'A.C. Green', team: 'Dallas Mavericks', printRun: 75 },
      { cardNumber: '10', playerName: 'Cuttino Mobley', team: 'Houston Rockets', printRun: 75 },
      { cardNumber: '11', playerName: 'Hersey Hawkins', team: 'Philadelphia 76ers', printRun: 75 },
      { cardNumber: '12', playerName: 'Glen Rice', team: 'Charlotte Hornets', printRun: 75 },
      { cardNumber: '13', playerName: 'Bob McAdoo', team: 'Buffalo Braves', printRun: 75 },
      { cardNumber: '14', playerName: 'Clyde Drexler', team: 'Portland Trail Blazers', printRun: 60 },
      { cardNumber: '15', playerName: 'Michael Finley', team: 'Dallas Mavericks', printRun: 75 },
      { cardNumber: '16', playerName: 'Mitch Richmond', team: 'Sacramento Kings', printRun: 75 },
      { cardNumber: '17', playerName: 'Joe Dumars', team: 'Detroit Pistons', printRun: 75 },
      { cardNumber: '18', playerName: 'Anfernee Hardaway', team: 'Orlando Magic', printRun: 60 },
      { cardNumber: '19', playerName: 'Bill Walton', team: 'Boston Celtics', printRun: 75 },
      { cardNumber: '20', playerName: 'Dominique Wilkins', team: 'Atlanta Hawks', printRun: 60 },
      { cardNumber: '21', playerName: 'Tracy McGrady', team: 'Toronto Raptors', printRun: 60 },
      { cardNumber: '22', playerName: 'Grant Hill', team: 'Phoenix Suns', printRun: 60 },
      { cardNumber: '24', playerName: 'Steve Nash', team: 'Phoenix Suns', printRun: 60 },
      { cardNumber: '25', playerName: 'Dikembe Mutombo', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '26', playerName: 'Dan Majerle', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '27', playerName: 'Damon Stoudamire', team: 'Toronto Raptors', printRun: 75 },
      { cardNumber: '28', playerName: 'Steve Smith', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '29', playerName: 'Antonio McDyess', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '30', playerName: 'Ralph Sampson', team: 'Houston Rockets', printRun: 75 },
      { cardNumber: '31', playerName: 'Jo Jo White', team: 'Boston Celtics', printRun: 75 },
      { cardNumber: '32', playerName: 'Robert Horry', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '33', playerName: 'Mark Jackson', team: 'New York Knicks', printRun: 75 },
      { cardNumber: '34', playerName: 'John Starks', team: 'New York Knicks', printRun: 75 },
      { cardNumber: '35', playerName: 'Horace Grant', team: 'Chicago Bulls', printRun: 75 },
      { cardNumber: '36', playerName: 'Jeff Hornacek', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '37', playerName: 'Bob Dandridge', team: 'Milwaukee Bucks', printRun: 75 },
      { cardNumber: '38', playerName: 'Magic Johnson', team: 'Los Angeles Lakers', printRun: 60 },
      { cardNumber: '39', playerName: 'Mark Aguirre', team: 'Dallas Mavericks', printRun: 75 },
      { cardNumber: '40', playerName: 'Cedric Maxwell', team: 'Houston Rockets', printRun: 75 },
    ]
  },

  // Marks of Fame
  {
    setName: 'Marks of Fame',
    setType: 'Autograph',
    printRun: null, // Varies by card
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Kobe Bryant', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '2', playerName: 'Kevin Durant', team: 'Golden State Warriors', printRun: 60 },
      { cardNumber: '3', playerName: 'Kyrie Irving', team: 'Cleveland Cavaliers', printRun: 60 },
      { cardNumber: '4', playerName: 'Paul Westphal', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '5', playerName: 'Jeff Hornacek', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '6', playerName: 'Sean Elliott', team: 'San Antonio Spurs', printRun: 75 },
      { cardNumber: '7', playerName: 'Tony Parker', team: 'San Antonio Spurs', printRun: 60 },
      { cardNumber: '8', playerName: 'Chris Bosh', team: 'Miami Heat', printRun: 60 },
      { cardNumber: '9', playerName: 'Dan Issel', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '10', playerName: 'Jamaal Wilkes', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '11', playerName: 'Bernard King', team: 'New York Knicks', printRun: 60 },
      { cardNumber: '12', playerName: 'Adrian Dantley', team: 'Dallas Mavericks', printRun: 75 },
      { cardNumber: '13', playerName: 'Toni Kukoc', team: 'Chicago Bulls', printRun: 75 },
      { cardNumber: '14', playerName: 'Andrew Wiggins', team: 'Minnesota Timberwolves', printRun: 60 },
      { cardNumber: '15', playerName: 'Isiah Thomas', team: 'Detroit Pistons', printRun: 60 },
      { cardNumber: '16', playerName: 'Robert Horry', team: 'San Antonio Spurs', printRun: 60 },
      { cardNumber: '17', playerName: 'Zach LaVine', team: 'Minnesota Timberwolves', printRun: 75 },
      { cardNumber: '18', playerName: 'Robert Parish', team: 'Boston Celtics', printRun: 60 },
      { cardNumber: '19', playerName: 'Dennis Schroder', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '20', playerName: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', printRun: 75 },
      { cardNumber: '21', playerName: 'Nick Van Exel', team: 'Los Angeles Lakers', printRun: 60 },
      { cardNumber: '22', playerName: 'Bill Laimbeer', team: 'Detroit Pistons', printRun: 75 },
      { cardNumber: '23', playerName: 'Bill Russell', team: 'Boston Celtics', printRun: 60 },
      { cardNumber: '24', playerName: 'Jim Jackson', team: 'Dallas Mavericks', printRun: 75 },
      { cardNumber: '25', playerName: 'Mark Price', team: 'Cleveland Cavaliers', printRun: 75 },
      { cardNumber: '26', playerName: 'Evan Turner', team: 'Portland Trail Blazers', printRun: 75 },
      { cardNumber: '27', playerName: 'Kiki Vandeweghe', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '28', playerName: 'David Robinson', team: 'San Antonio Spurs', printRun: 60 },
      { cardNumber: '29', playerName: 'Tim Hardaway', team: 'Golden State Warriors', printRun: 75 },
      { cardNumber: '30', playerName: 'Kurt Rambis', team: 'Los Angeles Lakers', printRun: 75 },
    ]
  },

  // Rookie Autographs
  {
    setName: 'Rookie Autographs',
    setType: 'Autograph',
    printRun: 99,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 99 },
      { cardNumber: '2', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 99 },
      { cardNumber: '3', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 99 },
      { cardNumber: '4', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 99 },
      { cardNumber: '5', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 99 },
      { cardNumber: '6', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 99 },
      { cardNumber: '7', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 99 },
      { cardNumber: '8', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 99 },
      { cardNumber: '9', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 99 },
      { cardNumber: '10', playerName: 'Domantas Sabonis', team: 'Oklahoma City Thunder', printRun: 99 },
      { cardNumber: '11', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 99 },
      { cardNumber: '12', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 99 },
      { cardNumber: '13', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 99 },
      { cardNumber: '14', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 99 },
      { cardNumber: '15', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 99 },
      { cardNumber: '16', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 99 },
      { cardNumber: '17', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 99 },
      { cardNumber: '18', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 99 },
      { cardNumber: '19', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 99 },
      { cardNumber: '20', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 99 },
      { cardNumber: '21', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 99 },
      { cardNumber: '22', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 99 },
      { cardNumber: '23', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 99 },
      { cardNumber: '24', playerName: 'Cheick Diallo', team: 'New Orleans Pelicans', printRun: 99 },
      { cardNumber: '25', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 99 },
      { cardNumber: '26', playerName: 'Patrick McCaw', team: 'Golden State Warriors', printRun: 99 },
      { cardNumber: '27', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 99 },
      { cardNumber: '28', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 99 },
      { cardNumber: '29', playerName: 'Kay Felder', team: 'Cleveland Cavaliers', printRun: 99 },
      { cardNumber: '30', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 99 },
      { cardNumber: '31', playerName: 'Malcolm Brogdon', team: 'Milwaukee Bucks', printRun: 99 },
      { cardNumber: '32', playerName: 'A.J. Hammons', team: 'Dallas Mavericks', printRun: 99 },
      { cardNumber: '33', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 99 },
      { cardNumber: '34', playerName: 'Gary Payton II', team: 'Houston Rockets', printRun: 99 },
      { cardNumber: '35', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 99 },
    ]
  },

  // Tools of the Trade Basketballs Prime Signatures
  {
    setName: 'Tools of the Trade Basketballs Prime Signatures',
    setType: 'Autograph',
    printRun: 15,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 15 },
      { cardNumber: '2', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 15 },
      { cardNumber: '3', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 15 },
      { cardNumber: '4', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 15 },
      { cardNumber: '5', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 15 },
      { cardNumber: '6', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 15 },
      { cardNumber: '8', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 15 },
      { cardNumber: '9', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun: 15 },
      { cardNumber: '11', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 15 },
      { cardNumber: '12', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 15 },
      { cardNumber: '13', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 15 },
      { cardNumber: '14', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 15 },
      { cardNumber: '15', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 15 },
      { cardNumber: '16', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 15 },
      { cardNumber: '17', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 15 },
      { cardNumber: '18', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 15 },
      { cardNumber: '19', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 15 },
      { cardNumber: '20', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 15 },
      { cardNumber: '21', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 15 },
      { cardNumber: '22', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 15 },
      { cardNumber: '23', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 15 },
      { cardNumber: '24', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 15 },
      { cardNumber: '25', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 15 },
      { cardNumber: '26', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 15 },
      { cardNumber: '27', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun: 15 },
      { cardNumber: '28', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 15 },
      { cardNumber: '29', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun: 15 },
      { cardNumber: '30', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 15 },
      { cardNumber: '31', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun: 15 },
      { cardNumber: '32', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 15 },
      { cardNumber: '33', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 15 },
    ]
  },

  // Tools of the Trade Jumbo Rookie Materials Signatures
  {
    setName: 'Tools of the Trade Jumbo Rookie Materials Signatures',
    setType: 'Autograph',
    printRun: 49,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 49 },
      { cardNumber: '2', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 49 },
      { cardNumber: '3', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 49 },
      { cardNumber: '4', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 49 },
      { cardNumber: '5', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 49 },
      { cardNumber: '6', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 49 },
      { cardNumber: '7', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 49 },
      { cardNumber: '8', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 49 },
      { cardNumber: '9', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun: 49 },
      { cardNumber: '10', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 49 },
      { cardNumber: '11', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 49 },
      { cardNumber: '12', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 49 },
      { cardNumber: '13', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 49 },
      { cardNumber: '14', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 49 },
      { cardNumber: '15', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 49 },
      { cardNumber: '16', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 49 },
      { cardNumber: '17', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 49 },
      { cardNumber: '18', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 49 },
      { cardNumber: '19', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 49 },
      { cardNumber: '20', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 49 },
      { cardNumber: '21', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 49 },
      { cardNumber: '22', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 49 },
      { cardNumber: '23', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 49 },
      { cardNumber: '24', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 49 },
      { cardNumber: '25', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 49 },
      { cardNumber: '26', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 49 },
      { cardNumber: '27', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun: 49 },
      { cardNumber: '28', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 49 },
      { cardNumber: '29', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun: 49 },
      { cardNumber: '30', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 49 },
      { cardNumber: '31', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun: 49 },
      { cardNumber: '32', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 49 },
      { cardNumber: '33', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 49 },
    ]
  },

  // Tools of the Trade Jumbo Rookie Materials Signatures Prime
  {
    setName: 'Tools of the Trade Jumbo Rookie Materials Signatures Prime',
    setType: 'Autograph',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Tools of the Trade Jumbo Rookie Materials Signatures',
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '2', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 10 },
      { cardNumber: '3', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 10 },
      { cardNumber: '4', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '5', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 10 },
      { cardNumber: '6', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 10 },
      { cardNumber: '7', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '8', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 10 },
      { cardNumber: '9', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '10', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '11', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '12', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '13', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 10 },
      { cardNumber: '14', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '15', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '16', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '17', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 10 },
      { cardNumber: '18', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 10 },
      { cardNumber: '19', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '20', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '21', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '22', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 10 },
      { cardNumber: '23', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 10 },
      { cardNumber: '24', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '25', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '26', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 10 },
      { cardNumber: '27', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '28', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 10 },
      { cardNumber: '29', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun: 10 },
      { cardNumber: '30', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 10 },
      { cardNumber: '31', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '32', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 10 },
      { cardNumber: '33', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 10 },
    ]
  },

  // Tools of the Trade Rookie Autographed Materials
  {
    setName: 'Tools of the Trade Rookie Autographed Materials',
    setType: 'Autograph',
    printRun: 75,
    isParallel: false,
    baseSetName: null,
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '2', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 75 },
      { cardNumber: '3', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '4', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '5', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 75 },
      { cardNumber: '6', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 75 },
      { cardNumber: '7', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '8', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 75 },
      { cardNumber: '9', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun: 75 },
      { cardNumber: '10', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '11', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 75 },
      { cardNumber: '12', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 75 },
      { cardNumber: '13', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 75 },
      { cardNumber: '14', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 75 },
      { cardNumber: '15', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 75 },
      { cardNumber: '16', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 75 },
      { cardNumber: '17', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 75 },
      { cardNumber: '18', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 75 },
      { cardNumber: '19', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '20', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 75 },
      { cardNumber: '21', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 75 },
      { cardNumber: '22', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 75 },
      { cardNumber: '23', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 75 },
      { cardNumber: '24', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 75 },
      { cardNumber: '25', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 75 },
      { cardNumber: '26', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 75 },
      { cardNumber: '27', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun: 75 },
      { cardNumber: '28', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 75 },
      { cardNumber: '29', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun: 75 },
      { cardNumber: '30', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 75 },
      { cardNumber: '31', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun: 75 },
      { cardNumber: '32', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 75 },
      { cardNumber: '33', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 75 },
    ]
  },

  // Tools of the Trade Rookie Autographed Materials Prime
  {
    setName: 'Tools of the Trade Rookie Autographed Materials Prime',
    setType: 'Autograph',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Tools of the Trade Rookie Autographed Materials',
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '2', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 10 },
      { cardNumber: '3', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 10 },
      { cardNumber: '4', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '5', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 10 },
      { cardNumber: '6', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 10 },
      { cardNumber: '7', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '8', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 10 },
      { cardNumber: '9', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '10', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '11', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '12', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 10 },
      { cardNumber: '13', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 10 },
      { cardNumber: '14', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 10 },
      { cardNumber: '15', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 10 },
      { cardNumber: '16', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '17', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 10 },
      { cardNumber: '18', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 10 },
      { cardNumber: '19', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '20', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 10 },
      { cardNumber: '21', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 10 },
      { cardNumber: '22', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 10 },
      { cardNumber: '23', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 10 },
      { cardNumber: '24', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 10 },
      { cardNumber: '25', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 10 },
      { cardNumber: '26', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 10 },
      { cardNumber: '27', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun: 10 },
      { cardNumber: '28', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 10 },
      { cardNumber: '29', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun: 10 },
      { cardNumber: '30', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 10 },
      { cardNumber: '31', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun: 10 },
      { cardNumber: '32', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 10 },
      { cardNumber: '33', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 10 },
    ]
  },

  // Tools of the Trade Rookie Autographed Materials Tag
  {
    setName: 'Tools of the Trade Rookie Autographed Materials Tag',
    setType: 'Autograph',
    printRun: 1,
    isParallel: true,
    baseSetName: 'Tools of the Trade Rookie Autographed Materials',
    cards: [
      { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun: 1 },
      { cardNumber: '2', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun: 1 },
      { cardNumber: '3', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun: 1 },
      { cardNumber: '4', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun: 1 },
      { cardNumber: '5', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun: 1 },
      { cardNumber: '6', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun: 1 },
      { cardNumber: '7', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun: 1 },
      { cardNumber: '8', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun: 1 },
      { cardNumber: '9', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun: 1 },
      { cardNumber: '10', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun: 1 },
      { cardNumber: '11', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun: 1 },
      { cardNumber: '12', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun: 1 },
      { cardNumber: '13', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun: 1 },
      { cardNumber: '14', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun: 1 },
      { cardNumber: '15', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun: 1 },
      { cardNumber: '16', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun: 1 },
      { cardNumber: '17', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun: 1 },
      { cardNumber: '18', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun: 1 },
      { cardNumber: '19', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun: 1 },
      { cardNumber: '20', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun: 1 },
      { cardNumber: '21', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun: 1 },
      { cardNumber: '22', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun: 1 },
      { cardNumber: '23', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun: 1 },
      { cardNumber: '24', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun: 1 },
      { cardNumber: '25', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun: 1 },
      { cardNumber: '26', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun: 1 },
      { cardNumber: '27', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun: 1 },
      { cardNumber: '28', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun: 1 },
      { cardNumber: '29', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun: 1 },
      { cardNumber: '30', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun: 1 },
      { cardNumber: '31', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun: 1 },
      { cardNumber: '32', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun: 1 },
      { cardNumber: '33', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun: 1 },
    ]
  },
];

async function importAutographs() {
  try {
    console.log('Starting 2016-17 Panini Absolute Basketball Autographs import...\n');

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

    // Process each autograph set
    let setCount = 0;
    let cardCount = 0;

    for (const setData of autographSets) {
      console.log(`Processing: ${setData.setName} (${setData.cards.length} cards)`);
      console.log(`  Type: ${setData.setType}`);
      console.log(`  Is Parallel: ${setData.isParallel}`);
      console.log(`  Base Set: ${setData.baseSetName || 'N/A'}`);
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
              hasAutograph: true,
              hasMemorabilia: setData.setName.includes('Material') || setData.setName.includes('Jersey'),
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
    console.log(`Successfully imported ${setCount} autograph sets and ${cardCount} cards`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importAutographs();
