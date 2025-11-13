/**
 * Formats a review text with a date header
 * @param review - The review text
 * @param reviewDate - The date the review was written or last updated
 * @param createdAt - The creation date (fallback if reviewDate is not set)
 * @returns Formatted review with header
 */
export function formatReviewWithHeader(
  review: string | null,
  reviewDate: Date | string | null,
  createdAt?: Date | string
): string | null {
  if (!review) return null;

  const date = reviewDate || createdAt;
  if (!date) return review;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const reviewDateObj = typeof reviewDate === 'string' ? new Date(reviewDate) : reviewDate;
  const createdDateObj = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;

  // Calculate days difference
  const daysDiff = reviewDateObj && createdDateObj
    ? Math.floor((reviewDateObj.getTime() - createdDateObj.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // If review was updated more than 7 days after creation, use "footy's update"
  const isUpdate = daysDiff > 7;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(dateObj);

  const header = isUpdate
    ? `footy's update ${formattedDate}`
    : `footy's review ${formattedDate}`;

  return `${header}\n\n${review}`;
}

/**
 * Gets just the header part of the review
 * @param reviewDate - The date the review was written or last updated
 * @param createdAt - The creation date (fallback if reviewDate is not set)
 * @returns The header string
 */
export function getReviewHeader(
  reviewDate: Date | string | null,
  createdAt?: Date | string
): string {
  const date = reviewDate || createdAt;
  if (!date) return 'footy\'s review';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const reviewDateObj = typeof reviewDate === 'string' ? new Date(reviewDate) : reviewDate;
  const createdDateObj = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;

  // Calculate days difference
  const daysDiff = reviewDateObj && createdDateObj
    ? Math.floor((reviewDateObj.getTime() - createdDateObj.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // If review was updated more than 7 days after creation, use "footy's update"
  const isUpdate = daysDiff > 7;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(dateObj);

  return isUpdate
    ? `footy's update ${formattedDate}`
    : `footy's review ${formattedDate}`;
}
