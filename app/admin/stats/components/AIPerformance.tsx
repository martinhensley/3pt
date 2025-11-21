'use client';

import type { AIStats } from '@/lib/stats/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AIPerformanceProps {
  data: AIStats;
}

export default function AIPerformance({ data }: AIPerformanceProps) {
  const confidenceData = [
    { name: 'High (≥80%)', value: data.highConfidence, color: '#10b981' },
    { name: 'Medium (60-79%)', value: data.mediumConfidence, color: '#f59e0b' },
    { name: 'Low (<60%)', value: data.lowConfidence, color: '#ef4444' },
    { name: 'No Data', value: data.noConfidence, color: '#9ca3af' },
  ];

  const methodData = Object.entries(data.detectionMethodCounts).map(([method, count]) => ({
    method,
    count,
  }));

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600">
            Cards: <span className="font-semibold text-gray-900">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {((data.value / data.payload.total) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">AI Detection Performance</h3>
        <p className="text-sm text-gray-600 mt-1">Card identification quality metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Average Score & Chart */}
        <div>
          {/* Average Confidence Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Average Confidence</span>
              <span
                className={`text-2xl font-bold px-4 py-2 rounded-lg ${getConfidenceColor(
                  data.averageConfidence
                )}`}
              >
                {data.averageConfidence}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  data.averageConfidence >= 80
                    ? 'bg-green-500'
                    : data.averageConfidence >= 60
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${data.averageConfidence}%` }}
              />
            </div>
          </div>

          {/* Confidence Distribution Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={confidenceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ percent }) =>
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                  }
                >
                  {confidenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Stats & Methods */}
        <div className="space-y-6">
          {/* Confidence Tiers */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Confidence Tiers</h4>
            <div className="space-y-2">
              {confidenceData.map((tier) => (
                <div key={tier.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span className="text-sm text-gray-700">{tier.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {tier.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detection Methods */}
          {methodData.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Detection Methods</h4>
              <div className="space-y-2">
                {methodData.map((method) => (
                  <div key={method.method} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700 capitalize">{method.method}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {method.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Item */}
          {data.lowConfidence > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Action Needed</p>
                  <p className="text-xs text-amber-700 mt-1">
                    {data.lowConfidence.toLocaleString()} cards have low detection confidence and may
                    require manual review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
