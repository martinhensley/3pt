import * as fs from 'fs';
import * as path from 'path';

const jsonPath = path.join(__dirname, 'Basketball2016PaniniAficionado__data.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const emptySet = data.filter((r: any) => !r['Card Set'] || r['Card Set'].trim() === '');

console.log(`Cards with empty set name: ${emptySet.length}`);

if (emptySet.length > 0) {
  console.log('\nFirst 10 cards:');
  for (const card of emptySet.slice(0, 10)) {
    console.log(JSON.stringify(card, null, 2));
  }
}
