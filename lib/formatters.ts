/**
 * Format parallel/variant names for display
 * Ensures consistent display of special cards like 1/1 (chase/grail cards)
 */
export function formatParallelName(parallelName: string): string {
  if (!parallelName) return parallelName;

  return parallelName
    // Convert various 1/1 formats to "1 of 1" for display
    .replace(/\b1\s*\/\s*1\b/gi, '1 of 1')
    .replace(/\b1-of-1\b/gi, '1 of 1')
    .replace(/\b1of1\b/gi, '1 of 1');
}

/**
 * Parse releaseDate string into DateTime for postDate field
 * Handles various formats:
 * - "May 4, 2025" -> May 4, 2025
 * - "May 2025" -> May 1, 2025
 * - "2024" -> January 1, 2024
 * - null/empty -> null
 */
export function parseReleaseDateToPostDate(releaseDate: string | null): Date | null {
  if (!releaseDate) return null;

  const trimmed = releaseDate.trim();

  // Try parsing full date formats like "May 4, 2025", "2025-05-04", etc.
  const fullDate = new Date(trimmed);
  if (!isNaN(fullDate.getTime())) {
    return fullDate;
  }

  // Match "Month Year" format (e.g., "May 2025")
  const monthYearMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    const date = new Date(`${month} 1, ${year}`);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Match year-only format (e.g., "2024", "1978")
  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = yearMatch[1];
    return new Date(`January 1, ${year}`);
  }

  // Could not parse - return null
  return null;
}
