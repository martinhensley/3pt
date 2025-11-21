'use client';

import type { SetTypeStat } from '@/lib/stats/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getSetTypeColor, getSetTypeLabel } from '@/lib/stats/calculations';

interface SetTypeChartProps {
  data: SetTypeStat[];
}

export default function SetTypeChart({ data }: SetTypeChartProps) {
  const totalCards = data.reduce((sum, stat) => sum + stat.cardCount, 0);
  const totalSets = data.reduce((sum, stat) => sum + stat.setCount, 0);

  const chartData = data.map((stat) => ({
    name: getSetTypeLabel(stat.type),
    value: stat.cardCount,
    sets: stat.setCount,
    percentage: stat.percentage,
    color: getSetTypeColor(stat.type),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const stat = payload[0].payload;

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{stat.name}</p>
          <p className="text-sm text-gray-600">
            Cards: <span className="font-semibold text-gray-900">{stat.value.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Sets: <span className="font-semibold text-gray-900">{stat.sets.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-semibold text-gray-900">{stat.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if slice is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Set Type Distribution</h3>
        <p className="text-sm text-gray-600 mt-1">Breakdown by card type</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          {data.map((stat) => (
            <div key={stat.type} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getSetTypeColor(stat.type) }}
                />
                <span className="text-gray-700">{getSetTypeLabel(stat.type)}</span>
              </div>
              <div className="flex gap-4 text-gray-600">
                <span>{stat.setCount} sets</span>
                <span className="font-semibold text-gray-900">
                  {stat.cardCount.toLocaleString()} cards
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm font-semibold">
          <span className="text-gray-900">Total</span>
          <div className="flex gap-4">
            <span className="text-gray-900">{totalSets} sets</span>
            <span className="text-gray-900">{totalCards.toLocaleString()} cards</span>
          </div>
        </div>
      </div>
    </div>
  );
}
