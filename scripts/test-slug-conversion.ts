// Test bidirectional slug conversion

const testCases = [
  "Electric Etch Green /5",
  "Electric Etch Blue Finite 1 of 1",
  "Electric Etch Red Pulsar /44",
];

console.log('Testing Parallel Slug Conversion (bidirectional)\n');

testCases.forEach(parallelType => {
  // Step 1: Convert parallel type to slug (frontend)
  const parallelSlug = parallelType
    .toLowerCase()
    .replace(/\b1\s*\/\s*1\b/gi, '1-of-1')
    .replace(/\b1\s*of\s*1\b/gi, '1-of-1')
    .replace(/\s*\/\s*(\d+)/g, '-$1')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Step 2: Convert slug back to parallel name (API)
  let parallelNameFromSlug = parallelSlug
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Handle 1-of-1 cases: keep as "1 of 1" (database format)
  if (parallelNameFromSlug.includes('1 Of 1')) {
    parallelNameFromSlug = parallelNameFromSlug.replace(/1 Of 1/gi, '1 of 1');
  }
  // Handle regular print runs: if last word is a number, convert it to "/N"
  else if (/\s\d+$/.test(parallelNameFromSlug)) {
    parallelNameFromSlug = parallelNameFromSlug.replace(/\s(\d+)$/, ' /$1');
  }

  // Check if conversion is correct
  const matches = parallelNameFromSlug === parallelType;

  console.log(`Original:  ${parallelType}`);
  console.log(`Slug:      ${parallelSlug}`);
  console.log(`Converted: ${parallelNameFromSlug}`);
  console.log(`Match:     ${matches ? '✓' : '✗'}`);
  console.log('');
});
