/**
 * Generate a URL-friendly slug from release information
 * Format: year-manufacturer-name (e.g., "2024-25-panini-donruss-soccer")
 */
export function generateReleaseSlug(manufacturer: string, name: string, year?: string): string {
  const parts = [year, manufacturer, name].filter(Boolean);
  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a URL-friendly slug from set information
 *
 * New simplified format:
 * - Base set: "2024-25-donruss-soccer-base"
 * - Base parallel: "2024-25-donruss-soccer-cubic-parallel" or "2024-25-donruss-soccer-blue-cubic-parallel-99"
 * - Insert set: "2024-25-donruss-soccer-kaboom"
 * - Insert parallel: "2024-25-donruss-soccer-kaboom-gold-parallel-10"
 *
 * Parallel naming convention:
 * - Parallels are identified by "-parallel" suffix
 * - Format: {base-set-slug}-{variant-name}-parallel[-{printrun}]
 * - Examples:
 *   - "cubic-parallel" (no print run)
 *   - "blue-cubic-parallel-99" (print run 99)
 *   - "gold-power-parallel-1" (1/1 parallel)
 *
 * Special handling:
 * - "1/1" or "1 of 1" -> converted to "-1" in print run
 */
export function generateSetSlug(
  year: string,
  releaseName: string,
  setName: string,
  setType: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
  parallelName?: string,
  printRun?: number | null
): string {
  // For Donruss sets specifically: special handling of "Base" and "Optic" names
  let processedSetName = setName;

  // Handle Donruss Optic naming
  if (setName.toLowerCase().includes('optic')) {
    // "Optic Base Set", "Base Optic", etc. → "optic"
    processedSetName = 'optic';
  } else if (setName.toLowerCase() === 'base' ||
             setName.toLowerCase() === 'base set' ||
             setName.toLowerCase() === 'base checklist') {
    // Regular base sets → "base"
    processedSetName = 'base';
  } else {
    // For non-base sets, clean up the name
    processedSetName = setName
      .replace(/\bset\b/gi, '')
      .replace(/\bchecklist\b/gi, '')
      .trim();
  }

  // If this is a parallel, append the parallel naming convention
  if (parallelName) {
    // Clean the parallel name
    const cleanParallel = parallelName
      .replace(/\b1\s*\/\s*1\b/gi, '1 of 1')  // Normalize 1/1 variations
      .replace(/\b1\s*of\s*1\b/gi, '1 of 1')  // Normalize to "1 of 1"
      .replace(/\s*\/\s*\d+$/g, '')           // Remove trailing print runs like "/99"
      .trim();

    // Build the parts for a parallel set slug
    const parts = [year, releaseName, processedSetName, cleanParallel, 'parallel'];

    // Add print run if provided (including 1 for 1/1 cards)
    if (printRun) {
      parts.push(printRun.toString());
    }

    return parts
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  } else {
    // Non-parallel set
    const parts = [year, releaseName, processedSetName];

    return parts
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

/**
 * Generate a URL-friendly slug from card information
 *
 * Format for base cards: year-release-set-cardnumber-playername
 * Example: "2024-25-donruss-soccer-optic-2-malik-tillman"
 *
 * Format for parallel cards: year-release-cardnumber-playername-parallelname
 * Example: "2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8"
 *
 * Special handling:
 * - For parallel cards, the set name is excluded (parallel name is more specific)
 * - 1/1 cards: "1/1" or "1 of 1" -> "1-of-1" in slugs
 * - Print runs: Not added if already present at the end of variant
 */
export function generateCardSlug(
  manufacturer: string,
  releaseName: string,
  year: string,
  setName: string,
  cardNumber: string,
  playerName: string,
  variant: string | null,
  printRun?: number | null
): string {
  // Special handling for 1/1 cards - convert to "1-of-1" before slug generation
  const processedVariant = variant
    ? variant
        .replace(/\b1\s*\/\s*1\b/gi, '1-of-1')  // Match "1/1", "1 / 1", etc.
        .replace(/\b1\s*of\s*1\b/gi, '1-of-1')  // Match "1 of 1", etc.
    : null;

  // Check if the variant already ends with the print run number
  // If so, don't add the print run again to avoid duplicates like "-8-8"
  // Also handle 1/1 cards - if variant ends with "1-of-1" and printRun is 1, don't add it
  const variantEndsWithPrintRun = processedVariant && printRun && (
    processedVariant.trim().endsWith(` ${printRun}`) ||
    (printRun === 1 && processedVariant.trim().endsWith('1-of-1'))
  );

  // Detect if this is a parallel card by checking if variant is different from setName
  // For parallel cards, we exclude the setName to avoid redundancy
  // e.g., "2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8"
  // instead of "2024-25-obsidian-soccer-base-1-jude-bellingham-electric-etch-marble-flood-8"
  const isParallelCard = processedVariant &&
    processedVariant.toLowerCase() !== setName.toLowerCase() &&
    !processedVariant.toLowerCase().includes('base');

  const parts = [
    year,
    releaseName,
    // Only include setName for base cards, not for parallels
    isParallelCard ? null : setName,
    cardNumber,
    playerName,
    processedVariant,
    // Only add print run if it's not already at the end of the variant
    (printRun && !variantEndsWithPrintRun) ? printRun.toString() : null
  ].filter(Boolean);

  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
