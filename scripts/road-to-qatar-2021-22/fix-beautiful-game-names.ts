import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBeautifulGameNames() {
  try {
    console.log('Fixing Beautiful Game set names...\n');

    // Get all Beautiful Game sets
    const release = await prisma.release.findUnique({
      where: { slug: '2021-22-panini-donruss-road-to-qatar-soccer' },
      include: {
        sets: {
          where: {
            name: {
              contains: 'Beautiful Game'
            }
          }
        }
      }
    });

    if (!release) {
      console.log('❌ Release not found');
      return;
    }

    console.log(`Found ${release.sets.length} Beautiful Game sets\n`);

    // Rename sets to include "Autographs"
    const nameMapping: Record<string, string> = {
      'Beautiful Game': 'Beautiful Game Autographs',
      'Beautiful Game Black': 'Beautiful Game Autographs Black',
      'Beautiful Game Blue': 'Beautiful Game Autographs Blue',
      'Beautiful Game Gold': 'Beautiful Game Autographs Gold',
      'Beautiful Game Green': 'Beautiful Game Autographs Green',
      'Beautiful Game Red': 'Beautiful Game Autographs Red',
      'Beautiful Game Red and Gold Laser': 'Beautiful Game Autographs Red and Gold Laser',
      // Dual Autographs already have correct names
      'Beautiful Game Dual Autographs': 'Beautiful Game Dual Autographs',
      'Beautiful Game Dual Autographs Black': 'Beautiful Game Dual Autographs Black',
      'Beautiful Game Dual Autographs Gold': 'Beautiful Game Dual Autographs Gold'
    };

    let updatedCount = 0;

    for (const set of release.sets) {
      const newName = nameMapping[set.name];

      if (!newName) {
        console.log(`⚠️  Unknown set: ${set.name} - skipping`);
        continue;
      }

      if (set.name !== newName) {
        console.log(`Renaming: ${set.name} → ${newName}`);

        // Generate new slug
        const newSlug = set.slug.replace(
          set.name.toLowerCase().replace(/\s+/g, '-'),
          newName.toLowerCase().replace(/\s+/g, '-')
        );

        console.log(`  Slug: ${set.slug} → ${newSlug}`);

        await prisma.set.update({
          where: { id: set.id },
          data: {
            name: newName,
            slug: newSlug
          }
        });

        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      console.log('✅ All Beautiful Game set names are already correct!');
    } else {
      console.log(`\n✅ Successfully renamed ${updatedCount} sets`);
    }

    // Verify the changes
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION - Updated Set Names:');
    console.log('='.repeat(70));

    const verifiedSets = await prisma.set.findMany({
      where: {
        releaseId: release.id,
        name: {
          contains: 'Beautiful Game'
        }
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { cards: true }
        }
      }
    });

    verifiedSets.forEach(set => {
      const padding = ' '.repeat(Math.max(0, 50 - set.name.length));
      console.log(`${set.name}${padding}${set._count.cards} cards`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBeautifulGameNames();
