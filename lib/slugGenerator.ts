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
  // Clean set name: remove "Base" from Optic sets, keep it for others
  const cleanSetName = setName
    .replace(/\boptic\s+base\s+set\b/gi, 'base')      // Optic Base Set -> base
    .replace(/\boptic\s+base\b/gi, 'base')            // Optic Base -> base
    .replace(/\bbase\s+optic\b/gi, 'base')            // Base Optic -> base
    .replace(/\bbase\s+set\b/gi, 'base')              // Base Set -> base
    .replace(/\bsets?\b/gi, '')                        // Remove remaining "set/sets"
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
        .replace(/\b1\s*\/\s*1\b/gi, '1-of-1')  // Convert "1/1" to "1-of-1"
        .replace(/\b1\s*of\s*1\b/gi, '1-of-1')  // Convert "1 of 1" to "1-of-1"
        .replace(/\s*\/\s*(\d+)/g, '-$1')        // Convert " /44" to "-44"
    : '';

  const parts = [year, releaseName, typePrefix, cleanSetName, cleanParallelName].filter(Boolean);

  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a URL-friendly slug from card information
 * Format: year-release-set-cardnumber-playername-variant-printrun
 * Example: "2024-25-donruss-soccer-optic-2-malik-tillman-green-5-49"
 *
 * Special handling for 1/1 cards (chase/grail cards):
 * - "1/1" or "1 of 1" -> "1-of-1" in slugs
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

  const parts = [
    year,
    releaseName,
    setName,
    cardNumber,
    playerName,
    processedVariant,
    printRun ? printRun.toString() : null
  ].filter(Boolean);

  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
