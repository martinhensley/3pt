// Test script to verify parallel link generation
const parallelType = "Electric Etch Green /5";

// Generate parallel slug (just the parallel name part)
const parallelSlug = parallelType
  .toLowerCase()
  .replace(/\b1\s*\/\s*1\b/gi, '1-of-1')        // Convert "1/1" to "1-of-1"
  .replace(/\b1\s*of\s*1\b/gi, '1-of-1')        // Convert "1 of 1" to "1-of-1"
  .replace(/\s*\/\s*(\d+)/g, '-$1')              // Convert " /44" to "-44"
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const baseSetSlug = '2024-25-obsidian-soccer-base';
const expectedUrl = `/sets/${baseSetSlug}/parallels/${parallelSlug}`;

console.log('Parallel Type:', parallelType);
console.log('Generated Slug:', parallelSlug);
console.log('Expected URL:', expectedUrl);
console.log('\nTest URL would be:');
console.log(`http://localhost:3005${expectedUrl}`);
