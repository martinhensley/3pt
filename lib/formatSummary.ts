/**
 * Formats a summary text with a date header
 * @param summary - The summary text
 * @param postDate - The release/post date
 * @returns Formatted summary with header
 */
export function formatSummaryWithHeader(
  summary: string | null,
  postDate?: Date | string
): string | null {
  if (!summary) return null;

  if (!postDate) return summary;

  const dateObj = typeof postDate === 'string' ? new Date(postDate) : postDate;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(dateObj);

  const header = `footy's summary ${formattedDate}`;

  return `${header}\n\n${summary}`;
}

/**
 * Gets just the header part of the summary
 * @param postDate - The release/post date
 * @returns The header string
 */
export function getSummaryHeader(
  postDate?: Date | string
): string {
  if (!postDate) return 'footy\'s summary';

  const dateObj = typeof postDate === 'string' ? new Date(postDate) : postDate;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(dateObj);

  return `footy's summary ${formattedDate}`;
}
