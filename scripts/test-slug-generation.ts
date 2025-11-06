import { generateCardSlug } from '../lib/slugGenerator';

console.log('Testing card slug generation with print runs...\n');

// Test 1: Parallel card - should exclude "Base" from slug
const test1 = generateCardSlug(
  'Panini',
  'Obsidian Soccer',
  '2024-25',
  'Obsidian Base',
  '1',
  'Jude Bellingham',
  'Electric Etch Marble Flood 8',
  8
);
console.log('Test 1: Parallel card (should exclude "Base")');
console.log('  Expected: 2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8');
console.log('  Got:      ' + test1);
console.log('  Status:   ' + (test1 === '2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8' ? '✅ PASS' : '❌ FAIL'));
console.log();

// Test 2: Parallel WITHOUT print run in the name
const test2 = generateCardSlug(
  'Panini',
  'Obsidian Soccer',
  '2024-25',
  'Obsidian Base',
  '1',
  'Jude Bellingham',
  'Electric Etch Marble Flood',
  8
);
console.log('Test 2: Parallel without print run in name (should add it)');
console.log('  Expected: 2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8');
console.log('  Got:      ' + test2);
console.log('  Status:   ' + (test2 === '2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8' ? '✅ PASS' : '❌ FAIL'));
console.log();

// Test 3: Base card with variant matching set name
const test3 = generateCardSlug(
  'Panini',
  'Obsidian Soccer',
  '2024-25',
  'Obsidian Base',
  '1',
  'Jude Bellingham',
  'Obsidian Base',
  145
);
console.log('Test 3: Base card (variant = setName, both included)');
console.log('  Expected: 2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-obsidian-base-145');
console.log('  Got:      ' + test3);
console.log('  Status:   ' + (test3 === '2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-obsidian-base-145' ? '✅ PASS' : '❌ FAIL'));
console.log();

// Test 4: Base card with no variant
const test4 = generateCardSlug(
  'Panini',
  'Obsidian Soccer',
  '2024-25',
  'Obsidian Base',
  '1',
  'Jude Bellingham',
  null,
  145
);
console.log('Test 4: Base card with no variant (should keep setName)');
console.log('  Expected: 2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-145');
console.log('  Got:      ' + test4);
console.log('  Status:   ' + (test4 === '2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-145' ? '✅ PASS' : '❌ FAIL'));
console.log();

// Test 5: 1/1 parallel card
const test5 = generateCardSlug(
  'Panini',
  'Obsidian Soccer',
  '2024-25',
  'Obsidian Base',
  '1',
  'Jude Bellingham',
  'Gold Power 1/1',
  1
);
console.log('Test 5: 1/1 parallel card (should exclude "Base")');
console.log('  Expected: 2024-25-obsidian-soccer-1-jude-bellingham-gold-power-1-of-1');
console.log('  Got:      ' + test5);
console.log('  Status:   ' + (test5 === '2024-25-obsidian-soccer-1-jude-bellingham-gold-power-1-of-1' ? '✅ PASS' : '❌ FAIL'));
console.log();
