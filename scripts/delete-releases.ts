import { prisma } from "../lib/prisma";

async function deleteAllReleases() {
  try {
    console.log("Fetching all releases...");
    const releases = await prisma.release.findMany({
      include: {
        sets: {
          include: {
            cards: true,
          },
        },
      },
    });

    console.log(`Found ${releases.length} releases to delete`);

    for (const release of releases) {
      console.log(`\nDeleting release: ${release.name} (${release.year})`);

      // Delete cards first
      for (const set of release.sets) {
        if (set.cards.length > 0) {
          console.log(`  - Deleting ${set.cards.length} cards from set: ${set.name}`);
          await prisma.card.deleteMany({
            where: { setId: set.id },
          });
        }
      }

      // Delete sets
      if (release.sets.length > 0) {
        console.log(`  - Deleting ${release.sets.length} sets`);
        await prisma.set.deleteMany({
          where: { releaseId: release.id },
        });
      }

      // Delete the release
      await prisma.release.delete({
        where: { id: release.id },
      });
      console.log(`  ✓ Deleted release: ${release.name}`);
    }

    console.log(`\n✅ Successfully deleted ${releases.length} releases`);
  } catch (error) {
    console.error("Error deleting releases:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllReleases();
