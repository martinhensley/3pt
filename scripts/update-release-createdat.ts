import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Parse various date formats and return a Date at 4:20pm Mountain Time (UTC-7)
// 4:20pm MT = 23:20 UTC (standard time)
function parseReleaseDateToCreatedAt(releaseDate: string): Date | null {
  if (!releaseDate) return null;

  // Try parsing 'Month Day, Year' format (e.g., 'November 23, 2016')
  const monthDayYear = releaseDate.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDayYear) {
    const [, month, day, year] = monthDayYear;
    const months: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    const monthNum = months[month.toLowerCase()];
    if (monthNum !== undefined) {
      // Create date at 4:20pm Mountain Time (23:20 UTC for standard time)
      const date = new Date(Date.UTC(parseInt(year), monthNum, parseInt(day), 23, 20, 0, 0));
      return date;
    }
  }

  // Try parsing 'YYYY-MM-DD' format (e.g., '2016-11-30')
  const isoFormat = releaseDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoFormat) {
    const [, year, month, day] = isoFormat;
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 20, 0, 0));
    return date;
  }

  // Try parsing just a year (e.g., '2016')
  const yearOnly = releaseDate.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = parseInt(yearOnly[1]);
    // Default to January 1 at 4:20pm MT
    const date = new Date(Date.UTC(year, 0, 1, 23, 20, 0, 0));
    return date;
  }

  console.log('Could not parse:', releaseDate);
  return null;
}

async function main() {
  const releases = await prisma.release.findMany({
    select: { id: true, name: true, releaseDate: true, createdAt: true }
  });

  console.log('Updating', releases.length, 'releases...\n');

  for (const release of releases) {
    if (release.releaseDate) {
      const newCreatedAt = parseReleaseDateToCreatedAt(release.releaseDate);
      if (newCreatedAt) {
        await prisma.release.update({
          where: { id: release.id },
          data: { createdAt: newCreatedAt }
        });
        console.log('Updated:', release.name);
        console.log('  releaseDate:', release.releaseDate);
        console.log('  new createdAt:', newCreatedAt.toISOString());
        console.log();
      }
    }
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
