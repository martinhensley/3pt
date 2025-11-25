/**
 * Rename College Ticket Printing Plate sets to include "Variation"
 *
 * Updates the 4 printing plate sets for College Ticket Variation to have
 * consistent naming with "Variation" included in the set name.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SetUpdate {
  id: string;
  currentName: string;
  currentSlug: string;
  newName: string;
  newSlug: string;
}

async function main() {
  console.log('🔍 Finding College Ticket Printing Plate sets...\n');

  // Find all College Ticket Printing Plate sets
  const sets = await prisma.set.findMany({
    where: {
      name: {
        contains: 'College Ticket Printing Plate'
      }
    },
    include: {
      _count: {
        select: { cards: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  if (sets.length === 0) {
    console.log('❌ No College Ticket Printing Plate sets found');
    return;
  }

  console.log(`Found ${sets.length} sets to update:\n`);

  // Define the updates
  const updates: SetUpdate[] = [
    {
      id: sets.find(s => s.name === 'College Ticket Printing Plate - Black')!.id,
      currentName: 'College Ticket Printing Plate - Black',
      currentSlug: '2016-contenders-draft-picks-college-ticket-printing-plate-black-parallel-1',
      newName: 'College Ticket Printing Plate Black Variation',
      newSlug: '2016-contenders-draft-picks-college-ticket-printing-plate-black-variation-parallel-1'
    },
    {
      id: sets.find(s => s.name === 'College Ticket Printing Plate - Cyan')!.id,
      currentName: 'College Ticket Printing Plate - Cyan',
      currentSlug: '2016-contenders-draft-picks-college-ticket-printing-plate-cyan-parallel-1',
      newName: 'College Ticket Printing Plate Cyan Variation',
      newSlug: '2016-contenders-draft-picks-college-ticket-printing-plate-cyan-variation-parallel-1'
    },
    {
      id: sets.find(s => s.name === 'College Ticket Printing Plate Magenta')!.id,
      currentName: 'College Ticket Printing Plate Magenta',
      currentSlug: '2016-contenders-draft-picks-college-ticket-printing-plate-magenta-parallel-1',
      newName: 'College Ticket Printing Plate Magenta Variation',
      newSlug: '2016-contenders-draft-picks-college-ticket-printing-plate-magenta-variation-parallel-1'
    },
    {
      id: sets.find(s => s.name === 'College Ticket Printing Plate Yellow')!.id,
      currentName: 'College Ticket Printing Plate Yellow',
      currentSlug: '2016-contenders-draft-picks-college-ticket-printing-plate-yellow-parallel-1',
      newName: 'College Ticket Printing Plate Yellow Variation',
      newSlug: '2016-contenders-draft-picks-college-ticket-printing-plate-yellow-variation-parallel-1'
    }
  ];

  // Display planned updates
  console.log('Planned updates:');
  console.log('='.repeat(80));
  updates.forEach((update, index) => {
    const set = sets.find(s => s.id === update.id);
    console.log(`\n${index + 1}. ${update.currentName} (${set?._count.cards} cards)`);
    console.log(`   Old name: ${update.currentName}`);
    console.log(`   New name: ${update.newName}`);
    console.log(`   Old slug: ${update.currentSlug}`);
    console.log(`   New slug: ${update.newSlug}`);
  });
  console.log('\n' + '='.repeat(80));

  // Confirm before proceeding
  console.log('\n⚠️  This will update 4 sets and their associated card slugs');
  console.log('📝 Press Enter to continue or Ctrl+C to cancel...\n');

  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  // Perform updates
  console.log('\n🔄 Updating sets...\n');

  for (const update of updates) {
    const set = sets.find(s => s.id === update.id);
    if (!set) {
      console.log(`❌ Set not found: ${update.currentName}`);
      continue;
    }

    console.log(`\n📝 Updating: ${update.currentName}`);
    console.log(`   → ${update.newName}`);

    try {
      // Update the set
      await prisma.set.update({
        where: { id: update.id },
        data: {
          name: update.newName,
          slug: update.newSlug
        }
      });

      console.log(`   ✅ Set updated successfully`);

      // Get all cards for this set to update their slugs
      const cards = await prisma.card.findMany({
        where: { setId: update.id },
        select: { id: true, slug: true }
      });

      console.log(`   🔄 Updating ${cards.length} card slugs...`);

      // Update card slugs - replace the old set slug portion with new
      const oldSetSlugPart = update.currentSlug;
      const newSetSlugPart = update.newSlug;

      let updatedCount = 0;
      for (const card of cards) {
        if (card.slug.includes(oldSetSlugPart)) {
          const newCardSlug = card.slug.replace(oldSetSlugPart, newSetSlugPart);

          await prisma.card.update({
            where: { id: card.id },
            data: { slug: newCardSlug }
          });

          updatedCount++;
        }
      }

      console.log(`   ✅ Updated ${updatedCount} card slugs`);

    } catch (error) {
      console.error(`   ❌ Error updating ${update.currentName}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✨ Update complete!\n');

  // Verify the updates
  console.log('🔍 Verifying updates...\n');
  const updatedSets = await prisma.set.findMany({
    where: {
      name: {
        contains: 'College Ticket Printing Plate'
      }
    },
    include: {
      _count: {
        select: { cards: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('Updated sets:');
  console.log('='.repeat(80));
  updatedSets.forEach(set => {
    console.log(`✅ ${set.name}`);
    console.log(`   Slug: ${set.slug}`);
    console.log(`   Base Set: ${set.baseSetSlug}`);
    console.log(`   Cards: ${set._count.cards}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
