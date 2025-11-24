'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { DetailedStats } from '@/lib/stats/types';
import HealthScore from './components/HealthScore';
import RarityChart from './components/RarityChart';
import SetTypeChart from './components/SetTypeChart';
import PlayerRankings from './components/PlayerRankings';
import ManufacturerChart from './components/ManufacturerChart';
import AIPerformance from './components/AIPerformance';
import MetadataCompleteness from './components/MetadataCompleteness';
import DataQualityAlerts from './components/DataQualityAlerts';
import GrowthChart from './components/GrowthChart';
import VelocityMetrics from './components/VelocityMetrics';
import ParallelComplexity from './components/ParallelComplexity';

type TabType = 'overview' | 'collection' | 'quality' | 'growth';

export default function AdminStatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/stats/detailed');

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-3pt-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to view this page.</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-3pt-green text-white rounded hover:bg-3pt-green/90"
          >
            Return to Admin
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Statistics</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-3pt-green text-white rounded hover:bg-3pt-green/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'collection', label: 'Collection', icon: '🎴' },
    { key: 'quality', label: 'Quality', icon: '✨' },
    { key: 'growth', label: 'Growth', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Statistics Dashboard</h1>
              <p className="text-gray-600 mt-1">Data-informed insights for 3pt.bot</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-3pt-green text-white rounded-lg hover:bg-3pt-green/90"
              >
                Back to Admin
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'text-3pt-green border-b-2 border-3pt-green'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Health Score - Featured prominently */}
              <HealthScore healthScore={stats.healthScore} />

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Total Releases</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.overview.totalReleases.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Total Sets</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.overview.totalSets.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Total Cards</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.overview.totalCards.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Cards with Images</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.overview.cardsWithImages.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {stats.overview.imageCoveragePercent}% coverage
                  </div>
                </div>
              </div>

              {/* Attention Needed */}
              <DataQualityAlerts alerts={stats.qualityAlerts} />
            </>
          )}

          {activeTab === 'collection' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RarityChart data={stats.rarityDistribution} />
                <SetTypeChart data={stats.setTypeDistribution} />
              </div>
              <PlayerRankings data={stats.topPlayers} />
              <ManufacturerChart data={stats.manufacturerShare} />
              <ParallelComplexity data={stats.parallelComplexity} />
            </>
          )}

          {activeTab === 'quality' && (
            <>
              <AIPerformance data={stats.aiPerformance} />
              <MetadataCompleteness data={stats.metadataCompleteness} />
              <DataQualityAlerts alerts={stats.qualityAlerts} />
            </>
          )}

          {activeTab === 'growth' && (
            <>
              <GrowthChart data={stats.monthlyGrowth} />
              <VelocityMetrics data={stats.velocity} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
