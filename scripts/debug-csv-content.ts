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

  console.log('=== CSV COLUMN HEADERS ===');
  const firstLine = csvFile.content.split('\n')[0];
  console.log(firstLine);

  console.log('\n=== SAMPLE RECORDS ===');

  const records = parse(csvFile.content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`Total records: ${records.length}`);
  console.log('\nFirst 5 records:');

  for (let i = 0; i < Math.min(5, records.length); i++) {
    const record = records[i] as any;
    console.log(`\nRecord ${i + 1}:`);
    console.log(JSON.stringify(record, null, 2));
  }

  // Search for any record containing "College"
  console.log('\n=== SEARCHING FOR "College" ===');
  let found = 0;
  for (let i = 0; i < records.length; i++) {
    const record = records[i] as any;
    const recordStr = JSON.stringify(record);
    if (recordStr.includes('College')) {
      found++;
      if (found <= 3) {
        console.log(`\nFound at record ${i + 1}:`);
        console.log(JSON.stringify(record, null, 2));
      }
    }
  }
  console.log(`\nTotal records containing "College": ${found}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
