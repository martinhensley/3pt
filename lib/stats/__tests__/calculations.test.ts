import { describe, it, expect } from 'vitest';
import {
  calculateHealthScore,
  calculatePercentage,
  formatNumber,
  formatMonth,
  getRarityTierLabel,
  getSetTypeLabel,
  getTrendIndicator,
  calculateAverage,
  groupBy,
  daysBetween,
  getRarityColor,
  getSetTypeColor,
} from '../calculations';
import type { OverviewStats, AIStats } from '../types';

describe('calculations', () => {
  describe('calculateHealthScore', () => {
    const createOverviewStats = (overrides: Partial<OverviewStats> = {}): OverviewStats => ({
      totalReleases: 10,
      totalSets: 50,
      totalCards: 500,
      cardsWithImages: 400,
      publishedPosts: 8,
      totalPosts: 10,
      setsWithoutChecklists: 5,
      cardsMissingImages: 100,
      releasesWithoutPosts: 2,
      imageCoveragePercent: 80,
      postPublicationRate: 80,
      setsWithChecklistsPercent: 90,
      ...overrides,
    });

    const createAIStats = (overrides: Partial<AIStats> = {}): AIStats => ({
      averageConfidence: 85,
      totalCards: 500,
      highConfidence: 400,
      mediumConfidence: 75,
      lowConfidence: 20,
      noConfidence: 5,
      detectionMethodCounts: {},
      ...overrides,
    });

    it('calculates weighted health score correctly', () => {
      const overview = createOverviewStats({
        imageCoveragePercent: 100,
        postPublicationRate: 100,
      });
      const aiStats = createAIStats({ averageConfidence: 100 });
      const metadataCompleteness = 100;

      const result = calculateHealthScore(overview, aiStats, metadataCompleteness);

      // 100 * 0.4 + 100 * 0.3 + 100 * 0.2 + 100 * 0.1 = 100
      expect(result.overall).toBe(100);
      expect(result.rating).toBe('excellent');
      expect(result.color).toBe('#10b981');
    });

    it('applies correct weights: 40% image, 30% metadata, 20% posts, 10% AI', () => {
      const overview = createOverviewStats({
        imageCoveragePercent: 100, // 40 points
        postPublicationRate: 50, // 10 points
      });
      const aiStats = createAIStats({ averageConfidence: 0 }); // 0 points
      const metadataCompleteness = 0; // 0 points

      const result = calculateHealthScore(overview, aiStats, metadataCompleteness);

      // 100 * 0.4 + 0 * 0.3 + 50 * 0.2 + 0 * 0.1 = 40 + 0 + 10 + 0 = 50
      expect(result.overall).toBe(50);
    });

    it('returns "excellent" rating for scores >= 90', () => {
      const overview = createOverviewStats({ imageCoveragePercent: 95, postPublicationRate: 95 });
      const aiStats = createAIStats({ averageConfidence: 90 });

      const result = calculateHealthScore(overview, aiStats, 90);

      expect(result.rating).toBe('excellent');
      expect(result.color).toBe('#10b981');
    });

    it('returns "good" rating for scores >= 75 and < 90', () => {
      const overview = createOverviewStats({ imageCoveragePercent: 80, postPublicationRate: 80 });
      const aiStats = createAIStats({ averageConfidence: 70 });

      const result = calculateHealthScore(overview, aiStats, 75);

      expect(result.rating).toBe('good');
      expect(result.color).toBe('#3b82f6');
    });

    it('returns "fair" rating for scores >= 60 and < 75', () => {
      const overview = createOverviewStats({ imageCoveragePercent: 60, postPublicationRate: 60 });
      const aiStats = createAIStats({ averageConfidence: 60 });

      const result = calculateHealthScore(overview, aiStats, 60);

      expect(result.rating).toBe('fair');
      expect(result.color).toBe('#f59e0b');
    });

    it('returns "poor" rating for scores < 60', () => {
      const overview = createOverviewStats({ imageCoveragePercent: 30, postPublicationRate: 30 });
      const aiStats = createAIStats({ averageConfidence: 30 });

      const result = calculateHealthScore(overview, aiStats, 30);

      expect(result.rating).toBe('poor');
      expect(result.color).toBe('#ef4444');
    });

    it('handles null/undefined AI confidence', () => {
      const overview = createOverviewStats({ imageCoveragePercent: 80, postPublicationRate: 80 });
      const aiStats = createAIStats({ averageConfidence: undefined as unknown as number });

      const result = calculateHealthScore(overview, aiStats, 80);

      // Should use 0 for undefined aiConfidence
      expect(result.components.aiConfidence).toBe(0);
    });

    it('includes all component scores in result', () => {
      const overview = createOverviewStats({ imageCoveragePercent: 75, postPublicationRate: 65 });
      const aiStats = createAIStats({ averageConfidence: 85 });

      const result = calculateHealthScore(overview, aiStats, 70);

      expect(result.components.imageCoverage).toBe(75);
      expect(result.components.metadataCompleteness).toBe(70);
      expect(result.components.postPublication).toBe(65);
      expect(result.components.aiConfidence).toBe(85);
    });
  });

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(2, 3)).toBe(67);
    });

    it('returns 0 when total is 0', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
      expect(calculatePercentage(0, 0)).toBe(0);
    });

    it('handles 100% correctly', () => {
      expect(calculatePercentage(100, 100)).toBe(100);
      expect(calculatePercentage(50, 50)).toBe(100);
    });

    it('rounds to nearest integer', () => {
      expect(calculatePercentage(1, 7)).toBe(14); // 14.28... rounds to 14
      expect(calculatePercentage(6, 7)).toBe(86); // 85.71... rounds to 86
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(123456789)).toBe('123,456,789');
    });

    it('handles small numbers', () => {
      expect(formatNumber(1)).toBe('1');
      expect(formatNumber(999)).toBe('999');
    });

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatMonth', () => {
    it('formats date string to month and year', () => {
      const result = formatMonth('2024-05-15');
      expect(result).toMatch(/May 2024/);
    });

    it('formats ISO date string', () => {
      const result = formatMonth('2024-12-01T00:00:00Z');
      expect(result).toMatch(/Dec 2024|Nov 2024/); // Timezone may affect
    });
  });

  describe('getRarityTierLabel', () => {
    it('returns correct labels for known tiers', () => {
      expect(getRarityTierLabel('1/1')).toBe('1/1 (One of One)');
      expect(getRarityTierLabel('2-10')).toBe('2-10 (Ultra Rare)');
      expect(getRarityTierLabel('11-25')).toBe('11-25 (Super Rare)');
      expect(getRarityTierLabel('26-99')).toBe('26-99 (Rare)');
      expect(getRarityTierLabel('100-499')).toBe('100-499 (Uncommon)');
      expect(getRarityTierLabel('Unlimited')).toBe('Base/Unlimited');
    });

    it('returns original tier for unknown tiers', () => {
      expect(getRarityTierLabel('Custom')).toBe('Custom');
      expect(getRarityTierLabel('500+')).toBe('500+');
    });
  });

  describe('getSetTypeLabel', () => {
    it('returns correct labels for known types', () => {
      expect(getSetTypeLabel('Base')).toBe('Base Sets');
      expect(getSetTypeLabel('Autograph')).toBe('Autograph Cards');
      expect(getSetTypeLabel('Memorabilia')).toBe('Memorabilia Cards');
      expect(getSetTypeLabel('Insert')).toBe('Insert Sets');
    });

    it('returns original type for unknown types', () => {
      expect(getSetTypeLabel('Other')).toBe('Other');
      expect(getSetTypeLabel('Custom')).toBe('Custom');
    });
  });

  describe('getTrendIndicator', () => {
    it('returns "up" for increase > 5%', () => {
      const result = getTrendIndicator(110, 100);
      expect(result.direction).toBe('up');
      expect(result.percentage).toBe(10);
      expect(result.color).toBe('text-green-600');
    });

    it('returns "down" for decrease > 5%', () => {
      const result = getTrendIndicator(90, 100);
      expect(result.direction).toBe('down');
      expect(result.percentage).toBe(10);
      expect(result.color).toBe('text-red-600');
    });

    it('returns "neutral" for change within 5%', () => {
      const result = getTrendIndicator(103, 100);
      expect(result.direction).toBe('neutral');
      expect(result.color).toBe('text-gray-500');
    });

    it('returns "neutral" when previous is 0', () => {
      const result = getTrendIndicator(100, 0);
      expect(result.direction).toBe('neutral');
      expect(result.percentage).toBe(0);
    });

    it('handles exact 5% threshold as neutral', () => {
      const result = getTrendIndicator(105, 100);
      expect(result.direction).toBe('neutral');
    });

    it('rounds percentage', () => {
      const result = getTrendIndicator(116, 100);
      expect(result.percentage).toBe(16);
    });
  });

  describe('calculateAverage', () => {
    it('calculates average of numbers', () => {
      expect(calculateAverage([10, 20, 30])).toBe(20);
      expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
    });

    it('returns 0 for empty array', () => {
      expect(calculateAverage([])).toBe(0);
    });

    it('rounds to nearest integer', () => {
      expect(calculateAverage([1, 2])).toBe(2); // 1.5 rounds to 2
      expect(calculateAverage([1, 1, 2])).toBe(1); // 1.33 rounds to 1
    });

    it('handles single value', () => {
      expect(calculateAverage([42])).toBe(42);
    });
  });

  describe('groupBy', () => {
    it('groups items by key function', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];
      const result = groupBy(items, (item) => item.type);
      expect(result['a']).toHaveLength(2);
      expect(result['b']).toHaveLength(1);
    });

    it('handles empty array', () => {
      const result = groupBy([], () => 'key');
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('handles all same key', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = groupBy(items, () => 'same');
      expect(result['same']).toHaveLength(3);
    });
  });

  describe('daysBetween', () => {
    it('calculates days between two dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-11');
      expect(daysBetween(date1, date2)).toBe(10);
    });

    it('handles same date', () => {
      const date = new Date('2024-01-01');
      expect(daysBetween(date, date)).toBe(0);
    });

    it('handles order of dates (absolute value)', () => {
      const date1 = new Date('2024-01-11');
      const date2 = new Date('2024-01-01');
      expect(daysBetween(date1, date2)).toBe(10);
    });

    it('handles dates across months', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-02-15');
      expect(daysBetween(date1, date2)).toBe(31);
    });
  });

  describe('getRarityColor', () => {
    it('returns correct colors for known tiers', () => {
      expect(getRarityColor('1/1')).toBe('#f59e0b');
      expect(getRarityColor('2-10')).toBe('#ef4444');
      expect(getRarityColor('11-25')).toBe('#8b5cf6');
      expect(getRarityColor('26-99')).toBe('#3b82f6');
      expect(getRarityColor('100-499')).toBe('#10b981');
      expect(getRarityColor('Unlimited')).toBe('#6b7280');
    });

    it('returns gray for unknown tiers', () => {
      expect(getRarityColor('Custom')).toBe('#6b7280');
    });
  });

  describe('getSetTypeColor', () => {
    it('returns correct colors for known types', () => {
      expect(getSetTypeColor('Base')).toBe('#005031');
      expect(getSetTypeColor('Autograph')).toBe('#F47322');
      expect(getSetTypeColor('Memorabilia')).toBe('#3b82f6');
      expect(getSetTypeColor('Insert')).toBe('#8b5cf6');
    });

    it('returns gray for unknown types', () => {
      expect(getSetTypeColor('Other')).toBe('#6b7280');
    });
  });
});
