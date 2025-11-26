/**
 * Fix Gold Standard Basketball Card Numbers
 *
 * The original import used sequential card numbers (1, 2, 3...) because the CSV
 * lacked card numbers. This script corrects them to match the official checklist.
 */

import { prisma } from '@/lib/prisma';

const RELEASE_SLUG = '2016-17-panini-gold-standard-basketball';

// ============================================================================
// OFFSET-BASED SETS (sequential cards starting at wrong number)
// Add offset to current 1-based number: newNumber = currentNumber + offset
// ============================================================================

const OFFSET_SETS: Record<string, number> = {
  // Rookie Jersey Autographs family: 201-238
  'Rookie Jersey Autographs': 200,
  'Rookie Jersey Autographs Prime': 200,
  'Rookie Jersey Autographs Prime Logo Tags': 200,

  // Rookie Jersey Autographs Double family: 239-269
  'Rookie Jersey Autographs Double': 238,
  'Rookie Jersey Autographs Double Prime': 238,
  'Rookie Jersey Autographs Double Prime Tags': 238,

  // Rookie Jersey Autographs Triple family: 270-300
  'Rookie Jersey Autographs Triple': 269,
  'Rookie Jersey Autographs Triple Prime': 269,
  'Rookie Jersey Autographs Triple Prime Tags': 269,

  // Rookie Jersey Autographs Jumbos family: 301-338
  'Rookie Jersey Autographs Jumbos': 300,
  'Rookie Jersey Autographs Jumbos Prime': 300,
  'Rookie Jersey Autographs Jumbos Prime Tags': 300,

  // Golden Debuts: 339-373
  'Golden Debuts': 338,
};

// ============================================================================
// PLAYER-TO-NUMBER MAPPINGS (non-sequential sets)
// ============================================================================

