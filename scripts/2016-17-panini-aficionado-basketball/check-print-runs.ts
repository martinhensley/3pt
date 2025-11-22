import * as XLSX from 'xlsx';

const checklistPath = '/Users/mh/Desktop/2016-17-Panini-Aficionado-NBA-Basketball-Cards-Checklist.xls';

console.log('📥 Reading Excel file to check print runs...\n');
const workbook = XLSX.readFile(checklistPath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

// Look for Base sets and their Seq. values (which might indicate print runs)
const baseSets = (jsonData as any[]).filter(row => {
  const setName = row['Card Set'];
  return setName && (
    setName === 'Base Set' ||
    setName.includes('Base') ||
    setName.includes('Tip-off') ||
    setName.includes('Artist\'s Proof')
  );
});

console.log('Base Set Variants and Their Seq. Values:\n');

const setSeqMap = new Map<string, Set<any>>();

for (const row of baseSets) {
  const setName = row['Card Set'];
  if (!setSeqMap.has(setName)) {
    setSeqMap.set(setName, new Set());
  }
  if (row['Seq.']) {
    setSeqMap.get(setName)!.add(row['Seq.']);
  }
}

for (const [setName, seqValues] of Array.from(setSeqMap.entries()).sort()) {
  const uniqueSeqs = Array.from(seqValues).sort((a, b) => a - b);
  console.log(`${setName}:`);
  console.log(`  Seq values: ${uniqueSeqs.join(', ')}`);
  console.log(`  Interpretation: ${uniqueSeqs.length === 1 && uniqueSeqs[0] ? `/${uniqueSeqs[0]}` : 'Unnumbered'}`);
  console.log();
}

// Also check some Insert sets for comparison
console.log('\n\nInsert Set Examples:\n');

const insertSets = ['Authentics', 'Authentics Prime', 'Global Reach Artist\'s Proof Gold', 'Global Reach Artist\'s Proof Red'];

for (const setName of insertSets) {
  const rows = (jsonData as any[]).filter(row => row['Card Set'] === setName);
  if (rows.length > 0) {
    const seqs = new Set(rows.map(r => r['Seq.']).filter(Boolean));
    const uniqueSeqs = Array.from(seqs).sort((a, b) => a - b);
    console.log(`${setName}:`);
    console.log(`  Seq values: ${uniqueSeqs.join(', ')}`);
    console.log(`  Cards: ${rows.length}`);
    console.log();
  }
}
