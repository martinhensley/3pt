import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const expectedCardNumbers = [
  102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
  122, 123, 124, 125, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142,
  143, 144, 146, 148, 149, 150, 151, 152, 153, 154, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165,
  166, 167, 168, 169, 171, 172, 173, 176, 178, 179, 180, 181, 182, 183, 184
];

const missingNumbers = [126, 145, 147, 155, 170, 174, 175, 177];

async function main() {
  const release = await prisma.release.findFirst({
    where: {
      slug: '2016-panini-contenders-draft-picks-basketball'
    }
  });

  if (!release) {
    throw new Error('Release not found');
  }

  // Get College Ticket base set
  const set = await prisma.set.findFirst({
    where: {
      releaseId: release.id,
      name: 'College Ticket'
    },
    include: {
      cards: {
        orderBy: {
          cardNumber: 'asc'
        }
      }
    }
  });

  if (!set) {
    throw new Error('College Ticket set not found');
  }

  console.log('=== COLLEGE TICKET CARD NUMBERS ===\n');
  console.log(`Total cards: ${set.cards.length}\n`);

  const cardNumbers = set.cards
    .map(c => parseInt(c.cardNumber || '0'))
    .filter(n => n > 0)
    .sort((a, b) => a - b);

  console.log(`Card number range: ${cardNumbers[0]} - ${cardNumbers[cardNumbers.length - 1]}`);
  console.log(`Unique card numbers: ${new Set(cardNumbers).size}\n`);

  // Check for expected gaps
  console.log('=== CHECKING FOR EXPECTED GAPS ===\n');

  const actualNumbers = new Set(cardNumbers);
  let allGapsPresent = true;

  for (const num of missingNumbers) {
    if (actualNumbers.has(num)) {
      console.log(`✗ Card #${num} should be MISSING but is PRESENT`);
      allGapsPresent = false;
    } else {
      console.log(`✓ Card #${num} is correctly missing`);
    }
  }

  // Check for unexpected gaps
  console.log('\n=== CHECKING FOR UNEXPECTED CARDS ===\n');

  const expectedSet = new Set(expectedCardNumbers);
  let allExpectedPresent = true;

  for (const num of cardNumbers) {
    if (!expectedSet.has(num)) {
      console.log(`✗ Card #${num} is UNEXPECTED (should not be present)`);
      allExpectedPresent = false;

      // Show the card details
      const card = set.cards.find(c => parseInt(c.cardNumber || '0') === num);
      if (card) {
        console.log(`   Player: ${card.playerName}, Team: ${card.team}`);
      }
    }
  }

  if (allExpectedPresent) {
    console.log('✓ No unexpected cards found');
  }

  console.log('\n=== SUMMARY ===\n');
  console.log(`Expected card count: ${expectedCardNumbers.length} (74 cards)`);
  console.log(`Actual card count: ${set.cards.length}`);
  console.log(`Status: ${set.cards.length === expectedCardNumbers.length && allGapsPresent && allExpectedPresent ? '✓ CORRECT' : '✗ INCORRECT'}`);

  // Show all card numbers in ranges
  console.log('\n=== ALL CARD NUMBERS ===\n');
  let rangeStart = cardNumbers[0];
  let rangeEnd = cardNumbers[0];

  for (let i = 1; i < cardNumbers.length; i++) {
    if (cardNumbers[i] === rangeEnd + 1) {
      rangeEnd = cardNumbers[i];
    } else {
      if (rangeStart === rangeEnd) {
        console.log(`${rangeStart}`);
      } else {
        console.log(`${rangeStart}-${rangeEnd}`);
      }
      rangeStart = cardNumbers[i];
      rangeEnd = cardNumbers[i];
    }
  }

  if (rangeStart === rangeEnd) {
    console.log(`${rangeStart}`);
  } else {
    console.log(`${rangeStart}-${rangeEnd}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