const PLAYER_MAPPINGS: Record<string, Record<string, string>> = {
  // 14K Autographs - 26 cards (missing #9, 22, 24, 28)
  '14K Autographs': {
    'Jimmy Butler': '1',
    'Avery Bradley': '2',
    'Jae Crowder': '3',
    'Dwight Powell': '4',
    'Kyrie Irving': '5',
    'Devin Booker': '6',
    'Kobe Bryant': '7',
    'Kevin Durant': '8',
    'Tom Gugliotta': '10',
    'Tim Hardaway': '11',
    'Cedric Maxwell': '12',
    'John Starks': '13',
    'Robert Horry': '14',
    'Vin Baker': '15',
    'Reggie Jackson': '16',
    'Andrei Kirilenko': '17',
    'Zach LaVine': '18',
    'Clint Capela': '19',
    'Evan Fournier': '20',
    'Evan Turner': '21',
    'Boban Marjanovic': '23',
    'David Robinson': '25',
    'Gary Payton': '26',
    'Sean Elliott': '27',
    'Spud Webb': '29',
    'Jamal Mashburn': '30',
  },

  // AU Autographs - 68 cards (many gaps)
  'AU': {
    'Kevin Durant': '1',
    'Kyrie Irving': '2',
    'Carmelo Anthony': '3',
    'Dwyane Wade': '4',
    'Chris Paul': '5',
    'Mike Conley': '6',
    'Anthony Davis': '7',
    'Andrew Wiggins': '8',
    'Blake Griffin': '9',
    'John Wall': '10',
    'Karl-Anthony Towns': '12',
    'Isiah Thomas': '13',
    'Jimmy Butler': '14',
    'Tony Parker': '16',
    'Klay Thompson': '19',
    'Tobias Harris': '20',
    'Draymond Green': '21',
    'Kristaps Porzingis': '23',
    'Paul Millsap': '24',
    'Brandon Knight': '25',
    'Khris Middleton': '27',
    'Evan Turner': '28',
    'Jae Crowder': '29',
    'Matthew Dellavedova': '30',
    'Michael Carter-Williams': '31',
    'DeMarre Carroll': '33',
    'Nikola Vucevic': '34',
    'Devin Booker': '35',
    'Myles Turner': '36',
    'Marcus Smart': '38',
    'Zach LaVine': '39',
    'Bobby Portis': '41',
    'Cameron Payne': '42',
    'Nemanja Bjelica': '44',
    'Evan Fournier': '45',
    'Trey Lyles': '46',
    "D'Angelo Russell": '47',
    'Clint Capela': '49',
    'Thaddeus Young': '50',
    'Glen Rice': '51',
    'Dikembe Mutombo': '52',
    'Horace Grant': '53',
    'Jo Jo White': '54',
    'Allan Houston': '55',
    'Alvan Adams': '56',
    'Mark Aguirre': '57',
    'A.C. Green': '58',
    'Bill Cartwright': '59',
    'Tom Gugliotta': '60',
    'Tim Hardaway': '61',
    'Cedric Maxwell': '62',
    'Mark Price': '63',
    'Jim Chones': '64',
    'Jamal Mashburn': '65',
    'David Robinson': '66',
    'Ray Allen': '67',
    'Alex English': '68',
    'Dell Curry': '69',
    'Andrei Kirilenko': '70',
    'Robert Horry': '71',
    'Junior Bridgeman': '72',
    'Gary Payton': '73',
    'Toni Kukoc': '74',
    'Patrick Ewing': '75',
    'John Starks': '76',
    'Chauncey Billups': '77',
    'Larry Bird': '78',
    'Magic Johnson': '79',
  },

  // Gold Scripts - 40 cards (sequential 1-40)
  'Gold Scripts': {
    'Latrell Sprewell': '1',
    'Rashad Vaughn': '2',
    'Kobe Bryant': '3',
    'Tom Heinsohn': '4',
    'Scottie Pippen': '5',
    'Adrian Smith': '6',
    'Tom Van Arsdale': '7',
    'Sean Elliott': '8',
    'Seth Curry': '9',
    'Bob Lanier': '10',
    'Jason Terry': '11',
    'Calvin Murphy': '12',
    'George Gervin': '13',
    'Yao Ming': '14',
    'Jusuf Nurkic': '15',
    'Jordan Clarkson': '16',
    'Gail Goodrich': '17',
    'Vince Carter': '18',
    'Mario Chalmers': '19',
    'Brian Grant': '20',
    'Rony Seikaly': '21',
    'Michael Carter-Williams': '22',
    'Junior Bridgeman': '23',
    'Earl Monroe': '24',
    'Robert Covington': '25',
    'Andrew Nicholson': '26',
    'Joel Embiid': '27',
    'T.J. McConnell': '28',
    'Jahlil Okafor': '29',
    'JaKarr Sampson': '30',
    'Dan Issel': '31',
    'David Thompson': '32',
    'Jalen Rose': '33',
    'Spencer Haywood': '34',
    'Kevin McHale': '35',
    'Paul Millsap': '36',
    'Shawn Kemp': '37',
    'Chuck Person': '38',
    'Steve Blake': '39',
    'Jim Chones': '40',
  },

  // Gold Standard Autographs - 19 cards (missing #9, 14)
  'Gold Standard': {
    'Jimmy Butler': '1',
    'Kobe Bryant': '2',
    'Kevin Durant': '3',
    'Kyrie Irving': '4',
    'Andrew Wiggins': '5',
    'Nikola Vucevic': '6',
    'Andrei Kirilenko': '7',
    'Draymond Green': '8',
    'Tobias Harris': '10',
    'Adrian Dantley': '11',
    'Chauncey Billups': '12',
    'Bill Walton': '13',
    'Antonio McDyess': '15',
    'Bill Laimbeer': '16',
    'Jeff Hornacek': '17',
    'Kiki Vandeweghe': '18',
    'Spud Webb': '19',
    'Robert Horry': '20',
    'Jo Jo White': '21',
  },

  // Golden Graphs - 27 cards (missing #3, 12, 17, 18, 20)
  'Golden Graphs': {
    'Jimmy Butler': '1',
    'Tobias Harris': '2',
    'Jonas Valanciunas': '4',
    'Chauncey Billups': '5',
    'Reggie Jackson': '6',
    'Mike Conley': '7',
    'Tyus Jones': '8',
    'Avery Bradley': '9',
    'Gary Harris': '10',
    'Evan Turner': '11',
    'DeMarre Carroll': '13',
    'Kevin Durant': '14',
    'Kyrie Irving': '15',
    'Andrew Wiggins': '16',
    'Rondae Hollis-Jefferson': '19',
    'Nate Archibald': '21',
    'Devin Booker': '22',
    'Jamal Mashburn': '23',
    'David Thompson': '24',
    'Alex English': '25',
    'Bob McAdoo': '26',
    'John Stockton': '27',
    'Dan Issel': '28',
    'Sarunas Marciulionis': '29',
    'Glen Rice': '30',
    'Michael Cooper': '31',
    'Allan Houston': '32',
  },

  // Good as Gold Autographs - 20 cards (sequential 1-20)
  'Good as Gold Autographs': {
    'Brandon Ingram': '1',
    'Juan Hernangomez': '2',
    'Jaylen Brown': '3',
    'Dragan Bender': '4',
    'Cheick Diallo': '5',
    'Kris Dunn': '6',
    'Henry Ellenson': '7',
    'Buddy Hield': '8',
    'Jamal Murray': '9',
    'Malik Beasley': '10',
    'Marquese Chriss': '11',
    "DeAndre' Bembry": '12',
    'Jakob Poeltl': '13',
    'Thon Maker': '14',
    'Timothe Luwawu-Cabarrot': '15',
    'Pascal Siakam': '16',
    'Ivica Zubac': '17',
    'Demetrius Jackson': '18',
    'Malcolm Brogdon': '19',
    'Kay Felder': '20',
  },

  // Mother Lode Autographs - 60 cards (sequential 1-60)
  'Mother Lode': {
    'Kobe Bryant': '1',
    'T.J. McConnell': '2',
    'Scott Skiles': '3',
    'Hollis Thompson': '4',
    'Bobby Jones': '5',
    'Hersey Hawkins': '6',
    'Tom "Satch" Sanders': '7',
    'Anthony Bennett': '8',
    'Scottie Pippen': '9',
    'Toni Kukoc': '10',
    'Reggie Jackson': '11',
    'Terrence Jones': '12',
    'Yao Ming': '13',
    'Vernon Maxwell': '14',
    'Cuttino Mobley': '15',
    'Jordan Clarkson': '16',
    'Jamaal Wilkes': '17',
    'Eddie Jones': '18',
    'Bob Dandridge': '19',
    'Karl-Anthony Towns': '20',
    'Archie Goodwin': '21',
    'C.J. McCollum': '22',
    'Allen Crabbe': '23',
    'Rod Strickland': '24',
    'Vlade Divac': '25',
    'Michael Kidd-Gilchrist': '26',
    'Steve Francis': '27',
    'C.J. Miles': '28',
    'Cedric Maxwell': '29',
    'Glenn Robinson III': '30',
    'Kendall Gill': '31',
    'Tristan Thompson': '32',
    'Mike Bibby': '33',
    'Latrell Sprewell': '34',
    'Mario Elie': '35',
    'Herb Williams': '36',
    'James Ennis': '37',
    'Chauncey Billups': '38',
    'Dennis Scott': '39',
    'Nick Anderson': '40',
    'Shawn Kemp': '41',
    'Norman Powell': '42',
    'Dante Exum': '43',
    'Thabo Sefolosha': '44',
    'Steve Smith': '45',
    'Spud Webb': '46',
    'Kent Bazemore': '47',
    'Glen Rice': '48',
    'Junior Bridgeman': '49',
    'Johnny Newman': '50',
    'Dick Barnett': '51',
    'Brian Grant': '52',
    'Gail Goodrich': '53',
    'Sidney Moncrief': '54',
    'Spencer Haywood': '55',
    'Michael Carter-Williams': '56',
    'Cazzie Russell': '57',
    'Kiki Vandeweghe': '58',
    'Tony Snell': '59',
    'Frank Ramsey': '60',
  },

  // Bullion Brand Logo Tag - 65 cards (sequential 1-65)
  'Bullion Brand Logo Tag': {
    'Aaron Gordon': '1',
    'Al Horford': '2',
    'Al Jefferson': '3',
    'Al-Farouq Aminu': '4',
    'Alec Burks': '5',
    'Andre Drummond': '6',
    'Andre Iguodala': '7',
    'Andre Roberson': '8',
    'Andrew Bogut': '9',
    'Andrew Wiggins': '10',
    'Anthony Davis': '11',
    'Arron Afflalo': '12',
    'Avery Bradley': '13',
    'Blake Griffin': '14',
    'Bobby Portis': '15',
    'Bradley Beal': '16',
    'Brandon Knight': '17',
    'Brook Lopez': '18',
    'C.J. McCollum': '19',
    'Carmelo Anthony': '20',
    'Chandler Parsons': '21',
    "D'Angelo Russell": '22',
    'Damian Lillard': '23',
    'DeAndre Jordan': '24',
    'DeMar DeRozan': '25',
    'DeMarcus Cousins': '26',
    'DeMarre Carroll': '27',
    'Dennis Schroder': '28',
    'Derrick Rose': '29',
    'Deron Williams': '30',
    'Devin Booker': '31',
    'Doug McDermott': '32',
    'Draymond Green': '33',
    'Dwight Howard': '34',
    'Dwyane Wade': '35',
    'Elfrid Payton': '36',
    'Emmanuel Mudiay': '37',
    'Eric Bledsoe': '38',
    'George Hill': '39',
    'Giannis Antetokounmpo': '40',
    'Goran Dragic': '41',
    'Harrison Barnes': '42',
    'Hassan Whiteside': '43',
    'Jabari Parker': '44',
    'James Harden': '45',
    'Jeff Teague': '46',
    'Jeremy Lin': '47',
    'Jimmy Butler': '48',
    'Jordan Clarkson': '49',
    'Julius Randle': '50',
    'Karl-Anthony Towns': '51',
    'Kawhi Leonard': '52',
    'Kevin Garnett': '53',
    'Kevin Love': '54',
    'Kristaps Porzingis': '55',
    'Kyrie Irving': '56',
    'LeBron James': '57',
    'Pau Gasol': '58',
    'Reggie Jackson': '59',
    'Russell Westbrook': '60',
    'Stephen Curry': '61',
    'Zach LaVine': '62',
    'Zach Randolph': '63',
    'Ryan Anderson': '64',
    'Paul Millsap': '65',
  },

  // Bullion Brand Logo Tag Rookies - 35 cards (sequential 1-35)
  'Bullion Brand Logo Tag Rookies': {
    'Brandon Ingram': '1',
    'Jaylen Brown': '2',
    'Dragan Bender': '3',
    'Kris Dunn': '4',
    'Buddy Hield': '5',
    'Jamal Murray': '6',
    'Marquese Chriss': '7',
    'Jakob Poeltl': '8',
    'Thon Maker': '9',
    'Domantas Sabonis': '10',
    'Taurean Prince': '11',
    'Georgios Papagiannis': '12',
    'Denzel Valentine': '13',
    'Juan Hernangomez': '14',
    'Wade Baldwin IV': '15',
    'Henry Ellenson': '16',
    'Malik Beasley': '17',
    'Caris LeVert': '18',
    "DeAndre' Bembry": '19',
    'Malachi Richardson': '20',
    'Timothe Luwawu-Cabarrot': '21',
    'Brice Johnson': '22',
    'Pascal Siakam': '23',
    'Skal Labissiere': '24',
    'Dejounte Murray': '25',
    'Damian Jones': '26',
    'Deyonta Davis': '27',
    'Ivica Zubac': '28',
    'Cheick Diallo': '29',
    'Tyler Ulis': '30',
    'Malcolm Brogdon': '31',
    'Chinanu Onuaku': '32',
    'Gary Payton II': '33',
    'Isaiah Whitehead': '34',
    'Kay Felder': '35',
  },

  // Golden Threads Jumbos - 10 cards (sequential 1-10)
  'Golden Jumbos Threads': {
    'Tim Duncan': '1',
    'Grant Hill': '2',
    'Michael Redd': '3',
    "Shaquille O'Neal": '4',
    'Patrick Ewing': '5',
    'Andrei Kirilenko': '6',
    'Hakeem Olajuwon': '7',
    'Scottie Pippen': '8',
    'Richard Hamilton': '9',
    'Larry Bird': '10',
  },

  // Golden Threads Jumbos Black - 10 cards (sequential 1-10)
  'Golden Jumbos Threads Black': {
    'Tim Duncan': '1',
    'Grant Hill': '2',
    'Michael Redd': '3',
    "Shaquille O'Neal": '4',
    'Patrick Ewing': '5',
    'Andrei Kirilenko': '6',
    'Hakeem Olajuwon': '7',
    'Scottie Pippen': '8',
    'Richard Hamilton': '9',
    'Larry Bird': '10',
  },

  // Photo Variations - uses base set card numbers
  'Photo Variations': {
    'Kawhi Leonard': '5',
    'Kristaps Porzingis': '25',
    'Dirk Nowitzki': '37',
    'DeMarcus Cousins': '42',
    'DeMar DeRozan': '43',
    'Carmelo Anthony': '55',
    'Isaiah Thomas': '58',
    'Chris Paul': '66',
    'Russell Westbrook': '71',
    'Kyle Lowry': '73',
    'Blake Griffin': '76',
    'Damian Lillard': '82',
    'LeBron James': '87',
    'Anthony Davis': '95',
    'Paul George': '96',
    'Kyrie Irving': '97',
    'Zach LaVine': '115',
    'Jimmy Butler': '118',
    'Draymond Green': '119',
    'Justise Winslow': '120',
    'Devin Booker': '122',
    'Klay Thompson': '129',
    'Giannis Antetokounmpo': '130',
    'Rodney Hood': '133',
    'Stephen Curry': '139',
    'Karl-Anthony Towns': '145',
    'Andrew Wiggins': '155',
    'James Harden': '167',
    'Kobe Bryant': '171',
    'Scottie Pippen': '175',
  },

  // Team Variations - uses base set card numbers (multiple entries per number)
  'Team Variations': {
    // Kevin Durant variants
    'Kevin Durant': '1',  // First one wins for mapping
    // Jamal Crawford variants
    'Jamal Crawford': '53',
    // Carmelo Anthony variants
    'Carmelo Anthony': '55',
    // Dwyane Wade variants
    'Dwyane Wade': '108',
    // Rick Barry variants
    'Rick Barry': '177',
    // Hakeem Olajuwon variants
    'Hakeem Olajuwon': '179',
    // Julius Erving variants
    'Julius Erving': '183',
    // Dikembe Mutombo variants
    'Dikembe Mutombo': '188',
    // Ben Wallace variants
    'Ben Wallace': '194',
    // Robert Parish variants
    'Robert Parish': '198',
  },
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function fixCardNumbers() {
  console.log('Starting Gold Standard card number corrections...\n');

  // Find the release
  const release = await prisma.release.findUnique({
    where: { slug: RELEASE_SLUG },
  });

  if (!release) {
    throw new Error(`Release not found: ${RELEASE_SLUG}`);
  }

  console.log(`Found release: ${release.name}\n`);

  // Get all sets for this release
  const sets = await prisma.set.findMany({
    where: { releaseId: release.id },
    include: { cards: true },
  });

  console.log(`Found ${sets.length} sets\n`);

  let totalUpdated = 0;

  // Process each set
  for (const set of sets) {
    const offset = OFFSET_SETS[set.name];
    const playerMapping = PLAYER_MAPPINGS[set.name];

    if (offset !== undefined) {
      // Offset-based correction
      console.log(`\n[OFFSET] ${set.name}: adding ${offset} to card numbers`);

      let updated = 0;
      for (const card of set.cards) {
        const currentNum = parseInt(card.cardNumber || '0');
        if (isNaN(currentNum) || currentNum === 0) continue;

        const newNum = currentNum + offset;
        const newCardNumber = newNum.toString();

        // Update slug - find the card number in slug and replace
        // Pattern: ...-{setname}-{cardNumber}-{player}-... or ...-{cardNumber}-{player}-...
        const oldSlug = card.slug;
        let newSlug = oldSlug;

        // Try to find and replace the card number in the slug
        // The number appears after the last major identifier before the player name
        const slugParts = oldSlug.split('-');
        for (let i = 0; i < slugParts.length; i++) {
          if (slugParts[i] === currentNum.toString()) {
            slugParts[i] = newCardNumber;
            newSlug = slugParts.join('-');
            break;
          }
        }

        await prisma.card.update({
          where: { id: card.id },
          data: {
            cardNumber: newCardNumber,
            slug: newSlug,
          },
        });
        updated++;
      }

      console.log(`  Updated ${updated} cards`);
      totalUpdated += updated;

    } else if (playerMapping) {
      // Player-name based correction
      console.log(`\n[MAPPING] ${set.name}: using player-to-number mapping`);

      let updated = 0;
      let notFound = 0;

      for (const card of set.cards) {
        const playerName = card.playerName || '';
        const correctNumber = playerMapping[playerName];

        if (!correctNumber) {
          // Try variations
          const variations = [
            playerName,
            playerName.replace(/'/g, "'"), // Smart quote to straight
            playerName.replace(/'/g, "'"), // Straight to smart quote
          ];

          let found = false;
          for (const variation of variations) {
            if (playerMapping[variation]) {
              const newCardNumber = playerMapping[variation];
              const currentNum = card.cardNumber || '1';

              // Update slug
              const oldSlug = card.slug;
              const slugParts = oldSlug.split('-');
              let newSlug = oldSlug;

              for (let i = 0; i < slugParts.length; i++) {
                if (slugParts[i] === currentNum) {
                  slugParts[i] = newCardNumber;
                  newSlug = slugParts.join('-');
                  break;
                }
              }

              await prisma.card.update({
                where: { id: card.id },
                data: {
                  cardNumber: newCardNumber,
                  slug: newSlug,
                },
              });
              updated++;
              found = true;
              break;
            }
          }

          if (!found) {
            notFound++;
            console.log(`    WARNING: No mapping for "${playerName}" in ${set.name}`);
          }
          continue;
        }

        const currentNum = card.cardNumber || '1';

        // Update slug
        const oldSlug = card.slug;
        const slugParts = oldSlug.split('-');
        let newSlug = oldSlug;

        for (let i = 0; i < slugParts.length; i++) {
          if (slugParts[i] === currentNum) {
            slugParts[i] = correctNumber;
            newSlug = slugParts.join('-');
            break;
          }
        }

        await prisma.card.update({
          where: { id: card.id },
          data: {
            cardNumber: correctNumber,
            slug: newSlug,
          },
        });
        updated++;
      }

      console.log(`  Updated ${updated} cards${notFound > 0 ? `, ${notFound} not found` : ''}`);
      totalUpdated += updated;
    }
  }

  console.log(`\n========================================`);
  console.log(`Total cards updated: ${totalUpdated}`);
  console.log(`========================================\n`);
}

// Run the fix
fixCardNumbers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
