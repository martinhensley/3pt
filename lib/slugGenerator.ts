/**
 * Generate a URL-friendly slug from release information
 * Format: manufacturer-name-year (e.g., "panini-donruss-soccer-2024-25")
 */
export function generateReleaseSlug(manufacturer: string, name: string, year?: string): string {
  const parts = [manufacturer, name, year].filter(Boolean);
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
  const parts = [
    year,
    releaseName,
    setName,
    cardNumber,
    playerName,
    variant
  ].filter(Boolean);

  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
