import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { DetailedStats } from '@/lib/stats/types';
import {
  getOverviewStats,
  getRarityDistribution,
  getSetTypeDistribution,
  getTopPlayers,
  getManufacturerShare,
  getAIPerformance,
  getMetadataCompleteness,
  getQualityAlerts,
  getMonthlyGrowth,
  getVelocityMetrics,
  getParallelComplexity,
} from '@/lib/stats/queries';
import { calculateHealthScore } from '@/lib/stats/calculations';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Execute all queries in parallel for maximum performance
    const [
      overview,
      rarityDistribution,
      setTypeDistribution,
      topPlayers,
      manufacturerShare,
      aiPerformance,
      metadataCompleteness,
      qualityAlerts,
      monthlyGrowth,
      velocity,
      parallelComplexity,
    ] = await Promise.all([
      getOverviewStats(),
      getRarityDistribution(),
      getSetTypeDistribution(),
      getTopPlayers(10),
      getManufacturerShare(),
      getAIPerformance(),
      getMetadataCompleteness(),
      getQualityAlerts(),
      getMonthlyGrowth(12),
      getVelocityMetrics(),
      getParallelComplexity(10),
    ]);

    // Calculate overall metadata completeness percentage
    const avgMetadataCompleteness =
      metadataCompleteness.length > 0
        ? Math.round(
            metadataCompleteness.reduce((sum, field) => sum + field.percentage, 0) /
              metadataCompleteness.length
          )
        : 0;

    // Calculate health score
    const healthScore = calculateHealthScore(overview, aiPerformance, avgMetadataCompleteness);

    const stats: DetailedStats = {
      overview,
      rarityDistribution,
      setTypeDistribution,
      topPlayers,
      manufacturerShare,
      aiPerformance,
      metadataCompleteness,
      qualityAlerts,
      monthlyGrowth,
      velocity,
      parallelComplexity,
      healthScore,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
