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
export function sortSets<T extends { slug: string; printRun?: number | null; name?: string }>(sets: T[]): T[] {
  return sets.sort((a, b) => {
    const aIsParallel = isParallelSet(a.slug);
    const bIsParallel = isParallelSet(b.slug);

    // Non-parallels come first
    if (!aIsParallel && bIsParallel) return -1;
    if (aIsParallel && !bIsParallel) return 1;

    // Both non-parallel: sort alphabetically
    if (!aIsParallel && !bIsParallel) {
      // If name is available, use it for better sorting
      if (a.name && b.name) {
        return a.name.localeCompare(b.name);
      }
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
      if (bPrintRun !== aPrintRun) {
        return bPrintRun - aPrintRun;
      }
      // Same print run: sort alphabetically by name or variant
      if (a.name && b.name) {
        return a.name.localeCompare(b.name);
      }
    }

    // Both without print runs: sort alphabetically by name or variant
    if (a.name && b.name) {
      return a.name.localeCompare(b.name);
    }
    const aVariant = getParallelVariant(a.slug) ?? '';
    const bVariant = getParallelVariant(b.slug) ?? '';
    return aVariant.localeCompare(bVariant);
  });
}

/**
 * Parse set name to extract base name and variant
 * Used for proper grouping of all sets with their parallels
 */
function parseSetName(name: string): { baseName: string; variant: string } {
  // Special cases for Base and Optic
  if (name === 'Base') return { baseName: 'Base', variant: '' };
  if (name === 'Optic') return { baseName: 'Optic', variant: '' };
  if (name.startsWith('Base ')) return { baseName: 'Base', variant: name.substring(5) };
  if (name.startsWith('Optic ')) return { baseName: 'Optic', variant: name.substring(6) };

  // Check for Artist's Proof variants first (they contain color words)
  // Pattern: "Set Name Artist's Proof [Gold|Red|Bronze]"
  const artistProofPattern = /^(.+?)\s+Artist's Proof\s*(Gold|Red|Bronze)?$/i;
  const artistMatch = name.match(artistProofPattern);

  if (artistMatch) {
    const baseName = artistMatch[1].trim();
    const variant = artistMatch[2]
      ? `Artist's Proof ${artistMatch[2]}`  // e.g., "Artist's Proof Gold"
      : "Artist's Proof";  // Just "Artist's Proof" with no color
    return { baseName, variant };
  }

  // Check for Prime variants
  if (name.endsWith(' Prime')) {
    const baseName = name.substring(0, name.length - 6).trim();
    return { baseName, variant: 'Prime' };
  }

  // Check for Tip-off variants
  if (name.endsWith(' Tip-off')) {
    const baseName = name.substring(0, name.length - 8).trim();
    return { baseName, variant: 'Tip-off' };
  }

  // Check for Press Proof variants (common in Donruss)
  // Pattern: "Set Name Press Proof [Color]" or "Set Name Press Proof" (unnumbered)
  const pressProofPattern = /^(.+?)\s+Press Proof(?:\s+(Silver|Gold|Black|Blue|Red|Purple|Green|Orange))?$/i;
  const pressProofMatch = name.match(pressProofPattern);

  if (pressProofMatch) {
    const baseName = pressProofMatch[1].trim();
    const variant = pressProofMatch[2]
      ? `Press Proof ${pressProofMatch[2]}`
      : 'Press Proof';
    return { baseName, variant };
  }

  // Check for Holo Laser variants (common in Donruss)
  // Pattern: "Set Name Holo [Color(s)] Laser"
  const holoLaserPattern = /^(.+?)\s+Holo\s+(.+?)\s+Laser$/i;
  const holoLaserMatch = name.match(holoLaserPattern);

  if (holoLaserMatch) {
    const baseName = holoLaserMatch[1].trim();
    const variant = `Holo ${holoLaserMatch[2]} Laser`;
    return { baseName, variant };
  }

  // Check for simple Holo variants
  // Pattern: "Set Name Holo"
  if (name.endsWith(' Holo')) {
    const baseName = name.substring(0, name.length - 5).trim();
    return { baseName, variant: 'Holo' };
  }

  // Check for Patch/Tag variants (common in Tools of the Trade)
  // Pattern: "Set Name Patch" or "Set Name Tag"
  if (name.endsWith(' Patch')) {
    const baseName = name.substring(0, name.length - 6).trim();
    return { baseName, variant: 'Patch' };
  }

  if (name.endsWith(' Tag')) {
    const baseName = name.substring(0, name.length - 4).trim();
    return { baseName, variant: 'Tag' };
  }

  // For other sets, extract the base name by removing color/variant suffixes
  // Common patterns: "Set Name Red", "Set Name Gold", "Set Name Black", etc.
  const colorPattern = /\s+(Red|Blue|Gold|Silver|Black|Pink|Green|Purple|Orange|Aqua|Teal|Dragon Scale|Plum Blossom|Pink Ice|Pink Velocity|Argyle|Ice|Velocity|Cubic|Diamond|Mojo|Power|Pandora|Green Vinyl|Gold Vinyl)(\s+\d+)?$/i;
  const match = name.match(colorPattern);

  if (match) {
    const baseName = name.substring(0, match.index).trim();
    const variant = match[0].trim();
    return { baseName, variant };
  }

  // No variant found, this is a base set
  return { baseName: name, variant: '' };
}

/**
 * Enhanced sorting that properly groups sets with their parallels
 * Groups sets by their base name, then applies parallel/print run rules within each group
 */
export function sortSetsGrouped<T extends { slug: string; printRun?: number | null; name: string; isParallel?: boolean }>(sets: T[]): T[] {
  // First, group sets by their base name
  const groups = new Map<string, T[]>();

  sets.forEach(set => {
    const { baseName } = parseSetName(set.name);
    if (!groups.has(baseName)) {
      groups.set(baseName, []);
    }
    groups.get(baseName)!.push(set);
  });

  // Sort sets within each group
  groups.forEach((groupSets, baseName) => {
    groupSets.sort((a, b) => {
      const aParsed = parseSetName(a.name);
      const bParsed = parseSetName(b.name);

      // Base set (no variant) comes first
      if (aParsed.variant === '' && bParsed.variant !== '') return -1;
      if (aParsed.variant !== '' && bParsed.variant === '') return 1;

      // Both are variants - apply print run rules
      const aPrintRun = a.printRun || 0;
      const bPrintRun = b.printRun || 0;

      // Variants without print runs come before those with print runs
      if (aPrintRun === 0 && bPrintRun !== 0) return -1;
      if (aPrintRun !== 0 && bPrintRun === 0) return 1;

      // Both have print runs: highest to lowest
      if (aPrintRun !== 0 && bPrintRun !== 0) {
        if (aPrintRun !== bPrintRun) {
          return bPrintRun - aPrintRun;
        }
      }

      // Same print run or both without: alphabetical by variant
      return aParsed.variant.localeCompare(bParsed.variant);
    });
  });

  // Sort the groups themselves
  const sortedGroupNames = Array.from(groups.keys()).sort((a, b) => {
    // Special ordering: Base first, then Optic, then alphabetical
    if (a === 'Base' && b !== 'Base') return -1;
    if (b === 'Base' && a !== 'Base') return 1;
    if (a === 'Optic' && b !== 'Optic') return -1;
    if (b === 'Optic' && a !== 'Optic') return 1;
    return a.localeCompare(b);
  });

  // Flatten the sorted groups into a single array
  const result: T[] = [];
  sortedGroupNames.forEach(baseName => {
    result.push(...groups.get(baseName)!);
  });

  return result;
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