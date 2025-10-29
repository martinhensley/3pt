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
 * Generate a URL-friendly slug from card information
 * Format: year-release-set-cardnumber-playername-variant
 * Example: "2024-25-donruss-soccer-optic-2-malik-tillman-green-5"
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
  variant: string | null
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
    processedVariant
  ].filter(Boolean);

  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
