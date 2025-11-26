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
 * Parse releaseDate string into DateTime for createdAt field
 * Returns date at 4:20pm Mountain Time (23:20 UTC)
 * Handles various formats:
 * - "November 23, 2016" -> Nov 23, 2016 at 4:20pm MT
 * - "May 4, 2025" -> May 4, 2025 at 4:20pm MT
 * - "2016-11-30" -> Nov 30, 2016 at 4:20pm MT
 * - "2024" -> January 1, 2024 at 4:20pm MT
 * - null/empty -> null
 */
export function parseReleaseDateToCreatedAt(releaseDate: string | null): Date | null {
  if (!releaseDate) return null;

  const trimmed = releaseDate.trim();

  // Helper to create date at 4:20pm Mountain Time (23:20 UTC)
  const createDateAt420pmMT = (year: number, month: number, day: number): Date => {
    return new Date(Date.UTC(year, month, day, 23, 20, 0, 0));
  };

  // Try parsing 'Month Day, Year' format (e.g., 'November 23, 2016')
  const monthDayYear = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDayYear) {
    const [, month, day, year] = monthDayYear;
    const months: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    const monthNum = months[month.toLowerCase()];
    if (monthNum !== undefined) {
      return createDateAt420pmMT(parseInt(year), monthNum, parseInt(day));
    }
  }

  // Try parsing 'YYYY-MM-DD' format (e.g., '2016-11-30')
  const isoFormat = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoFormat) {
    const [, year, month, day] = isoFormat;
    return createDateAt420pmMT(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Try parsing just a year (e.g., '2016')
  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = parseInt(yearOnly[1]);
    return createDateAt420pmMT(year, 0, 1); // January 1
  }

  // Could not parse - return null
  return null;
}
