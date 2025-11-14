/**
 * Formats a review text with a date header
 * @param review - The review text
 * @param reviewDate - The date the review was written or last updated
 * @param postDate - The release/post date (used to determine if this is an update)
 * @returns Formatted review with header
 */
export function formatReviewWithHeader(
  review: string | null,
  reviewDate: Date | string | null,
  postDate?: Date | string
): string | null {
  if (!review) return null;

  const date = reviewDate || postDate;
  if (!date) return review;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const reviewDateObj = typeof reviewDate === 'string' ? new Date(reviewDate) : reviewDate;
  const postDateObj = typeof postDate === 'string' ? new Date(postDate) : postDate;

  // Calculate days difference between review date and post/release date
  const daysDiff = reviewDateObj && postDateObj
    ? Math.floor((reviewDateObj.getTime() - postDateObj.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // If review was updated more than 7 days after release/post date, use "footy's update"
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
 * @param postDate - The release/post date (used to determine if this is an update)
 * @returns The header string
 */
export function getReviewHeader(
  reviewDate: Date | string | null,
  postDate?: Date | string
): string {
  const date = reviewDate || postDate;
  if (!date) return 'footy\'s review';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const reviewDateObj = typeof reviewDate === 'string' ? new Date(reviewDate) : reviewDate;
  const postDateObj = typeof postDate === 'string' ? new Date(postDate) : postDate;

  // Calculate days difference between review date and post/release date
  const daysDiff = reviewDateObj && postDateObj
    ? Math.floor((reviewDateObj.getTime() - postDateObj.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // If review was updated more than 7 days after release/post date, use "footy's update"
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
