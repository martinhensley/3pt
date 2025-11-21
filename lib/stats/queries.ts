// Database queries for statistics

import { prisma } from '@/lib/prisma';
import type {
  OverviewStats,
  RarityTier,
  SetTypeStat,
  PlayerStat,
  ManufacturerStat,
  AIStats,
  MetadataCompletenessField,
  QualityAlert,
  MonthlyGrowthData,
  VelocityMetrics,
  ParallelComplexityStat,
} from './types';
import { calculatePercentage, getRarityTierLabel, formatMonth } from './calculations';

/**
 * Get overview statistics
 */
export async function getOverviewStats(): Promise<OverviewStats> {
  const [
    totalReleases,
    totalSets,
    totalCards,
    cardsWithImages,
    publishedPosts,
    totalPosts,
    setsWithoutChecklists,
  ] = await Promise.all([
    prisma.release.count(),
    prisma.set.count(),
    prisma.card.count(),
    prisma.card.count({ where: { imageFront: { not: null } } }),
    prisma.post.count({ where: { published: true } }),
    prisma.post.count(),
    prisma.set.count({ where: { sourceText: null } }),
  ]);

  const cardsMissingImages = totalCards - cardsWithImages;
  const releasesWithoutPosts = await prisma.release.count({
    where: { posts: { none: {} } },
  });

  const imageCoveragePercent = calculatePercentage(cardsWithImages, totalCards);
  const postPublicationRate = calculatePercentage(publishedPosts, totalPosts);
  const setsWithChecklistsPercent = calculatePercentage(
    totalSets - setsWithoutChecklists,
    totalSets
  );

  return {
    totalReleases,
    totalSets,
    totalCards,
    cardsWithImages,
    publishedPosts,
    totalPosts,
    setsWithoutChecklists,
    cardsMissingImages,
    releasesWithoutPosts,
    imageCoveragePercent,
    postPublicationRate,
    setsWithChecklistsPercent,
  };
}

/**
 * Get rarity distribution (cards by print run tiers)
 */
export async function getRarityDistribution(): Promise<RarityTier[]> {
  const result = await prisma.$queryRaw<
    Array<{ tier: string; count: bigint }>
  >`
    SELECT
      CASE
        WHEN "printRun" = 1 THEN '1/1'
        WHEN "printRun" <= 10 THEN '2-10'
        WHEN "printRun" <= 25 THEN '11-25'
        WHEN "printRun" <= 99 THEN '26-99'
        WHEN "printRun" <= 499 THEN '100-499'
        ELSE 'Unlimited'
      END as tier,
      COUNT(*)::int as count
    FROM "Card"
    WHERE "printRun" IS NOT NULL
    GROUP BY tier
    ORDER BY MIN("printRun") NULLS LAST
  `;

  const tierRanges: Record<string, { min: number | null; max: number | null }> = {
    '1/1': { min: 1, max: 1 },
    '2-10': { min: 2, max: 10 },
    '11-25': { min: 11, max: 25 },
    '26-99': { min: 26, max: 99 },
    '100-499': { min: 100, max: 499 },
    'Unlimited': { min: 500, max: null },
  };

  return result.map((row) => ({
    tier: row.tier,
    tierLabel: getRarityTierLabel(row.tier),
    count: Number(row.count),
    minPrintRun: tierRanges[row.tier]?.min || null,
    maxPrintRun: tierRanges[row.tier]?.max || null,
  }));
}

/**
 * Get set type distribution
 */
export async function getSetTypeDistribution(): Promise<SetTypeStat[]> {
  const totalCards = await prisma.card.count();

  const result = await prisma.set.groupBy({
    by: ['type'],
    _count: {
      id: true,
    },
  });

  const statsPromises = result.map(async (row) => {
    const cardCount = await prisma.card.count({
      where: { set: { type: row.type } },
    });

    return {
      type: row.type,
      setCount: row._count.id,
      cardCount,
      percentage: calculatePercentage(cardCount, totalCards),
    };
  });

  const stats = await Promise.all(statsPromises);

  // Sort by card count descending
  return stats.sort((a, b) => b.cardCount - a.cardCount);
}

