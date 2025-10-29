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
