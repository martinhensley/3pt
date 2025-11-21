'use client';

import type { HealthScore as HealthScoreType } from '@/lib/stats/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface HealthScoreProps {
  healthScore: HealthScoreType;
}

export default function HealthScore({ healthScore }: HealthScoreProps) {
  const { overall, components, rating, color } = healthScore;

  // Prepare data for component breakdown
  const componentData = [
    { name: 'Image Coverage', value: components.imageCoverage, color: '#10b981' },
    { name: 'Metadata Quality', value: components.metadataCompleteness, color: '#3b82f6' },
    { name: 'Post Publication', value: components.postPublication, color: '#8b5cf6' },
    { name: 'AI Confidence', value: components.aiConfidence, color: '#f59e0b' },
  ];

  const getRatingMessage = () => {
    switch (rating) {
      case 'excellent':
        return 'Your platform is in excellent health! Keep up the great work.';
      case 'good':
        return 'Your platform is performing well with room for improvement.';
      case 'fair':
        return 'Your platform needs attention in some areas.';
      case 'poor':
        return 'Your platform requires immediate attention to improve quality.';
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Health Score</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            {/* Score Circle */}
            <div
              className="w-48 h-48 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(${color} ${overall}%, #e5e7eb ${overall}%)`,
              }}
            >
              <div className="w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center">
                <div className="text-6xl font-bold" style={{ color }}>
                  {overall}
                </div>
                <div className="text-sm text-gray-600 mt-1">out of 100</div>
              </div>
            </div>
          </div>

          {/* Rating Badge */}
          <div className="mt-4">
            <span
              className="px-4 py-2 rounded-full text-white font-semibold text-lg capitalize"
              style={{ backgroundColor: color }}
            >
              {rating}
            </span>
          </div>

          {/* Message */}
          <p className="text-center text-gray-600 mt-4 max-w-sm">{getRatingMessage()}</p>
        </div>

        {/* Component Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Components</h3>

          {/* Component Bars */}
          <div className="space-y-4 mb-6">
            {componentData.map((component) => (
              <div key={component.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{component.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{component.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${component.value}%`,
                      backgroundColor: component.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pie Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={componentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {componentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weighting Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Score calculated from: Image Coverage (40%), Metadata Quality (30%), Post Publication
          (20%), AI Confidence (10%)
        </p>
      </div>
    </div>
  );
}
