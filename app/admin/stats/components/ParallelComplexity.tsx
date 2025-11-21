'use client';

import type { ParallelComplexityStat } from '@/lib/stats/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ParallelComplexityProps {
  data: ParallelComplexityStat[];
}

export default function ParallelComplexity({ data }: ParallelComplexityProps) {
  const getComplexityColor = (avgParallels: number) => {
    if (avgParallels >= 10) return '#ef4444'; // red-500 - very complex
    if (avgParallels >= 7) return '#f59e0b'; // amber-500 - complex
    if (avgParallels >= 4) return '#3b82f6'; // blue-500 - moderate
    return '#10b981'; // green-500 - simple
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const stat = payload[0].payload;

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[220px]">
          <p className="font-semibold text-gray-900 mb-2">{stat.releaseName}</p>
          <p className="text-xs text-gray-600 mb-2">{stat.year}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Base Sets: <span className="font-semibold text-gray-900">{stat.baseSetCount}</span>
            </p>
            <p className="text-sm text-gray-600">
              Parallel Sets:{' '}
              <span className="font-semibold text-gray-900">{stat.parallelSetCount}</span>
            </p>
            <p className="text-sm text-gray-600">
              Avg Parallels/Base:{' '}
              <span className="font-semibold text-gray-900">{stat.avgParallelsPerBase}</span>
            </p>
            <p className="text-sm text-gray-600">
              Total Cards:{' '}
              <span className="font-semibold text-gray-900">{stat.totalCards.toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalParallels = data.reduce((sum, stat) => sum + stat.parallelSetCount, 0);
  const totalBase = data.reduce((sum, stat) => sum + stat.baseSetCount, 0);
  const avgComplexity = totalBase > 0 ? (totalParallels / totalBase).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Parallel Complexity Analysis</h3>
        <p className="text-sm text-gray-600 mt-1">Top 10 most complex releases by parallel depth</p>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-lg font-semibold text-gray-600 mb-1">No Parallel Data</p>
          <p className="text-sm text-gray-500">No releases with parallel sets found</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-footy-green/10 rounded-lg border border-footy-green/20">
              <div className="text-xs text-gray-600 mb-1">Total Parallel Sets</div>
              <div className="text-2xl font-bold text-footy-green">{totalParallels}</div>
            </div>
            <div className="p-4 bg-footy-orange/10 rounded-lg border border-footy-orange/20">
              <div className="text-xs text-gray-600 mb-1">Total Base Sets</div>
              <div className="text-2xl font-bold text-footy-orange">{totalBase}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-gray-600 mb-1">Avg Complexity</div>
              <div className="text-2xl font-bold text-blue-600">{avgComplexity}</div>
              <div className="text-xs text-gray-500 mt-1">parallels per base set</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  label={{ value: 'Avg Parallels per Base Set', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  type="category"
                  dataKey="releaseName"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  width={140}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 80, 49, 0.05)' }} />
                <Bar dataKey="avgParallelsPerBase" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getComplexityColor(entry.avgParallelsPerBase)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Complexity Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-gray-600">Simple (&lt;4)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-gray-600">Moderate (4-6)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-gray-600">Complex (7-9)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-gray-600">Very Complex (≥10)</span>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Detailed Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Rank</th>
                    <th className="px-4 py-2 text-left">Release</th>
                    <th className="px-4 py-2 text-center">Year</th>
                    <th className="px-4 py-2 text-center">Base Sets</th>
                    <th className="px-4 py-2 text-center">Parallels</th>
                    <th className="px-4 py-2 text-center">Avg Complexity</th>
                    <th className="px-4 py-2 text-center">Total Cards</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((stat, index) => (
                    <tr key={stat.releaseSlug} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-semibold text-xs">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{stat.releaseName}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{stat.year}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{stat.baseSetCount}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        {stat.parallelSetCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="px-2 py-1 rounded font-semibold text-white text-xs"
                          style={{ backgroundColor: getComplexityColor(stat.avgParallelsPerBase) }}
                        >
                          {stat.avgParallelsPerBase}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {stat.totalCards.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
