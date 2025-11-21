'use client';

import type { RarityTier } from '@/lib/stats/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getRarityColor } from '@/lib/stats/calculations';

interface RarityChartProps {
  data: RarityTier[];
}

export default function RarityChart({ data }: RarityChartProps) {
  const total = data.reduce((sum, tier) => sum + tier.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const tier = payload[0].payload;
      const percentage = ((tier.count / total) * 100).toFixed(1);

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{tier.tierLabel}</p>
          <p className="text-sm text-gray-600">
            Cards: <span className="font-semibold text-gray-900">{tier.count.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-semibold text-gray-900">{percentage}%</span>
          </p>
          {tier.minPrintRun && (
            <p className="text-xs text-gray-500 mt-2">
              Print Run: {tier.minPrintRun}
              {tier.maxPrintRun ? ` - ${tier.maxPrintRun}` : '+'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Rarity Distribution</h3>
        <p className="text-sm text-gray-600 mt-1">Cards grouped by print run scarcity</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="tier"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 80, 49, 0.1)' }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRarityColor(entry.tier)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {data.find((t) => t.tier === '1/1')?.count || 0}
            </div>
            <div className="text-xs text-gray-600">One of Ones</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {data
                .filter((t) => ['1/1', '2-10', '11-25'].includes(t.tier))
                .reduce((sum, t) => sum + t.count, 0)
                .toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Ultra Rare (≤25)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Cards</div>
          </div>
        </div>
      </div>
    </div>
  );
}
