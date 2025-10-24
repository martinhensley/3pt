import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateReleaseDescription() {
  const description = "The 2024-25 Panini Donruss Soccer release is a proper brilliant collection that'll have footy enthusiasts buzzing with excitement, featuring a massive 200-card Base Set with 14 stunning parallel variations ranging from eye-catching Cubic and Diamond designs all the way down to those elusive Black 1/1 gems. I reckon what really sets this release apart is the comprehensive lineup of chase cards - from the always-popular Autographs and Memorabilia sets to the must-have Rated Rookies featuring 25 of the season's brightest young talents, plus a cracking selection of Inserts that showcase the beautiful game's biggest stars from leagues across the globe.";

  await prisma.release.update({
    where: { id: 'cmh3wzn9600018of9jsmw8a7c' },
    data: { description },
  });

  console.log('Release description updated successfully!');
  console.log('\nDescription:');
  console.log(description);
}

updateReleaseDescription()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
