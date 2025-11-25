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

// Helper to generate the standard 33-card rookie list (Tools of the Trade sets)
function generateStandardRookieCards(printRun: number): CardData[] {
  return [
    { cardNumber: '1', playerName: 'Brandon Ingram', team: 'Los Angeles Lakers', printRun },
    { cardNumber: '2', playerName: 'Isaiah Whitehead', team: 'Brooklyn Nets', printRun },
    { cardNumber: '3', playerName: 'DeAndre\' Bembry', team: 'Atlanta Hawks', printRun },
    { cardNumber: '4', playerName: 'Marquese Chriss', team: 'Phoenix Suns', printRun },
    { cardNumber: '5', playerName: 'Wade Baldwin IV', team: 'Memphis Grizzlies', printRun },
    { cardNumber: '6', playerName: 'Denzel Valentine', team: 'Chicago Bulls', printRun },
    { cardNumber: '7', playerName: 'Dragan Bender', team: 'Phoenix Suns', printRun },
    { cardNumber: '8', playerName: 'Deyonta Davis', team: 'Memphis Grizzlies', printRun },
    { cardNumber: '9', playerName: 'Georgios Papagiannis', team: 'Sacramento Kings', printRun },
    { cardNumber: '10', playerName: 'Jamal Murray', team: 'Denver Nuggets', printRun },
    { cardNumber: '11', playerName: 'Demetrius Jackson', team: 'Boston Celtics', printRun },
    { cardNumber: '12', playerName: 'Kris Dunn', team: 'Minnesota Timberwolves', printRun },
    { cardNumber: '13', playerName: 'Brice Johnson', team: 'Los Angeles Clippers', printRun },
    { cardNumber: '14', playerName: 'Tyler Ulis', team: 'Phoenix Suns', printRun },
    { cardNumber: '15', playerName: 'Jaylen Brown', team: 'Boston Celtics', printRun },
    { cardNumber: '16', playerName: 'Jakob Poeltl', team: 'Toronto Raptors', printRun },
    { cardNumber: '17', playerName: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers', printRun },
    { cardNumber: '18', playerName: 'Buddy Hield', team: 'New Orleans Pelicans', printRun },
    { cardNumber: '19', playerName: 'Malik Beasley', team: 'Denver Nuggets', printRun },
    { cardNumber: '20', playerName: 'Pascal Siakam', team: 'Toronto Raptors', printRun },
    { cardNumber: '21', playerName: 'Ivica Zubac', team: 'Los Angeles Lakers', printRun },
    { cardNumber: '22', playerName: 'Henry Ellenson', team: 'Detroit Pistons', printRun },
    { cardNumber: '23', playerName: 'Diamond Stone', team: 'Los Angeles Clippers', printRun },
    { cardNumber: '24', playerName: 'Thon Maker', team: 'Milwaukee Bucks', printRun },
    { cardNumber: '25', playerName: 'Skal Labissiere', team: 'Sacramento Kings', printRun },
    { cardNumber: '26', playerName: 'Taurean Prince', team: 'Atlanta Hawks', printRun },
    { cardNumber: '27', playerName: 'Juan Hernangomez', team: 'Denver Nuggets', printRun },
    { cardNumber: '28', playerName: 'Dejounte Murray', team: 'San Antonio Spurs', printRun },
    { cardNumber: '29', playerName: 'Stephen Zimmerman', team: 'Orlando Magic', printRun },
    { cardNumber: '30', playerName: 'Damian Jones', team: 'Golden State Warriors', printRun },
    { cardNumber: '31', playerName: 'Chinanu Onuaku', team: 'Houston Rockets', printRun },
    { cardNumber: '32', playerName: 'Caris LeVert', team: 'Brooklyn Nets', printRun },
    { cardNumber: '33', playerName: 'Malachi Richardson', team: 'Sacramento Kings', printRun },
  ];
}

// Remaining Memorabilia sets
const memorabiliaSets: SetData[] = [
  // Tools of the Trade Dual Rookie Materials (Base + 3 parallels = 4 total)
  {
    setName: 'Tools of the Trade Dual Rookie Materials',
    setType: 'Memorabilia',
    printRun: 149,
    isParallel: false,
    baseSetName: null,
    cards: generateStandardRookieCards(149)
  },
  {
    setName: 'Tools of the Trade Dual Rookie Materials Prime',
    setType: 'Memorabilia',
    printRun: 49,
    isParallel: true,
    baseSetName: 'Tools of the Trade Dual Rookie Materials',
    cards: generateStandardRookieCards(49)
  },
  {
    setName: 'Tools of the Trade Dual Rookie Materials Patch',
    setType: 'Memorabilia',
    printRun: 25,
    isParallel: true,
    baseSetName: 'Tools of the Trade Dual Rookie Materials',
    cards: generateStandardRookieCards(25)
  },
  {
    setName: 'Tools of the Trade Dual Rookie Materials Tag',
    setType: 'Memorabilia',
    printRun: 1,
    isParallel: true,
    baseSetName: 'Tools of the Trade Dual Rookie Materials',
    cards: generateStandardRookieCards(1)
  },

  // Tools of the Trade Jumbo Rookie Materials (Base + 2 parallels = 3 total)
  {
    setName: 'Tools of the Trade Jumbo Rookie Materials',
    setType: 'Memorabilia',
    printRun: 149,
    isParallel: false,
    baseSetName: null,
    cards: generateStandardRookieCards(149)
  },
  {
    setName: 'Tools of the Trade Jumbo Rookie Materials Prime',
    setType: 'Memorabilia',
    printRun: 25,
    isParallel: true,
    baseSetName: 'Tools of the Trade Jumbo Rookie Materials',
    cards: generateStandardRookieCards(25)
  },
  {
    setName: 'Tools of the Trade Jumbo Rookie Materials Patch',
    setType: 'Memorabilia',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Tools of the Trade Jumbo Rookie Materials',
    cards: generateStandardRookieCards(10)
  },

  // Tools of the Trade Quad Rookie Materials (Base + 3 parallels = 4 total)
  {
    setName: 'Tools of the Trade Quad Rookie Materials',
    setType: 'Memorabilia',
    printRun: 125,
    isParallel: false,
    baseSetName: null,
    cards: generateStandardRookieCards(125)
  },
  {
    setName: 'Tools of the Trade Quad Rookie Materials Prime',
    setType: 'Memorabilia',
    printRun: 25,
    isParallel: true,
    baseSetName: 'Tools of the Trade Quad Rookie Materials',
    cards: generateStandardRookieCards(25)
  },
  {
    setName: 'Tools of the Trade Quad Rookie Materials Patch',
    setType: 'Memorabilia',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Tools of the Trade Quad Rookie Materials',
    cards: generateStandardRookieCards(10)
  },
  {
    setName: 'Tools of the Trade Quad Rookie Materials Tag',
    setType: 'Memorabilia',
    printRun: 1,
    isParallel: true,
    baseSetName: 'Tools of the Trade Quad Rookie Materials',
    cards: generateStandardRookieCards(1)
  },

  // Tools of the Trade Six Swatch Rookie Materials (Base + 3 parallels = 4 total)
  {
    setName: 'Tools of the Trade Six Swatch Rookie Materials',
    setType: 'Memorabilia',
    printRun: 75,
    isParallel: false,
    baseSetName: null,
    cards: generateStandardRookieCards(75)
  },
  {
    setName: 'Tools of the Trade Six Swatch Rookie Materials Prime',
    setType: 'Memorabilia',
    printRun: 25,
    isParallel: true,
    baseSetName: 'Tools of the Trade Six Swatch Rookie Materials',
    cards: generateStandardRookieCards(25)
  },
  {
    setName: 'Tools of the Trade Six Swatch Rookie Materials Patch',
    setType: 'Memorabilia',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Tools of the Trade Six Swatch Rookie Materials',
    cards: generateStandardRookieCards(10)
  },
  {
    setName: 'Tools of the Trade Six Swatch Rookie Materials Tag',
    setType: 'Memorabilia',
    printRun: 1,
    isParallel: true,
    baseSetName: 'Tools of the Trade Six Swatch Rookie Materials',
    cards: generateStandardRookieCards(1)
  },

  // Tools of the Trade Trio Rookie Materials (Base + 3 parallels = 4 total)
  {
    setName: 'Tools of the Trade Trio Rookie Materials',
    setType: 'Memorabilia',
    printRun: 149,
    isParallel: false,
    baseSetName: null,
    cards: generateStandardRookieCards(149)
  },
  {
    setName: 'Tools of the Trade Trio Rookie Materials Prime',
    setType: 'Memorabilia',
    printRun: 25,
    isParallel: true,
    baseSetName: 'Tools of the Trade Trio Rookie Materials',
    cards: generateStandardRookieCards(25)
  },
  {
    setName: 'Tools of the Trade Trio Rookie Materials Patch',
    setType: 'Memorabilia',
    printRun: 10,
    isParallel: true,
    baseSetName: 'Tools of the Trade Trio Rookie Materials',
    cards: generateStandardRookieCards(10)
  },
  {
    setName: 'Tools of the Trade Trio Rookie Materials Tag',
    setType: 'Memorabilia',
    printRun: 1,
    isParallel: true,
    baseSetName: 'Tools of the Trade Trio Rookie Materials',
    cards: generateStandardRookieCards(1)
  },

  // Team Sets - will be added in next section due to character limits
];

async function importMemorabiliapart2() {
  try {
    console.log('Starting 2016-17 Panini Absolute Basketball Memorabilia import (Part 2)...\n');

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
    console.log(`Successfully imported ${setCount} memorabilia sets and ${cardCount} cards (Part 2)`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importMemorabiliapart2();
