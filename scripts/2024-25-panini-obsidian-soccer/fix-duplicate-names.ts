import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix duplicate player names and teams in Obsidian Soccer cards
 * Pattern: "Name/Name/Name" -> "Name"
 * Also handles: "Name /Name /Name " -> "Name"
 */
async function fixDuplicateNames() {
  console.log('Starting fix for duplicate names in Obsidian Soccer cards...\n');

  // Get all cards from the Obsidian Soccer release
  const release = await prisma.release.findUnique({
    where: { slug: '2024-25-panini-obsidian-soccer' },
    include: {
      sets: {
        include: {
          cards: true
        }
      }
    }
  });

  if (!release) {
    console.error('Obsidian Soccer release not found!');
    return;
  }

  console.log(`Found release: ${release.name}`);
  console.log(`Total sets: ${release.sets.length}`);

  let totalCards = 0;
  let fixedPlayerNames = 0;
  let fixedTeams = 0;

  // Process each set
  for (const set of release.sets) {
    for (const card of set.cards) {
      totalCards++;
      let needsUpdate = false;
      let newPlayerName = card.playerName;
      let newTeam = card.team;

      // Fix player name if it has duplicates
      if (card.playerName && card.playerName.includes('/')) {
        const parts = card.playerName.split('/').map(p => p.trim());
        const uniqueParts = [...new Set(parts)];

        // Only fix if all parts are the same (duplicates)
        if (uniqueParts.length === 1) {
          newPlayerName = uniqueParts[0];
          fixedPlayerNames++;
          needsUpdate = true;
        }
      }

      // Fix team name if it has duplicates
      if (card.team && card.team.includes('/')) {
        const parts = card.team.split('/').map(p => p.trim());
        const uniqueParts = [...new Set(parts)];

        // Only fix if all parts are the same (duplicates)
        if (uniqueParts.length === 1) {
          newTeam = uniqueParts[0];
          fixedTeams++;
          needsUpdate = true;
        }
      }

      // Update the card if needed
      if (needsUpdate) {
        await prisma.card.update({
          where: { id: card.id },
          data: {
            playerName: newPlayerName,
            team: newTeam
          }
        });

        if (totalCards % 100 === 0) {
          console.log(`Processed ${totalCards} cards...`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('FIX COMPLETE!');
  console.log('='.repeat(70));
  console.log(`Total cards processed: ${totalCards}`);
  console.log(`Player names fixed: ${fixedPlayerNames}`);
  console.log(`Team names fixed: ${fixedTeams}`);

  await prisma.$disconnect();
}

fixDuplicateNames();
