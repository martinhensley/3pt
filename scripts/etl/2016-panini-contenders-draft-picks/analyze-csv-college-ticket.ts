import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  // Find the release
  const release = await prisma.release.findFirst({
    where: {
      slug: '2016-panini-contenders-draft-picks-basketball'
    }
  });

  if (!release || !release.sourceFiles) {
    throw new Error('Release not found or has no source files');
  }

  // Parse CSV data
  const sourceFiles = release.sourceFiles as any[];
  const csvFile = sourceFiles.find(f => f.type === 'csv');

  if (!csvFile) {
    throw new Error('CSV file not found in source files');
  }

  const records = parse(csvFile.content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log('=== ANALYZING CSV COLLEGE TICKET ENTRIES ===\n');

  // Find all unique College Ticket set names
  const collegeTicketSets = new Set<string>();
  const collegeTicketByNumber = new Map<string, any[]>();

  for (const record of records) {
    const setName = (record as any)['Card Set'];
    const cardNumber = (record as any)['Num'];

    if (setName && setName.includes('College') && setName.includes('Ticket')) {
      collegeTicketSets.add(setName);

      if (!collegeTicketByNumber.has(cardNumber)) {
        collegeTicketByNumber.set(cardNumber, []);
      }
      collegeTicketByNumber.get(cardNumber)!.push({
        setName,
        cardNumber,
        playerName: (record as any)['Player'],
        team: (record as any)['Team'],
        seq: (record as any)['Seq.']
      });
    }
  }

  console.log('=== UNIQUE COLLEGE TICKET SET NAMES ===');
  const sortedSets = Array.from(collegeTicketSets).sort();
  sortedSets.forEach(set => console.log(`  - ${set}`));

  console.log('\n=== CARD NUMBER RANGES ===');

  // Group by set name and show card number ranges
  const setRanges = new Map<string, Set<number>>();

  for (const record of records) {
    const setName = (record as any)['Card Set'];
    const cardNumber = (record as any)['Num'];

    if (setName && setName.includes('College') && setName.includes('Ticket')) {
      if (!setRanges.has(setName)) {
        setRanges.set(setName, new Set());
      }
      const num = parseInt(cardNumber);
      if (!isNaN(num)) {
        setRanges.get(setName)!.add(num);
      }
    }
  }

  for (const [setName, numbers] of setRanges) {
    const sorted = Array.from(numbers).sort((a, b) => a - b);
    const isVariation = setName.includes('Variation');
    console.log(`\n${setName}:`);
    console.log(`  Type: ${isVariation ? 'VARIATION' : 'NON-VARIATION'}`);
    console.log(`  Card count: ${sorted.length}`);
    console.log(`  Range: ${sorted[0]} - ${sorted[sorted.length - 1]}`);
  }

  // Show sample of card 102-150 vs 151-184
  console.log('\n=== SAMPLE CARDS ===');
  console.log('\nCards 102-105:');
  for (let i = 102; i <= 105; i++) {
    const entries = collegeTicketByNumber.get(i.toString()) || [];
    console.log(`\nCard ${i}:`);
    entries.forEach(entry => {
      console.log(`  ${entry.setName}: ${entry.playerName} - ${entry.team}`);
    });
  }

  console.log('\nCards 151-154:');
  for (let i = 151; i <= 154; i++) {
    const entries = collegeTicketByNumber.get(i.toString()) || [];
    console.log(`\nCard ${i}:`);
    entries.forEach(entry => {
      console.log(`  ${entry.setName}: ${entry.playerName} - ${entry.team}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
