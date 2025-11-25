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

    // Add print run if provided
    // For 1/1 sets, use "1-of-1" instead of just "1"
    if (printRun) {
      parts.push(printRun === 1 ? '1-of-1' : printRun.toString());
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
 * Format for base parallel cards: year-release-cardnumber-playername-parallelname
 * Example: "2024-25-donruss-soccer-1-jude-bellingham-pink-velocity-99"
 *
 * Format for insert/auto/mem cards: year-release-set-cardnumber-playername-variant
 * Example: "2024-25-donruss-soccer-beautiful-game-autographs-9-abby-dahlkemper-black-1"
 *
 * Special handling:
 * - Base set parallels exclude the set name (parallel name is more specific)
 * - Insert/Autograph/Memorabilia cards ALWAYS include set name
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
  printRun?: number | null,
  setType?: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other'
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

  // Determine if we should exclude the set name from the slug
  // ONLY exclude set name for Base set parallels (e.g., Optic Pink Velocity)
  // For Insert, Autograph, and Memorabilia sets, ALWAYS include the set name
  let excludeSetName = false;

  if (setType === 'Base' || !setType) {
    // Only for Base sets (or when setType is not provided for backward compatibility),
    // check if this is a parallel card that should exclude the set name
    const isBaseSetParallel = processedVariant &&
      processedVariant.toLowerCase() !== setName.toLowerCase() &&
      !processedVariant.toLowerCase().includes('base');

    excludeSetName = isBaseSetParallel;
  }
  // For Insert, Autograph, Memorabilia, Other - never exclude set name

  const parts = [
    year,
    releaseName,
    // Include setName for all cards EXCEPT base set parallels
    excludeSetName ? null : setName,
    cardNumber,
    playerName,
    processedVariant,
    // Only add print run if it's not already at the end of the variant
    // For 1/1 cards, use "1-of-1" instead of just "1"
    (printRun && !variantEndsWithPrintRun) ? (printRun === 1 ? '1-of-1' : printRun.toString()) : null
  ].filter(Boolean);

  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
