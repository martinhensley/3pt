// Calculation functions for statistics and metrics

import type { HealthScore, HealthScoreComponents, OverviewStats, AIStats } from './types';

/**
 * Calculate overall health score (0-100) based on multiple factors
 */
export function calculateHealthScore(
  overview: OverviewStats,
  aiStats: AIStats,
  metadataCompleteness: number
): HealthScore {
  // Weight factors
  const weights = {
    imageCoverage: 0.4,      // 40% - most important
    metadataCompleteness: 0.3, // 30% - data quality
    postPublication: 0.2,     // 20% - content publication
    aiConfidence: 0.1,        // 10% - AI performance
  };

  const components: HealthScoreComponents = {
    imageCoverage: overview.imageCoveragePercent,
    metadataCompleteness: metadataCompleteness,
    postPublication: overview.postPublicationRate,
    aiConfidence: aiStats.averageConfidence || 0,
  };

  // Calculate weighted average
  const overall = Math.round(
    components.imageCoverage * weights.imageCoverage +
    components.metadataCompleteness * weights.metadataCompleteness +
    components.postPublication * weights.postPublication +
    components.aiConfidence * weights.aiConfidence
  );

  // Determine rating and color
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  let color: string;

  if (overall >= 90) {
    rating = 'excellent';
    color = '#10b981'; // green-500
  } else if (overall >= 75) {
    rating = 'good';
    color = '#3b82f6'; // blue-500
  } else if (overall >= 60) {
    rating = 'fair';
    color = '#f59e0b'; // amber-500
  } else {
    rating = 'poor';
    color = '#ef4444'; // red-500
  }

  return {
    overall,
    components,
    rating,
    color,
  };
}

/**
 * Calculate percentage with proper rounding
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format month from date string
 */
export function formatMonth(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

/**
 * Get rarity tier label from tier key
 */
export function getRarityTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    '1/1': '1/1 (One of One)',
    '2-10': '2-10 (Ultra Rare)',
    '11-25': '11-25 (Super Rare)',
    '26-99': '26-99 (Rare)',
    '100-499': '100-499 (Uncommon)',
    'Unlimited': 'Base/Unlimited',
  };
  return labels[tier] || tier;
}

/**
 * Get set type display label
 */
export function getSetTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'Base': 'Base Sets',
    'Autograph': 'Autograph Cards',
    'Memorabilia': 'Memorabilia Cards',
    'Insert': 'Insert Sets',
  };
  return labels[type] || type;
}

/**
 * Get trend indicator (up, down, neutral)
 */
export function getTrendIndicator(current: number, previous: number): {
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
  color: string;
} {
  if (previous === 0) {
    return { direction: 'neutral', percentage: 0, color: 'text-gray-500' };
  }

  const change = ((current - previous) / previous) * 100;

  if (change > 5) {
    return { direction: 'up', percentage: Math.round(change), color: 'text-green-600' };
  } else if (change < -5) {
    return { direction: 'down', percentage: Math.round(Math.abs(change)), color: 'text-red-600' };
  } else {
    return { direction: 'neutral', percentage: Math.round(Math.abs(change)), color: 'text-gray-500' };
  }
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return Math.round(sum / numbers.length);
}

/**
 * Group array by key function
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((result, item) => {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get color for rarity tier
 */
export function getRarityColor(tier: string): string {
  const colors: Record<string, string> = {
    '1/1': '#f59e0b',          // amber-500
    '2-10': '#ef4444',         // red-500
    '11-25': '#8b5cf6',        // violet-500
    '26-99': '#3b82f6',        // blue-500
    '100-499': '#10b981',      // green-500
    'Unlimited': '#6b7280',    // gray-500
  };
  return colors[tier] || '#6b7280';
}

/**
 * Get color for set type
 */
export function getSetTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'Base': '#005031',         // footy-green
    'Autograph': '#F47322',    // footy-orange
    'Memorabilia': '#3b82f6',  // blue-500
    'Insert': '#8b5cf6',       // violet-500
  };
  return colors[type] || '#6b7280';
}
