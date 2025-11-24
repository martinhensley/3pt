'use client';

import type { VelocityMetrics as VelocityMetricsType } from '@/lib/stats/types';
import { getTrendIndicator } from '@/lib/stats/calculations';

interface VelocityMetricsProps {
  data: VelocityMetricsType;
}

export default function VelocityMetrics({ data }: VelocityMetricsProps) {
  const cardsTrend = getTrendIndicator(data.cardsThisMonth, data.cardsLastMonth);
  const releasesTrend = getTrendIndicator(data.releasesThisMonth, data.releasesLastMonth);

  const metrics = [
    {
      label: 'Cards This Week',
      value: data.cardsThisWeek,
      icon: '📊',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-900',
      valueColor: 'text-blue-600',
    },
    {
      label: 'Cards This Month',
      value: data.cardsThisMonth,
      icon: '📈',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-900',
      valueColor: 'text-green-600',
      trend: cardsTrend,
    },
    {
      label: 'Releases This Month',
      value: data.releasesThisMonth,
      icon: '🚀',
      color: 'bg-3pt-green/10 border-3pt-green/30',
      textColor: 'text-3pt-green',
      valueColor: 'text-3pt-green',
      trend: releasesTrend,
    },
    {
      label: 'Avg Days to Complete',
      value: data.avgDaysToComplete,
      icon: '⏱️',
      color: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-900',
      valueColor: 'text-amber-600',
      suffix: 'days',
    },
    {
      label: 'Pending Releases',
      value: data.pendingReleases,
      icon: '⏳',
      color: 'bg-violet-50 border-violet-200',
      textColor: 'text-violet-900',
      valueColor: 'text-violet-600',
      alert: data.pendingReleases > 10,
    },
  ];

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '➡️';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Content Velocity Metrics</h3>
        <p className="text-sm text-gray-600 mt-1">Production pipeline performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`p-5 rounded-lg border-2 ${metric.color} hover:shadow-md transition-all`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{metric.icon}</span>
              {metric.alert && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-semibold">
                  High
                </span>
              )}
            </div>

            <div className={`text-xs font-medium mb-2 ${metric.textColor}`}>{metric.label}</div>

            <div className="flex items-baseline gap-2">
              <div className={`text-3xl font-bold ${metric.valueColor}`}>
                {metric.value.toLocaleString()}
              </div>
              {metric.suffix && (
                <span className="text-sm text-gray-600">{metric.suffix}</span>
              )}
            </div>

            {metric.trend && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${metric.trend.color}`}>
                <span>{getTrendIcon(metric.trend.direction)}</span>
                <span className="font-semibold">
                  {metric.trend.percentage}% vs last month
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pipeline Status */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Pipeline Analysis</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Throughput */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-2">Current Throughput</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {data.cardsThisWeek > 0 ? Math.round(data.cardsThisWeek / 7) : 0}
              <span className="text-sm text-gray-600 ml-1">cards/day</span>
            </div>
            <p className="text-xs text-gray-500">Based on last 7 days</p>
          </div>

          {/* Completion Rate */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-2">Completion Efficiency</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {data.avgDaysToComplete > 0 ? data.avgDaysToComplete : 'N/A'}
              {data.avgDaysToComplete > 0 && (
                <span className="text-sm text-gray-600 ml-1">days avg</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {data.avgDaysToComplete === 0
                ? 'No completed releases yet'
                : data.avgDaysToComplete < 7
                ? 'Excellent turnaround time'
                : data.avgDaysToComplete < 14
                ? 'Good turnaround time'
                : 'Consider optimizing workflow'}
            </p>
          </div>
        </div>

        {/* Bottleneck Warning */}
        {data.pendingReleases > 10 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Pipeline Bottleneck</p>
                <p className="text-xs text-amber-700 mt-1">
                  {data.pendingReleases} releases are pending completion. Consider prioritizing
                  content production to reduce backlog.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Positive Feedback */}
        {data.pendingReleases <= 5 && data.avgDaysToComplete < 7 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-green-600 text-lg">✅</span>
              <div>
                <p className="text-sm font-semibold text-green-900">Efficient Pipeline</p>
                <p className="text-xs text-green-700 mt-1">
                  Your content production is running smoothly with minimal backlog and quick
                  turnaround times.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
