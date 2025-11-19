import { PrismaClient } from '@prisma/client';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';

const prisma = new PrismaClient();

// Rookie Kings cards
const ROOKIE_KINGS_CARDS = [
  { number: '1', player: 'Brandon Ingram', team: 'Los Angeles Lakers' },
  { number: '2', player: 'Ben Simmons', team: 'Philadelphia 76ers' },
  { number: '3', player: 'Jaylen Brown', team: 'Boston Celtics' },
  { number: '4', player: 'Dragan Bender', team: 'Phoenix Suns' },
  { number: '5', player: 'Kris Dunn', team: 'Minnesota Timberwolves' },
  { number: '6', player: 'Buddy Hield', team: 'New Orleans Pelicans' },
  { number: '7', player: 'Jamal Murray', team: 'Denver Nuggets' },
  { number: '8', player: 'Marquese Chriss', team: 'Phoenix Suns' },
  { number: '9', player: 'Jakob Poeltl', team: 'Toronto Raptors' },
  { number: '10', player: 'Thon Maker', team: 'Milwaukee Bucks' },
  { number: '11', player: 'Domantas Sabonis', team: 'Oklahoma City Thunder' },
  { number: '12', player: 'Taurean Prince', team: 'Atlanta Hawks' },
  { number: '13', player: 'Denzel Valentine', team: 'Chicago Bulls' },
  { number: '14', player: 'Wade Baldwin IV', team: 'Memphis Grizzlies' },
  { number: '15', player: 'Henry Ellenson', team: 'Detroit Pistons' },
  { number: '16', player: 'Malik Beasley', team: 'Denver Nuggets' },
  { number: '17', player: 'Caris LeVert', team: 'Brooklyn Nets' },
  { number: '18', player: 'DeAndre\' Bembry', team: 'Atlanta Hawks' },
  { number: '19', player: 'Malachi Richardson', team: 'Sacramento Kings' },
  { number: '20', player: 'Timothe Luwawu-Cabarrot', team: 'Philadelphia 76ers' },
  { number: '21', player: 'Brice Johnson', team: 'Los Angeles Clippers' },
  { number: '22', player: 'Pascal Siakam', team: 'Toronto Raptors' },
  { number: '23', player: 'Skal Labissiere', team: 'Sacramento Kings' },
  { number: '24', player: 'Dejounte Murray', team: 'San Antonio Spurs' },
  { number: '25', player: 'Damian Jones', team: 'Golden State Warriors' },
  { number: '26', player: 'Isaiah Whitehead', team: 'Brooklyn Nets' },
  { number: '27', player: 'Deyonta Davis', team: 'Memphis Grizzlies' },
  { number: '28', player: 'Kay Felder', team: 'Cleveland Cavaliers' },
  { number: '29', player: 'A.J. Hammons', team: 'Dallas Mavericks' },
  { number: '30', player: 'Dario Saric', team: 'Philadelphia 76ers' },
];

// Parallels with their print runs
const PARALLELS = [
  { name: null, printRun: null }, // Base version (no parallel)
  { name: 'Press Proof', printRun: null }, // Unnumbered
  { name: 'Press Proof Orange', printRun: 125 },
  { name: 'Press Proof Blue', printRun: 99 },
  { name: 'Press Proof Black', printRun: 1 },
];

