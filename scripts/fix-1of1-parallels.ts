import { prisma } from '../lib/prisma';

async function main() {
  const sets = await prisma.set.findMany();

  for (const set of sets) {
    const parallels = Array.isArray(set.parallels) ? set.parallels : [];
    const updatedParallels = parallels.map(p => {
      if (typeof p === 'string' && p.includes('1/1')) {
        return p.replace(/1\/1/g, '1 of 1');
      }
      return p;
    });

    // Check if any changes were made
    if (JSON.stringify(parallels) !== JSON.stringify(updatedParallels)) {
      await prisma.set.update({
        where: { id: set.id },
        data: { parallels: updatedParallels }
      });
      console.log(`Updated ${set.name}:`);
      parallels.forEach((p, i) => {
        if (p !== updatedParallels[i]) {
          console.log(`  "${p}" -> "${updatedParallels[i]}"`);
        }
      });
    }
  }

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
