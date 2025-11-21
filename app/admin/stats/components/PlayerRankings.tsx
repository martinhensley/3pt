'use client';

import type { PlayerStat } from '@/lib/stats/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PlayerRankingsProps {
  data: PlayerStat[];
}

export default function PlayerRankings({ data }: PlayerRankingsProps) {
  const chartData = data.map((player, index) => ({
    rank: index + 1,
    player: player.playerName,
    Base: player.baseCards,
    Autograph: player.autographCards,
    Memorabilia: player.memorabiliaCards,
    Insert: player.insertCards,
    total: player.cardCount,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
          <p className="font-semibold text-gray-900 mb-2">{data.player}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Base: <span className="font-semibold text-gray-900">{data.Base}</span>
            </p>
            <p className="text-sm text-gray-600">
              Autograph: <span className="font-semibold text-gray-900">{data.Autograph}</span>
            </p>
            <p className="text-sm text-gray-600">
              Memorabilia: <span className="font-semibold text-gray-900">{data.Memorabilia}</span>
            </p>
            <p className="text-sm text-gray-600">
              Insert: <span className="font-semibold text-gray-900">{data.Insert}</span>
            </p>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-900">
                Total: {data.total} cards
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top 10 Players by Card Count</h3>
        <p className="text-sm text-gray-600 mt-1">Most featured players across all releases</p>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis
              type="category"
              dataKey="player"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 80, 49, 0.05)' }} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => <span className="text-gray-700">{value}</span>}
            />
            <Bar dataKey="Base" stackId="a" fill="#005031" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Autograph" stackId="a" fill="#F47322" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Memorabilia" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Insert" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Player List */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((player, index) => (
            <div
              key={player.playerName}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-footy-green text-white font-semibold text-sm">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900">{player.playerName}</span>
              </div>
              <span className="text-lg font-bold text-footy-green">
                {player.cardCount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