async function addRookieKings() {
  try {
    console.log('Adding Rookie Kings insert set with parallels...\n');

    // 1. Find the release
    const release = await prisma.release.findUnique({
      where: { slug: '2016-17-panini-donruss-basketball' },
      include: { manufacturer: true }
    });

    if (!release) {
      console.error('Release not found!');
      return;
    }

    console.log(`Found release: ${release.name} (${release.id})\n`);

    let totalSetsCreated = 0;
    let totalCardsCreated = 0;

    // 2. Create each parallel set
    for (const parallel of PARALLELS) {
      const isParallel = parallel.name !== null;
      const baseSetName = 'Rookie Kings';
      const variantName = parallel.name;
      const printRun = parallel.printRun;
      const setType = 'Insert';

      // Full set name
      const fullSetName = variantName ? `${baseSetName} ${variantName}` : baseSetName;

      console.log(`Processing: ${fullSetName} (${printRun ? '/' + printRun : 'unnumbered'})`);

      // Generate slug
      let slug: string;
      if (isParallel) {
        const parallelSlug = variantName!.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const baseSlug = generateSetSlug('2016-17', 'Donruss Basketball', baseSetName, setType);
        slug = printRun ? `${baseSlug}-${parallelSlug}-parallel-${printRun}` : `${baseSlug}-${parallelSlug}-parallel`;
      } else {
        slug = generateSetSlug('2016-17', 'Donruss Basketball', baseSetName, setType);
      }

      // Calculate base set slug for parallels
      let baseSetSlug: string | null = null;
      if (isParallel) {
        baseSetSlug = generateSetSlug('2016-17', 'Donruss Basketball', baseSetName, setType);
      }

      console.log(`  Slug: ${slug}`);

      // Check if set already exists
      const existingSet = await prisma.set.findUnique({
        where: { slug }
      });

      if (existingSet) {
        console.log(`  ⚠️  Set already exists, skipping...\n`);
        continue;
      }

      // Create the set
      const rookieKingsSet = await prisma.set.create({
        data: {
          name: fullSetName,
          slug,
          type: setType,
          isParallel,
          baseSetSlug,
          printRun,
          releaseId: release.id,
          expectedCardCount: ROOKIE_KINGS_CARDS.length.toString()
        }
      });

      totalSetsCreated++;
      console.log(`  ✅ Created set: ${rookieKingsSet.slug}`);

      // 3. Create cards for this set
      let cardsCreated = 0;
      for (const card of ROOKIE_KINGS_CARDS) {
        const cardSlug = generateCardSlug(
          release.manufacturer.name,
          release.name,
          release.year || '2016-17',
          baseSetName,
          card.number,
          card.player,
          variantName,
          printRun || undefined,
          setType as any
        );

        try {
          await prisma.card.create({
            data: {
              slug: cardSlug,
              playerName: card.player,
              team: card.team,
              cardNumber: card.number,
              variant: variantName,
              printRun,
              isNumbered: printRun !== null,
              numbered: printRun ? (printRun === 1 ? '1 of 1' : `/${printRun}`) : null,
              rarity: printRun === 1 ? 'one_of_one' :
                      printRun && printRun <= 10 ? 'ultra_rare' :
                      printRun && printRun <= 50 ? 'super_rare' :
                      printRun && printRun <= 199 ? 'rare' : 'base',
              setId: rookieKingsSet.id
            }
          });
          cardsCreated++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`    ⚠️  Card already exists: ${cardSlug}`);
          } else {
            throw error;
          }
        }
      }

      totalCardsCreated += cardsCreated;
      console.log(`  ✅ Created ${cardsCreated}/${ROOKIE_KINGS_CARDS.length} cards\n`);
    }

    // 4. Summary
    console.log('='.repeat(60));
    console.log(`✅ Successfully added ${totalSetsCreated} Rookie Kings sets`);
    console.log(`✅ Created ${totalCardsCreated} cards`);
    console.log('='.repeat(60));

    // 5. Validation
    console.log('\n===== Validation =====');
    const rookieKingsSets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        name: { contains: 'Rookie Kings' }
      },
      include: { _count: { select: { cards: true } } },
      orderBy: { printRun: 'desc' }
    });

    console.log(`\nTotal Rookie Kings sets: ${rookieKingsSets.length}`);
    rookieKingsSets.forEach(set => {
      console.log(`  - ${set.name}: ${set._count.cards} cards ${set.printRun ? '(/' + set.printRun + ')' : ''}`);
    });

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('Error adding Rookie Kings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addRookieKings();