/**
 * Get top players by card count
 */
export async function getTopPlayers(limit: number = 10): Promise<PlayerStat[]> {
  const result = await prisma.card.groupBy({
    by: ['playerName'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
    where: {
      playerName: {
        not: null,
      },
    },
  });

  const playerStatsPromises = result.map(async (row) => {
    if (!row.playerName) return null;

    const [baseCards, autographCards, memorabiliaCards, insertCards] = await Promise.all([
      prisma.card.count({
        where: {
          playerName: row.playerName,
          set: { type: 'Base' },
        },
      }),
      prisma.card.count({
        where: {
          playerName: row.playerName,
          set: { type: 'Autograph' },
        },
      }),
      prisma.card.count({
        where: {
          playerName: row.playerName,
          set: { type: 'Memorabilia' },
        },
      }),
      prisma.card.count({
        where: {
          playerName: row.playerName,
          set: { type: 'Insert' },
        },
      }),
    ]);

    return {
      playerName: row.playerName,
      cardCount: row._count.id,
      baseCards,
      autographCards,
      memorabiliaCards,
      insertCards,
    };
  });

  const stats = await Promise.all(playerStatsPromises);
  return stats.filter((s): s is PlayerStat => s !== null);
}

/**
 * Get manufacturer market share
 */
export async function getManufacturerShare(): Promise<ManufacturerStat[]> {
  const manufacturers = await prisma.manufacturer.findMany({
    include: {
      _count: {
        select: {
          releases: true,
        },
      },
    },
  });

  const totalCards = await prisma.card.count();

  const statsPromises = manufacturers.map(async (manufacturer) => {
    const [setCount, cardCount] = await Promise.all([
      prisma.set.count({
        where: { release: { manufacturerId: manufacturer.id } },
      }),
      prisma.card.count({
        where: { set: { release: { manufacturerId: manufacturer.id } } },
      }),
    ]);

    return {
      manufacturer: manufacturer.name,
      releaseCount: manufacturer._count.releases,
      setCount,
      cardCount,
      percentage: calculatePercentage(cardCount, totalCards),
    };
  });

  const stats = await Promise.all(statsPromises);

  // Sort by card count descending
  return stats.sort((a, b) => b.cardCount - a.cardCount);
}

/**
 * Get AI performance statistics
 */
export async function getAIPerformance(): Promise<AIStats> {
  const [aggregates, confidenceTiers, detectionMethods] = await Promise.all([
    prisma.card.aggregate({
      _avg: {
        detectionConfidence: true,
      },
      _count: {
        id: true,
      },
      where: {
        detectionConfidence: {
          not: null,
        },
      },
    }),
    Promise.all([
      prisma.card.count({ where: { detectionConfidence: { gte: 80 } } }),
      prisma.card.count({
        where: { detectionConfidence: { gte: 60, lt: 80 } },
      }),
      prisma.card.count({ where: { detectionConfidence: { lt: 60, gt: 0 } } }),
      prisma.card.count({
        where: {
          OR: [{ detectionConfidence: null }, { detectionConfidence: 0 }],
        },
      }),
    ]),
    prisma.card.findMany({
      where: { detectionMethods: { isEmpty: false } },
      select: { detectionMethods: true },
    }),
  ]);

  // Count detection methods
  const methodCounts: Record<string, number> = {};
  detectionMethods.forEach((card) => {
    card.detectionMethods.forEach((method) => {
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });
  });

  return {
    averageConfidence: Math.round(aggregates._avg.detectionConfidence || 0),
    totalCards: aggregates._count.id,
    highConfidence: confidenceTiers[0],
    mediumConfidence: confidenceTiers[1],
    lowConfidence: confidenceTiers[2],
    noConfidence: confidenceTiers[3],
    detectionMethodCounts: methodCounts,
  };
}

/**
 * Get metadata completeness statistics
 */
export async function getMetadataCompleteness(): Promise<MetadataCompletenessField[]> {
  const totalCards = await prisma.card.count();

  const fields = [
    { field: 'team', fieldLabel: 'Team' },
    { field: 'position', fieldLabel: 'Position' },
    { field: 'college', fieldLabel: 'College' },
    { field: 'rookieYear', fieldLabel: 'Rookie Year' },
    { field: 'league', fieldLabel: 'League' },
    { field: 'imageFront', fieldLabel: 'Front Image' },
    { field: 'imageBack', fieldLabel: 'Back Image' },
  ];

  const statsPromises = fields.map(async ({ field, fieldLabel }) => {
    const cardsWithData = await prisma.card.count({
      where: {
        [field]: {
          not: null,
        },
      },
    });

    return {
      field,
      fieldLabel,
      totalCards,
      cardsWithData,
      percentage: calculatePercentage(cardsWithData, totalCards),
    };
  });

  return Promise.all(statsPromises);
}

/**
 * Get data quality alerts
 */
export async function getQualityAlerts(): Promise<QualityAlert[]> {
  const [
    setsWithNoCards,
    cardsWithoutImages,
    cardsWithLowConfidence,
    releasesWithoutSummary,
  ] = await Promise.all([
    prisma.set.count({
      where: {
        cards: {
          none: {},
        },
      },
    }),
    prisma.card.count({
      where: {
        AND: [{ imageFront: null }, { imageBack: null }],
      },
    }),
    prisma.card.count({
      where: {
        detectionConfidence: {
          lt: 60,
          gt: 0,
        },
      },
    }),
    prisma.release.count({
      where: {
        summary: null,
      },
    }),
  ]);

  // setId is required in the schema, so there are no orphaned cards
  const orphanedCards = 0;

  const alerts: QualityAlert[] = [];

  if (setsWithNoCards > 0) {
    alerts.push({
      type: 'warning',
      category: 'Data Structure',
      message: 'Sets with no cards',
      count: setsWithNoCards,
    });
  }

  if (cardsWithoutImages > 0) {
    alerts.push({
      type: 'warning',
      category: 'Content',
      message: 'Cards without any images',
      count: cardsWithoutImages,
    });
  }

  if (cardsWithLowConfidence > 0) {
    alerts.push({
      type: 'info',
      category: 'AI Detection',
      message: 'Cards with low detection confidence (<60%)',
      count: cardsWithLowConfidence,
    });
  }

  if (releasesWithoutSummary > 0) {
    alerts.push({
      type: 'info',
      category: 'Content',
      message: 'Releases without AI summary',
      count: releasesWithoutSummary,
    });
  }

  if (orphanedCards > 0) {
    alerts.push({
      type: 'error',
      category: 'Data Integrity',
      message: 'Orphaned cards (no parent set)',
      count: orphanedCards,
    });
  }

  return alerts;
}

/**
 * Get monthly growth data
 */
export async function getMonthlyGrowth(months: number = 12): Promise<MonthlyGrowthData[]> {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  const result = await prisma.$queryRaw<
    Array<{
      month: Date;
      releases: bigint;
      sets: bigint;
      cards: bigint;
    }>
  >`
    WITH monthly_releases AS (
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*)::int as releases
      FROM "Release"
      WHERE "createdAt" >= ${cutoffDate}
      GROUP BY month
    ),
    monthly_sets AS (
      SELECT
        DATE_TRUNC('month', s."createdAt") as month,
        COUNT(*)::int as sets
      FROM "Set" s
      WHERE s."createdAt" >= ${cutoffDate}
      GROUP BY month
    ),
    monthly_cards AS (
      SELECT
        DATE_TRUNC('month', c."createdAt") as month,
        COUNT(*)::int as cards
      FROM "Card" c
      WHERE c."createdAt" >= ${cutoffDate}
      GROUP BY month
    )
    SELECT
      COALESCE(mr.month, ms.month, mc.month) as month,
      COALESCE(mr.releases, 0)::int as releases,
      COALESCE(ms.sets, 0)::int as sets,
      COALESCE(mc.cards, 0)::int as cards
    FROM monthly_releases mr
    FULL OUTER JOIN monthly_sets ms ON mr.month = ms.month
    FULL OUTER JOIN monthly_cards mc ON COALESCE(mr.month, ms.month) = mc.month
    ORDER BY month DESC
  `;

  return result.map((row) => ({
    month: row.month.toISOString(),
    monthLabel: formatMonth(row.month.toISOString()),
    releases: Number(row.releases),
    sets: Number(row.sets),
    cards: Number(row.cards),
  }));
}

/**
 * Get content velocity metrics
 */
export async function getVelocityMetrics(): Promise<VelocityMetrics> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    cardsThisWeek,
    cardsThisMonth,
    cardsLastMonth,
    releasesThisMonth,
    releasesLastMonth,
    completedReleases,
    pendingReleases,
  ] = await Promise.all([
    prisma.card.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.card.count({ where: { createdAt: { gte: oneMonthAgo } } }),
    prisma.card.count({
      where: {
        createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
      },
    }),
    prisma.release.count({ where: { createdAt: { gte: oneMonthAgo } } }),
    prisma.release.count({
      where: {
        createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
      },
    }),
    prisma.release.findMany({
      where: {
        posts: { some: { published: true } },
      },
      select: {
        createdAt: true,
        posts: {
          where: { published: true },
          select: { postDate: true },
        },
      },
    }),
    prisma.release.count({
      where: {
        posts: { none: {} },
      },
    }),
  ]);

  // Calculate average days to complete
  let totalDays = 0;
  let countWithDates = 0;

  completedReleases.forEach((release) => {
    const publishedPost = release.posts[0];
    if (publishedPost?.postDate) {
      const days = Math.ceil(
        (publishedPost.postDate.getTime() - release.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (days >= 0) {
        totalDays += days;
        countWithDates++;
      }
    }
  });

  const avgDaysToComplete = countWithDates > 0 ? Math.round(totalDays / countWithDates) : 0;

  return {
    cardsThisWeek,
    cardsThisMonth,
    cardsLastMonth,
    releasesThisMonth,
    releasesLastMonth,
    avgDaysToComplete,
    pendingReleases,
  };
}

/**
 * Get parallel complexity statistics
 */
export async function getParallelComplexity(limit: number = 10): Promise<ParallelComplexityStat[]> {
  const releases = await prisma.release.findMany({
    include: {
      sets: {
        include: {
          _count: {
            select: {
              cards: true,
            },
          },
        },
      },
    },
  });

  const stats = releases
    .map((release) => {
      const baseSets = release.sets.filter((s) => !s.isParallel);
      const parallelSets = release.sets.filter((s) => s.isParallel);
      const totalCards = release.sets.reduce((sum, set) => sum + set._count.cards, 0);

      const avgParallelsPerBase =
        baseSets.length > 0 ? parallelSets.length / baseSets.length : 0;

      return {
        releaseSlug: release.slug,
        releaseName: release.name,
        year: release.year,
        baseSetCount: baseSets.length,
        parallelSetCount: parallelSets.length,
        avgParallelsPerBase: Math.round(avgParallelsPerBase * 10) / 10,
        totalCards,
      };
    })
    .filter((stat) => stat.parallelSetCount > 0) // Only include releases with parallels
    .sort((a, b) => b.avgParallelsPerBase - a.avgParallelsPerBase)
    .slice(0, limit);

  return stats;
}
