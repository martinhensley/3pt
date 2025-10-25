import { prisma } from '../lib/prisma';

async function main() {
  const sets = await prisma.set.findMany({
    select: {
      id: true,
      name: true,
      parallels: true,
      release: {
        select: {
          name: true,
          year: true
        }
      }
    }
  });

  console.log('Sets with "1/1" parallels:');
  sets.forEach(set => {
    const parallels = Array.isArray(set.parallels) ? set.parallels : [];
    const oneOfOneParallels = parallels.filter(p => 
      typeof p === 'string' && p.includes('1/1')
    );
    
    if (oneOfOneParallels.length > 0) {
      console.log(`\n${set.release.year} ${set.release.name} - ${set.name}:`);
      oneOfOneParallels.forEach(p => console.log(`  - ${p}`));
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
