import { generateSetSlug } from '../lib/slugGenerator';

console.log('🧪 Testing parallel slug generation logic\n');

const year = '2024-25';
const releaseName = 'Obsidian Soccer';

console.log('=== BASE SET PARALLELS (no type prefix) ===');
console.log(generateSetSlug(year, releaseName, 'Base Set', 'Base', 'Electric Etch Green /5'));
console.log('Expected: 2024-25-obsidian-soccer-electric-etch-green-5\n');

console.log('=== INSERT SET PARALLELS (with "insert" prefix) ===');
console.log(generateSetSlug(year, releaseName, 'Equinox', 'Insert', 'Electric Etch Green /5'));
console.log('Expected: 2024-25-obsidian-soccer-insert-electric-etch-green-5\n');

console.log('=== AUTO SET PARALLELS (with "auto" prefix) ===');
console.log(generateSetSlug(year, releaseName, 'Dual Jersey Ink', 'Autograph', 'Electric Etch Green /5'));
console.log('Expected: 2024-25-obsidian-soccer-auto-electric-etch-green-5\n');

console.log('=== MEMORABILIA SET PARALLELS (with "mem" prefix) ===');
console.log(generateSetSlug(year, releaseName, 'Volcanic Material', 'Memorabilia', 'Electric Etch Green /5'));
console.log('Expected: 2024-25-obsidian-soccer-mem-electric-etch-green-5\n');

console.log('=== PARENT SETS (include type and name) ===');
console.log(generateSetSlug(year, releaseName, 'Base Set', 'Base'));
console.log('Expected: 2024-25-obsidian-soccer-base\n');

console.log(generateSetSlug(year, releaseName, 'Equinox', 'Insert'));
console.log('Expected: 2024-25-obsidian-soccer-insert-equinox\n');

console.log(generateSetSlug(year, releaseName, 'Dual Jersey Ink', 'Autograph'));
console.log('Expected: 2024-25-obsidian-soccer-auto-dual-jersey-ink\n');

console.log('✅ All tests complete!');
