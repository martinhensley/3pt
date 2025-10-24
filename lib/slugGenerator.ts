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
