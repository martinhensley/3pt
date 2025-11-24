'use client';

import type { MonthlyGrowthData } from '@/lib/stats/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GrowthChartProps {
  data: MonthlyGrowthData[];
}

export default function GrowthChart({ data }: GrowthChartProps) {
  // Reverse to show oldest to newest
  const chartData = [...data].reverse();

  const totalReleases = data.reduce((sum, month) => sum + month.releases, 0);
  const totalSets = data.reduce((sum, month) => sum + month.sets, 0);
  const totalCards = data.reduce((sum, month) => sum + month.cards, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600">
              <span style={{ color: entry.color }}>●</span> {entry.name}:{' '}
              <span className="font-semibold text-gray-900">{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Monthly Growth Trends</h3>
        <p className="text-sm text-gray-600 mt-1">Platform growth over the last 12 months</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-3pt-green/10 to-3pt-green/5 rounded-lg border border-3pt-green/20">
          <div className="text-xs text-gray-600 mb-1">Total Releases Added</div>
          <div className="text-2xl font-bold text-3pt-green">{totalReleases}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-3pt-orange/10 to-3pt-orange/5 rounded-lg border border-3pt-orange/20">
          <div className="text-xs text-gray-600 mb-1">Total Sets Added</div>
          <div className="text-2xl font-bold text-3pt-orange">{totalSets}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
          <div className="text-xs text-gray-600 mb-1">Total Cards Added</div>
          <div className="text-2xl font-bold text-blue-600">{totalCards.toLocaleString()}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="releases"
              name="Releases"
              stroke="#005031"
              strokeWidth={3}
              dot={{ fill: '#005031', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="sets"
              name="Sets"
              stroke="#F47322"
              strokeWidth={3}
              dot={{ fill: '#F47322', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="cards"
              name="Cards"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600 mb-1">Avg Releases/Month</div>
            <div className="text-xl font-bold text-gray-900">
              {data.length > 0 ? Math.round(totalReleases / data.length) : 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Avg Sets/Month</div>
            <div className="text-xl font-bold text-gray-900">
              {data.length > 0 ? Math.round(totalSets / data.length) : 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Avg Cards/Month</div>
            <div className="text-xl font-bold text-gray-900">
              {data.length > 0 ? Math.round(totalCards / data.length).toLocaleString() : 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
