import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const release = await prisma.release.findFirst({
    where: {
      slug: '2016-panini-contenders-draft-picks-basketball'
    }
  });

  if (!release || !release.sourceFiles) {
    throw new Error('Release not found or has no source files');
  }

  const sourceFiles = release.sourceFiles as any[];
  const csvFile = sourceFiles.find(f => f.type === 'csv');

  if (!csvFile) {
    throw new Error('CSV file not found in source files');
  }

  const lines = csvFile.content.split('\n');

  console.log('=== FIRST 10 LINES ===\n');
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    console.log(`Line ${i}:`);
    console.log(lines[i]);
    console.log('');
  }

  // Find a College Ticket line
  console.log('\n=== LOOKING FOR COLLEGE TICKET ===\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('College Championship Ticket')) {
      console.log(`Found at line ${i}:`);
      console.log(lines[i]);
      console.log('\nRaw bytes:');
      console.log([...lines[i]].map(c => `${c} (${c.charCodeAt(0)})`).join(', '));
      break;
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
