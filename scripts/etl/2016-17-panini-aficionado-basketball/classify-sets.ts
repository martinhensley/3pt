import * as fs from 'fs';
import * as path from 'path';

const jsonPath = path.join(__dirname, 'Basketball2016PaniniAficionado__data.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

interface CardRow {
  'Card Set': string;
  '#': number;
  'Player': string;
  'Team': string;
  'Seq.': number;
}

interface SetInfo {
  name: string;
  type: 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';
  isParallel: boolean;
  baseSetName: string | null;
  parallelVariant: string | null;
  printRun: number | null;
  cards: CardRow[];
}

// Known parallel suffixes and their print runs
const PRINT_RUN_MAP: Record<string, number> = {
  'Artist\'s Proof Red': 1,      // /1
  'Artist\'s Proof Bronze': 25,  // /25
  'Artist\'s Proof Gold': 10,    // /10
  'Artist\'s Proof': 75,         // /75 (unnumbered Artist's Proof)
  'Prime': 149,                  // /149
  'Tip-off': 299,                // /299
};

function classifySetType(setName: string): 'Base' | 'Insert' | 'Autograph' | 'Memorabilia' {
  const lower = setName.toLowerCase();

  // Autograph sets
  if (lower.includes('signature') || lower.includes('ink') || lower.includes('autograph')) {
    return 'Autograph';
  }

  // Memorabilia sets
  if (lower.includes('memorabilia') || lower.includes('jersey') || lower.includes('materials')) {
    return 'Memorabilia';
  }

  // Base sets
  if (lower.includes('base set') || lower.includes('opening night')) {
    return 'Base';
  }

  // Everything else is Insert
  return 'Insert';
}

function extractParallelInfo(setName: string): {
  baseSetName: string;
  variantName: string | null;
  printRun: number | null;
  isParallel: boolean;
} {
  // Check for known parallel suffixes
  for (const [suffix, printRun] of Object.entries(PRINT_RUN_MAP)) {
    if (setName.endsWith(' ' + suffix)) {
      const baseSetName = setName.substring(0, setName.length - suffix.length - 1);
      return {
        baseSetName,
        variantName: suffix,
        printRun,
        isParallel: true
      };
    }
  }

  // Not a parallel
  return {
    baseSetName: setName,
    variantName: null,
    printRun: null,
    isParallel: false
  };
}

// Group cards by set
const cardsBySet = new Map<string, CardRow[]>();
for (const row of rawData as CardRow[]) {
  const setName = row['Card Set'];
  if (!cardsBySet.has(setName)) {
    cardsBySet.set(setName, []);
  }
  cardsBySet.get(setName)!.push(row);
}

// Classify each set
const sets: SetInfo[] = [];
for (const [setName, cards] of cardsBySet.entries()) {
  const parallelInfo = extractParallelInfo(setName);
  const setType = classifySetType(parallelInfo.baseSetName);

  sets.push({
    name: setName,
    type: setType,
    isParallel: parallelInfo.isParallel,
    baseSetName: parallelInfo.baseSetName !== setName ? parallelInfo.baseSetName : null,
    parallelVariant: parallelInfo.variantName,
    printRun: parallelInfo.printRun,
    cards
  });
}

// Sort sets: Base first, then Insert, then Autograph, then Memorabilia
// Within each type: non-parallels first, then parallels
sets.sort((a, b) => {
  const typeOrder = { Base: 1, Insert: 2, Autograph: 3, Memorabilia: 4 };
  if (typeOrder[a.type] !== typeOrder[b.type]) {
    return typeOrder[a.type] - typeOrder[b.type];
  }
  if (a.isParallel !== b.isParallel) {
    return a.isParallel ? 1 : -1;
  }
  return a.name.localeCompare(b.name);
});

// Display classification
console.log('📊 Set Classification Report\n');
console.log('='.repeat(80));

const baseType: Record<string, SetInfo[]> = {
  Base: [],
  Insert: [],
  Autograph: [],
  Memorabilia: []
};

for (const set of sets) {
  baseType[set.type].push(set);
}

let totalSets = 0;
let totalCards = 0;

for (const [type, typeSets] of Object.entries(baseType)) {
  if (typeSets.length === 0) continue;

  console.log(`\n${type} Sets (${typeSets.length}):`);
  console.log('-'.repeat(80));

  for (const set of typeSets) {
    const parallel = set.isParallel ? ` [Parallel of: ${set.baseSetName}]` : '';
    const printRun = set.printRun ? ` /${set.printRun}` : '';
    console.log(`  ${set.name}${parallel}${printRun}: ${set.cards.length} cards`);
    totalSets++;
    totalCards += set.cards.length;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\nTotal: ${totalSets} sets, ${totalCards} cards`);

console.log('\n\n📋 Summary by Type:');
console.log('-'.repeat(80));
for (const [type, typeSets] of Object.entries(baseType)) {
  if (typeSets.length === 0) continue;
  const typeCards = typeSets.reduce((sum, set) => sum + set.cards.length, 0);
  console.log(`  ${type}: ${typeSets.length} sets, ${typeCards} cards`);
}

// Save classification to JSON
const output = {
  release: {
    name: 'Aficionado Basketball',
    year: '2016-17',
    manufacturer: 'Panini'
  },
  sets: sets.map(s => ({
    name: s.name,
    type: s.type,
    isParallel: s.isParallel,
    baseSetName: s.baseSetName,
    parallelVariant: s.parallelVariant,
    printRun: s.printRun,
    cardCount: s.cards.length
  })),
  summary: {
    totalSets,
    totalCards,
    byType: Object.fromEntries(
      Object.entries(baseType).map(([type, typeSets]) => [
        type,
        {
          sets: typeSets.length,
          cards: typeSets.reduce((sum, set) => sum + set.cards.length, 0)
        }
      ])
    )
  }
};

fs.writeFileSync(
  path.join(__dirname, 'classification.json'),
  JSON.stringify(output, null, 2)
);

console.log('\n💾 Classification saved to: classification.json');
