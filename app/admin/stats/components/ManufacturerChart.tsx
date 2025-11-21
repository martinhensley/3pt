'use client';

import type { ManufacturerStat } from '@/lib/stats/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ManufacturerChartProps {
  data: ManufacturerStat[];
}

const COLORS = ['#005031', '#F47322', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export default function ManufacturerChart({ data }: ManufacturerChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const stat = payload[0].payload;

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{stat.manufacturer}</p>
          <p className="text-sm text-gray-600">
            Releases: <span className="font-semibold text-gray-900">{stat.releaseCount}</span>
          </p>
          <p className="text-sm text-gray-600">
            Sets: <span className="font-semibold text-gray-900">{stat.setCount}</span>
          </p>
          <p className="text-sm text-gray-600">
            Cards: <span className="font-semibold text-gray-900">{stat.cardCount.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Market Share: <span className="font-semibold text-gray-900">{stat.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Manufacturer Market Share</h3>
        <p className="text-sm text-gray-600 mt-1">Card distribution by manufacturer</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="manufacturer"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 80, 49, 0.1)' }} />
            <Bar dataKey="cardCount" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          {data.map((stat, index) => (
            <div key={stat.manufacturer} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-700 font-medium">{stat.manufacturer}</span>
              </div>
              <div className="flex gap-4 text-gray-600">
                <span>{stat.releaseCount} releases</span>
                <span className="font-semibold text-gray-900">
                  {stat.cardCount.toLocaleString()} cards ({stat.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
