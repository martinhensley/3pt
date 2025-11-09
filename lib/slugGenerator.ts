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
 * Format: year-release-[type]-setname[-parallel]
 *
 * Examples:
 * - Base set: "2024-25-panini-obsidian-soccer-base"
 * - Base set parallel: "2024-25-panini-obsidian-soccer-base-electric-etch-red-pulsar"
 * - Autograph: "2024-25-panini-obsidian-soccer-auto-dual-jersey-ink"
 * - Autograph parallel: "2024-25-panini-obsidian-soccer-auto-dual-jersey-ink-electric-etch-orange"
 * - Memorabilia: "2024-25-panini-obsidian-soccer-mem-patches"
 * - Insert: "2024-25-panini-obsidian-soccer-insert-downtown"
 *
 * Special handling for set names:
 * - "Optic Base Set" -> "base" (not "base-optic")
 * - "Base Set" -> "base"
 *
 * Special handling for parallels:
 * - "1/1" or "1 of 1" -> "1-of-1"
 */
export function generateSetSlug(
  year: string,
  releaseName: string,
  setName: string,
  setType: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
  parallelName?: string
): string {
  // Clean set name: simplify base set names to avoid redundancy
  const cleanSetName = setName
    .replace(/\boptic\s+base\s+set\b/gi, 'base')      // Optic Base Set -> base
    .replace(/\boptic\s+base\b/gi, 'base')            // Optic Base -> base
    .replace(/\bbase\s+optic\b/gi, 'base')            // Base Optic -> base
    .replace(/\bobsidian\s+base\b/gi, 'base')         // Obsidian Base -> base
    .replace(/\bbase\s+set\b/gi, 'base')              // Base Set -> base
    .replace(/\bsets?\b/gi, '')                        // Remove remaining "set/sets"
    .replace(/\bchecklist\b/gi, '')                    // Remove "checklist"
    .trim();

  // Add type prefix (except for "Other")
  let typePrefix = '';
  switch (setType) {
    case 'Base':
      // For base sets, if the name isn't already "base", prepend it
      if (!cleanSetName.toLowerCase().includes('base')) {
        typePrefix = 'base';
      }
      break;
    case 'Autograph':
      typePrefix = 'auto';
      break;
    case 'Memorabilia':
      typePrefix = 'mem';
      break;
    case 'Insert':
      typePrefix = 'insert';
      break;
    case 'Other':
      // No prefix for Other
      break;
  }

  // Clean parallel name if provided (handle 1/1 cards and print runs)
  const cleanParallelName = parallelName
    ? parallelName
        .replace(/\bbase\s+set\s+checklist\b/gi, '')  // Remove "Base Set Checklist"
        .replace(/\bchecklist\b/gi, '')                // Remove "checklist"
        .replace(/\bbase\s+set\b/gi, '')               // Remove "Base Set"
        .replace(/\b1\s*\/\s*1\b/gi, '1-of-1')        // Convert "1/1" to "1-of-1"
        .replace(/\b1\s*of\s*1\b/gi, '1-of-1')        // Convert "1 of 1" to "1-of-1"
        .replace(/\s*\/\s*(\d+)/g, '-$1')              // Convert " /44" to "-44"
        .trim()
    : '';

  // For parallel sets, include type prefix for non-Base sets only
  // Base is the default, so no prefix needed
  // But auto, insert, and memorabilia parallels need their type prefix
  // e.g., "2024-25-obsidian-soccer-electric-etch-green-5" (base parallel, no prefix)
  // e.g., "2024-25-obsidian-soccer-auto-electric-etch-green-5" (auto parallel, needs prefix)
  const parts = cleanParallelName
    ? (setType === 'Base' || setType === 'Other')
      ? [year, releaseName, cleanParallelName]
      : [year, releaseName, typePrefix, cleanParallelName]
    : [year, releaseName, typePrefix, cleanSetName].filter(Boolean);

  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
