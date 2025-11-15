/**
 * Utility functions for working with sets and parallels
 */

/**
 * Check if a set is a parallel based on its slug
 * Parallels are identified by containing "-parallel" in the slug
 */
export function isParallelSet(slug: string): boolean {
  return slug.includes('-parallel');
}

/**
 * Extract the base set slug from a parallel set slug
 * Example: "2024-25-donruss-soccer-optic-cubic-parallel-99" → "2024-25-donruss-soccer-optic"
 */
export function getBaseSetSlug(parallelSlug: string): string {
  if (!isParallelSet(parallelSlug)) {
    return parallelSlug;
  }

  // Find the position of "-parallel"
  const parallelIndex = parallelSlug.indexOf('-parallel');
  if (parallelIndex === -1) {
    return parallelSlug;
  }

  // Extract everything before the last segment before "-parallel"
  // We need to identify where the base set name ends and the parallel variant begins
  const beforeParallel = parallelSlug.substring(0, parallelIndex);
  const parts = beforeParallel.split('-');

  // Heuristic: The parallel variant name is typically 1-3 words before "-parallel"
  // We'll look for common patterns:
  // - Single variant: "cubic-parallel"
  // - Color variant: "blue-cubic-parallel"
  // - Complex variant: "electric-etch-orange-parallel"

  // For now, we'll use a simple approach: find the year-manufacturer-release-setname pattern
  // This assumes the format: year-manufacturer-sport-setname-variantname-parallel[-printrun]

  // Count segments: typically year (1) + release name (2-3) + base set name (1-2)
  // Let's be conservative and assume at least 4 segments for the base
  // (e.g., "2024-25-donruss-soccer-optic")

  // Actually, let's be smarter: look for known set name patterns
  const setNamePatterns = ['base', 'optic', 'rated-rookies', 'kaboom', 'downtown', 'animation',
                          'crunch-time', 'kit-kings', 'kit-series', 'magicians', 'net-marvels',
                          'night-moves', 'pitch-kings', 'rookie-kings', 'the-rookies', 'zero-gravity',
                          'beautiful-game', 'signature-series', 'dual-jersey-ink'];

  // Find the last occurrence of any set name pattern
  let lastSetIndex = -1;
  for (const pattern of setNamePatterns) {
    const index = beforeParallel.lastIndexOf(pattern);
    if (index > -1) {
      // Find how many segments from the start this is
      const upToPattern = beforeParallel.substring(0, index + pattern.length);
      const segmentCount = upToPattern.split('-').length;
      if (segmentCount > lastSetIndex) {
        lastSetIndex = segmentCount;
      }
    }
  }

  if (lastSetIndex > -1) {
    return parts.slice(0, lastSetIndex).join('-');
  }

  // Fallback: assume the first 4-5 segments are the base set
  // This handles: year(1-2) + manufacturer(1) + sport(1) + setname(1)
  return parts.slice(0, Math.min(5, parts.length - 1)).join('-');
}

/**
 * Extract parallel variant name from a parallel set slug
 * Example: "2024-25-donruss-soccer-optic-cubic-parallel-99" → "cubic"
 * Example: "2024-25-donruss-soccer-optic-blue-cubic-parallel-99" → "blue-cubic"
 */
export function getParallelVariant(parallelSlug: string): string | null {
  if (!isParallelSet(parallelSlug)) {
    return null;
  }

  const baseSlug = getBaseSetSlug(parallelSlug);
  const parallelIndex = parallelSlug.indexOf('-parallel');

  // Extract the part between base slug and "-parallel"
  const variantPart = parallelSlug.substring(baseSlug.length + 1, parallelIndex);

  return variantPart || null;
}

/**
 * Extract print run from a parallel set slug
 * Example: "2024-25-donruss-soccer-optic-cubic-parallel-99" → 99
 * Example: "2024-25-donruss-soccer-optic-cubic-parallel" → null
 */
export function getParallelPrintRun(parallelSlug: string): number | null {
  if (!isParallelSet(parallelSlug)) {
    return null;
  }

  const parts = parallelSlug.split('-');
  const parallelIndex = parts.indexOf('parallel');

  // Check if there's a segment after "parallel"
  if (parallelIndex < parts.length - 1) {
    const printRun = parseInt(parts[parallelIndex + 1], 10);
    return isNaN(printRun) ? null : printRun;
  }

  return null;
}

/**
 * Sort sets with the following order:
 * 1. Non-parallel sets first (alphabetical)
 * 2. Parallel sets without print runs (alphabetical by variant)
 * 3. Parallel sets with print runs (highest to lowest)
 */
export function sortSets<T extends { slug: string; printRun?: number | null }>(sets: T[]): T[] {
  return sets.sort((a, b) => {
    const aIsParallel = isParallelSet(a.slug);
    const bIsParallel = isParallelSet(b.slug);

    // Non-parallels come first
    if (!aIsParallel && bIsParallel) return -1;
    if (aIsParallel && !bIsParallel) return 1;

    // Both non-parallel: sort alphabetically
    if (!aIsParallel && !bIsParallel) {
      return a.slug.localeCompare(b.slug);
    }

    // Both parallel: check print runs
    const aPrintRun = a.printRun ?? getParallelPrintRun(a.slug);
    const bPrintRun = b.printRun ?? getParallelPrintRun(b.slug);

    // Parallels without print runs come before those with print runs
    if (!aPrintRun && bPrintRun) return -1;
    if (aPrintRun && !bPrintRun) return 1;

    // Both have print runs: sort highest to lowest
    if (aPrintRun && bPrintRun) {
      return bPrintRun - aPrintRun;
    }

    // Both without print runs: sort alphabetically by variant
    const aVariant = getParallelVariant(a.slug) ?? '';
    const bVariant = getParallelVariant(b.slug) ?? '';
    return aVariant.localeCompare(bVariant);
  });
}

/**
 * Group sets by their base set
 * Returns a map where keys are base set slugs and values are arrays of related sets
 */
export function groupSetsByBase<T extends { slug: string }>(sets: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const set of sets) {
    const baseSlug = getBaseSetSlug(set.slug);
    if (!groups.has(baseSlug)) {
      groups.set(baseSlug, []);
    }
    groups.get(baseSlug)!.push(set);
  }

  // Sort sets within each group
  for (const [baseSlug, groupSets] of groups) {
    groups.set(baseSlug, sortSets(groupSets));
  }

  return groups;
}