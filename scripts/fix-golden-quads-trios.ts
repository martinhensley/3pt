/**
 * Fix Golden Quads and Golden Trios card numbers
 *
 * The checklist has gaps in card numbers that need to be corrected.
 */

import { prisma } from '@/lib/prisma';

const RELEASE_SLUG = '2016-17-panini-gold-standard-basketball';

// Golden Quads: 22 cards (missing #14, #19)
// Card numbering: 1-13, 15-18, 20-24
const GOLDEN_QUADS_FIRST_PLAYER: Record<string, string> = {
  'David Robinson': '1',
  'Tony Parker': '1',
  'Kawhi Leonard': '2',
  'Karl-Anthony Towns': '3',
  'Tyus Jones': '3',
  'Alec Burks': '4',
  'Kevin Love': '5',
  'Iman Shumpert': '5',
  'Marc Gasol': '6',
  'Kevin Garnett': '7',
  'Andre Roberson': '8',
  'Hakeem Olajuwon': '9',
  'Grant Hill': '9',
  'Gordon Hayward': '10',
  'Jordan Mickey': '11',
  'James Young': '11',
  'Isaiah Thomas': '12',
  'Udonis Haslem': '13',
  'Kelly Olynyk': '13',
  'Aaron Gordon': '15',
  'Dante Exum': '16',
  'Bojan Bogdanovic': '17',
  'Jahlil Okafor': '18',
  'Rondae Hollis-Jefferson': '18',
  'Larry Bird': '20',
  'Ray Allen': '20',
  'Richard Hamilton': '21',
  'Nikola Mirotic': '21',
  'Scottie Pippen': '21',
  'Paul Millsap': '21',
  'Kyle Korver': '22',
  'Danilo Gallinari': '22',
  'Damian Lillard': '23',
  'Bobby Portis': '23',
  'Miles Plumlee': '24',
  'Trevor Ariza': '24',
  'Mason Plumlee': '24',
};

// Golden Trios: 25 cards (sequential 1-25)
const GOLDEN_TRIOS_FIRST_PLAYER: Record<string, string> = {
  'Grant Hill': '1',
  'Carmelo Anthony': '2',
  'Kevin Love': '3',
  'Derrick Favors': '4',
  'Vince Carter': '5',
  'Kawhi Leonard': '6',
  'DeAndre Jordan': '7',
  'Andrew Wiggins': '8',
  'Enes Kanter': '9',
  'Julius Randle': '10',
  'Rodney Stuckey': '11',
  'Alec Burks': '12',
  'Bradley Beal': '13',
  'Isaiah Thomas': '14',
  'Hakeem Olajuwon': '15',
  'Mario Hezonja': '16',
  'Jabari Parker': '17',
  'Damian Lillard': '18',
  'Klay Thompson': '19',
  'Andre Drummond': '20',
  'Larry Bird': '21',
  'Jusuf Nurkic': '22',
  'Kent Bazemore': '23',
  "D'Angelo Russell": '24',
  'Kelly Oubre Jr.': '25',
};

// Golden Trios Black: 23 cards (missing #19, #23)
const GOLDEN_TRIOS_BLACK_FIRST_PLAYER: Record<string, string> = {
  'Grant Hill': '1',
  'Ray Allen': '1',
  'Carmelo Anthony': '2',
  'DeMar DeRozan': '2',
  'Kevin Love': '3',
  'Iman Shumpert': '3',
  'Derrick Favors': '4',
  'Rudy Gobert': '4',
  'Vince Carter': '5',
  'Marc Gasol': '5',
  'Kawhi Leonard': '6',
  'DeAndre Jordan': '7',
  'DeMarre Carroll': '7',
  'Andrew Wiggins': '8',
  'Enes Kanter': '9',
  'Julius Randle': '10',
  'Rodney Stuckey': '11',
  'Paul George': '11',
  'Alec Burks': '12',
  'Gordon Hayward': '12',
  'Bradley Beal': '13',
  'Isaiah Thomas': '14',
  'Marcus Smart': '14',
  'Hakeem Olajuwon': '15',
  'Mario Hezonja': '16',
  'Aaron Gordon': '16',
  'Jabari Parker': '17',
  'Damian Lillard': '18',
  'Andre Drummond': '20',
  'Hassan Whiteside': '20',
  'Larry Bird': '21',
  'John Stockton': '21',
  'Jusuf Nurkic': '22',
  "D'Angelo Russell": '24',
  'Myles Turner': '24',
  'Kelly Oubre Jr.': '25',
};

async function fixSet(setName: string, mapping: Record<string, string>) {
  const set = await prisma.set.findFirst({
    where: {
      release: { slug: RELEASE_SLUG },
      name: setName
    },
    include: { cards: true }
  });

  if (!set) {
    console.log(`Set not found: ${setName}`);
    return;
  }

  console.log(`\nFixing ${setName} (${set.cards.length} cards)...`);
  let fixed = 0;

  for (const card of set.cards) {
    const playerName = card.playerName || '';

    // Find the first player in the card name that matches
    let correctNum: string | undefined;
    const firstPlayer = playerName.split(' ').slice(0, 2).join(' '); // Get first two words (first + last name)

    for (const [key, num] of Object.entries(mapping)) {
      if (playerName.startsWith(key)) {
        correctNum = num;
        break;
      }
    }

    if (correctNum && card.cardNumber !== correctNum) {
      const oldSlug = card.slug;
      // Replace the card number in the slug
      const slugParts = oldSlug.split('-');
      for (let i = 0; i < slugParts.length; i++) {
        if (slugParts[i] === card.cardNumber) {
          slugParts[i] = correctNum;
          break;
        }
      }
      const newSlug = slugParts.join('-');

      await prisma.card.update({
        where: { id: card.id },
        data: { cardNumber: correctNum, slug: newSlug }
      });

      console.log(`  #${card.cardNumber} -> #${correctNum}: ${playerName.substring(0, 40)}`);
      fixed++;
    }
  }

  console.log(`  Fixed ${fixed} cards`);
}

async function main() {
  console.log('Fixing Golden Quads and Golden Trios card numbers...');

  await fixSet('Golden Quads', GOLDEN_QUADS_FIRST_PLAYER);
  await fixSet('Golden Quads Black', GOLDEN_QUADS_FIRST_PLAYER);
  await fixSet('Golden Trios', GOLDEN_TRIOS_FIRST_PLAYER);
  await fixSet('Golden Trios Black', GOLDEN_TRIOS_BLACK_FIRST_PLAYER);

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
