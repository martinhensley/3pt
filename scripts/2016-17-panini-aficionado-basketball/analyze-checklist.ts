import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const checklistPath = '/Users/mh/Desktop/2016-17-Panini-Aficionado-NBA-Basketball-Cards-Checklist.xls';

console.log('📥 Reading Excel file...');
const workbook = XLSX.readFile(checklistPath);

console.log('\n📋 Workbook Info:');
console.log('Sheet Names:', workbook.SheetNames);

// Process each sheet
for (const sheetName of workbook.SheetNames) {
  console.log(`\n\n=== Sheet: ${sheetName} ===`);

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  console.log(`Total rows: ${jsonData.length}`);

  if (jsonData.length > 0) {
    console.log('\nColumns:', Object.keys(jsonData[0]));
    console.log('\nFirst 5 rows:');
    console.log(JSON.stringify(jsonData.slice(0, 5), null, 2));

    // Group by set to understand structure
    const cardsBySet = new Map<string, any[]>();

    for (const row of jsonData as any[]) {
      // Try different possible column names
      const setName = row['Card Set'] || row['Set'] || row['Set Name'] || row['set'] || '';
      const cardNumber = row['Card Number'] || row['Number'] || row['#'] || row['card_number'] || '';
      const player = row['Player'] || row['Player Name'] || row['player'] || '';

      if (setName && cardNumber && player) {
        if (!cardsBySet.has(setName)) {
          cardsBySet.set(setName, []);
        }
        cardsBySet.get(setName)!.push(row);
      }
    }

    console.log(`\n📊 Sets found: ${cardsBySet.size}`);
    console.log('\nSets breakdown:');

    // Sort sets by name and show counts
    const sortedSets = Array.from(cardsBySet.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [setName, cards] of sortedSets) {
      console.log(`  ${setName}: ${cards.length} cards`);
    }

    // Save full JSON for reference
    const outputPath = path.join(__dirname, `${sheetName.replace(/[^a-z0-9]/gi, '_')}_data.json`);
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
    console.log(`\n💾 Saved to: ${outputPath}`);
  }
}

console.log('\n✅ Analysis complete!');
