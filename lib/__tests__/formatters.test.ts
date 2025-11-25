import { describe, it, expect } from 'vitest';
import { formatParallelName, parseReleaseDateToPostDate } from '../formatters';

describe('formatters', () => {
  describe('formatParallelName', () => {
    it('converts "1/1" to "1 of 1"', () => {
      expect(formatParallelName('Gold 1/1')).toBe('Gold 1 of 1');
      expect(formatParallelName('1/1')).toBe('1 of 1');
    });

    it('handles space around slash in 1/1', () => {
      expect(formatParallelName('Gold 1 / 1')).toBe('Gold 1 of 1');
    });

    it('converts "1-of-1" to "1 of 1"', () => {
      expect(formatParallelName('Gold 1-of-1')).toBe('Gold 1 of 1');
      expect(formatParallelName('1-of-1')).toBe('1 of 1');
    });

    it('converts "1of1" to "1 of 1"', () => {
      expect(formatParallelName('Gold 1of1')).toBe('Gold 1 of 1');
      expect(formatParallelName('1of1')).toBe('1 of 1');
    });

    it('handles already formatted "1 of 1"', () => {
      expect(formatParallelName('1 of 1')).toBe('1 of 1');
      expect(formatParallelName('Gold 1 of 1')).toBe('Gold 1 of 1');
    });

    it('returns empty/falsy values as-is', () => {
      expect(formatParallelName('')).toBe('');
    });

    it('preserves other content unchanged', () => {
      expect(formatParallelName('Pink Velocity /99')).toBe('Pink Velocity /99');
      expect(formatParallelName('Gold')).toBe('Gold');
      expect(formatParallelName('Blue Cubic')).toBe('Blue Cubic');
    });

    it('handles case insensitive matching', () => {
      expect(formatParallelName('GOLD 1/1')).toBe('GOLD 1 of 1');
      expect(formatParallelName('gold 1-OF-1')).toBe('gold 1 of 1');
    });
  });

  describe('parseReleaseDateToPostDate', () => {
    it('returns null for null input', () => {
      expect(parseReleaseDateToPostDate(null)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseReleaseDateToPostDate('')).toBeNull();
    });

    it('parses full date "May 4, 2025"', () => {
      const result = parseReleaseDateToPostDate('May 4, 2025');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(4); // May is month 4 (0-indexed)
      expect(result?.getDate()).toBe(4);
    });

    it('parses ISO format "2025-05-04"', () => {
      const result = parseReleaseDateToPostDate('2025-05-04');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });

    it('parses "Month Year" format to first of month', () => {
      const result = parseReleaseDateToPostDate('May 2025');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(4); // May
      expect(result?.getDate()).toBe(1);
    });

    it('parses "December 2024" correctly', () => {
      const result = parseReleaseDateToPostDate('December 2024');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(11); // December
      expect(result?.getDate()).toBe(1);
    });

    it('parses year-only format "2024" to January 1', () => {
      const result = parseReleaseDateToPostDate('2024');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(1);
    });

    it('parses historical year "1978"', () => {
      const result = parseReleaseDateToPostDate('1978');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(1978);
    });

    it('handles whitespace around input', () => {
      const result = parseReleaseDateToPostDate('  May 2025  ');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });

    it('returns null for unparseable date', () => {
      expect(parseReleaseDateToPostDate('not a date')).toBeNull();
      expect(parseReleaseDateToPostDate('abc xyz')).toBeNull();
    });

    it('returns null for partial invalid formats', () => {
      expect(parseReleaseDateToPostDate('May')).toBeNull();
      expect(parseReleaseDateToPostDate('13')).toBeNull(); // Not a 4-digit year
    });
  });
});
