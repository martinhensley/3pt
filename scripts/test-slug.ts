const parallel = "Gold Power – 1 of 1";
const parallelSlug = parallel
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .replace(/1-of-1/g, '1of1');

console.log('Parallel:', parallel);
console.log('Slug:', parallelSlug);
console.log('Expected: gold-power-1of1');
