"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

interface Stats {
  totalReleases: number;
  totalSets: number;
  expectedCardCount: number;
  cardsWithImages: number;
  totalPosts: number;
  publishedPosts: number;
  parallelSetsWithoutImages: number;
  setsWithoutChecklists: number;
  releasesWithoutPosts: number;
}

export default function StatsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout maxWidth="1600px">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout maxWidth="1600px">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistics</h1>
        <p className="text-gray-600">Overview of your content library and database metrics</p>
      </div>

      {stats && (
        <>
          {/* Primary Stats Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="Total Releases"
                value={stats.totalReleases}
                icon="📦"
                color="green"
              />
              <StatCard
                title="Total Sets"
                value={stats.totalSets}
                icon="📚"
                color="blue"
              />
              <StatCard
                title="Total Cards"
                value={stats.expectedCardCount}
                icon="🃏"
                color="purple"
              />
              <StatCard
                title="Cards with Images"
                value={stats.cardsWithImages}
                icon="🖼️"
                color="indigo"
              />
              <StatCard
                title="Published Posts"
                value={`${stats.publishedPosts}/${stats.totalPosts}`}
                icon="📝"
                color="orange"
              />
            </div>
          </div>

          {/* Attention Needed */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Attention Needed</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <AlertCard
                title="Sets Without Checklists"
                value={stats.setsWithoutChecklists}
                icon="📋"
                description="Sets missing checklist data"
              />
              <AlertCard
                title="Cards Missing Images"
                value={stats.expectedCardCount - stats.cardsWithImages}
                icon="🖼️"
                description="Cards that need images uploaded"
              />
              <AlertCard
                title="Releases Without Posts"
                value={stats.releasesWithoutPosts}
                icon="📝"
                description="Releases that need blog posts"
              />
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Detailed Metrics</h2>
            <div className="space-y-4">
              <MetricRow
                label="Image Coverage"
                value={stats.cardsWithImages}
                total={stats.expectedCardCount}
                percentage={Math.round((stats.cardsWithImages / stats.expectedCardCount) * 100)}
              />
              <MetricRow
                label="Post Publication Rate"
                value={stats.publishedPosts}
                total={stats.totalPosts}
                percentage={Math.round((stats.publishedPosts / stats.totalPosts) * 100)}
              />
              <MetricRow
                label="Sets with Checklists"
                value={stats.totalSets - stats.setsWithoutChecklists}
                total={stats.totalSets}
                percentage={Math.round(((stats.totalSets - stats.setsWithoutChecklists) / stats.totalSets) * 100)}
              />
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: 'green' | 'blue' | 'purple' | 'indigo' | 'orange';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    green: 'from-green-500 to-green-700',
    blue: 'from-blue-500 to-blue-700',
    purple: 'from-purple-500 to-purple-700',
    indigo: 'from-indigo-500 to-indigo-700',
    orange: 'from-orange-500 to-orange-700',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 shadow-lg text-white`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl opacity-90">{icon}</span>
        <span className="text-3xl font-bold">
          {value}
        </span>
      </div>
      <p className="text-sm font-semibold text-white/90">
        {title}
      </p>
    </div>
  );
}

interface AlertCardProps {
  title: string;
  value: number;
  icon: string;
  description: string;
}

function AlertCard({ title, value, icon, description }: AlertCardProps) {
  const isWarning = value > 0;

  return (
    <div className={`rounded-xl p-6 shadow-lg border-2 ${
      isWarning
        ? 'bg-amber-50 border-amber-300'
        : 'bg-green-50 border-green-300'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className={`text-3xl font-bold ${
          isWarning ? 'text-amber-700' : 'text-green-700'
        }`}>
          {value}
        </span>
      </div>
      <p className={`text-sm font-semibold mb-1 ${
        isWarning ? 'text-amber-900' : 'text-green-900'
      }`}>
        {title}
      </p>
      <p className={`text-xs ${
        isWarning ? 'text-amber-600' : 'text-green-600'
      }`}>
        {description}
      </p>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: number;
  total: number;
  percentage: number;
}

function MetricRow({ label, value, total, percentage }: MetricRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">
          {value} / {total} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-footy-green to-green-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
