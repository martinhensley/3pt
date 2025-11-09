import { generateSetSlug } from '../lib/slugGenerator';

console.log('=== EXPECTED SLUGS FOR 2024-25 PANINI OBSIDIAN SOCCER ===\n');

console.log('--- BASE SET (Obsidian Base) ---');
console.log('Set Type: Base');
console.log('Set Name: "Obsidian Base"');
console.log('Expected Slug:', generateSetSlug('2024-25', 'Panini Obsidian Soccer', 'Obsidian Base', 'Base'));
console.log('URL: http://localhost:3000/sets/' + generateSetSlug('2024-25', 'Panini Obsidian Soccer', 'Obsidian Base', 'Base'));

console.log('\n--- BASE SET PARALLELS ---');
const baseParallels = [
  'Electric Etch Orange /99',
  'Electric Etch Purple /75',
  'Electric Etch Green Flood /25',
  'Electric Etch Red Pulsar /44 or fewer',
  'Electric Etch Marble Flood /8',
  'Electric Etch Neon Pink 1/1',
  'Volcanic /99',
  'Vitreous /75',
  'Interstellar /50',
  'Tunnel Vision /25',
  'Gold Power 1/1'
];

baseParallels.forEach(parallel => {
  const slug = generateSetSlug('2024-25', 'Panini Obsidian Soccer', 'Obsidian Base', 'Base', parallel);
  console.log(`\nParallel: "${parallel}"`);
  console.log('Expected Slug:', slug);
  console.log('URL: http://localhost:3000/sets/' + slug);
});

console.log('\n\n--- EQUINOX INSERT SET ---');
console.log('Set Type: Insert');
console.log('Set Name: "Equinox"');
console.log('Expected Slug:', generateSetSlug('2024-25', 'Panini Obsidian Soccer', 'Equinox', 'Insert'));
console.log('URL: http://localhost:3000/sets/' + generateSetSlug('2024-25', 'Panini Obsidian Soccer', 'Equinox', 'Insert'));

console.log('\n--- EQUINOX PARALLELS ---');
const equinoxParallels = [
  'Orange /99',
  'Purple /75',
  'Green /25',
  'Red /5',
  'Gold 1/1'
];

equinoxParallels.forEach(parallel => {
  const slug = generateSetSlug('2024-25', 'Panini Obsidian Soccer', 'Equinox', 'Insert', parallel);
  console.log(`\nParallel: "${parallel}"`);
  console.log('Expected Slug:', slug);
  console.log('URL: http://localhost:3000/sets/' + slug);
});

console.log('\n\n=== KEY OBSERVATIONS ===');
console.log('1. Base set: "Obsidian Base" becomes "2024-25-panini-obsidian-soccer-base"');
console.log('2. Base parallels: Exclude "base" from path, e.g., "2024-25-panini-obsidian-soccer-electric-etch-orange-99"');
console.log('3. Insert set: "Equinox" becomes "2024-25-panini-obsidian-soccer-insert-equinox"');
console.log('4. Insert parallels: Include set name, e.g., "2024-25-panini-obsidian-soccer-equinox-orange-99" (NOT "insert-orange")');
console.log('5. Print runs: "/99" becomes "-99", "1/1" becomes "1-of-1"');
console.log('6. Parallel names: Clean, no "Base Set Checklist" prefix');
