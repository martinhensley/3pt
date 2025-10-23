"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";

interface Stats {
  totalReleases: number;
  totalSets: number;
  totalCards: number;
  totalPosts: number;
  publishedPosts: number;
  setsWithoutCards: number;
  setsWithoutChecklists: number;
  releasesWithoutPosts: number;
  cardsWithoutPosts: number;
  recentActivity: {
    type: string;
    title: string;
    date: string;
  }[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-footy-green dark:text-footy-orange mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your soccer card compendium
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push("/admin/releases/create")}
            className="bg-gradient-to-r from-footy-green to-green-700 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-semibold">Create Release</span>
            <span className="text-xs text-white/80 text-center">
              AI extracts all sets & cards automatically
            </span>
          </button>

          <button
            onClick={() => router.push("/admin/cards/create")}
            className="bg-gradient-to-r from-footy-orange to-orange-600 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-semibold">Create Card</span>
            <span className="text-xs text-white/80 text-center">
              Analyze individual card images
            </span>
          </button>

          <button
            onClick={() => router.push("/admin/posts")}
            className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="font-semibold">Manage Posts</span>
            <span className="text-xs text-white/80 text-center">
              View, edit, and publish posts
            </span>
          </button>

          <button
            onClick={() => router.push("/admin/posts?typeFilter=RELEASE")}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-semibold">Manage Releases</span>
            <span className="text-xs text-white/80 text-center">
              Edit releases, sets, and cards
            </span>
          </button>
        </div>

        {/* Statistics Grid */}
        {stats && (
          <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Overview Statistics
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                value={stats.totalCards}
                icon="🃏"
                color="orange"
              />
              <StatCard
                title="Published Posts"
                value={`${stats.publishedPosts}/${stats.totalPosts}`}
                icon="📝"
                color="purple"
              />
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Data Quality Alerts
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <AlertCard
                title="Sets Without Cards"
                value={stats.setsWithoutCards}
                description="Sets that don't have any cards catalogued"
                link="/admin/sets?filter=no-cards"
                severity={stats.setsWithoutCards > 0 ? "warning" : "good"}
              />
              <AlertCard
                title="Sets Without Checklists"
                value={stats.setsWithoutChecklists}
                description="Sets missing totalCards or checklist data"
                link="/admin/sets?filter=no-checklist"
                severity={stats.setsWithoutChecklists > 0 ? "warning" : "good"}
              />
              <AlertCard
                title="Releases Without Posts"
                value={stats.releasesWithoutPosts}
                description="Releases not linked to blog posts"
                link="/admin/releases?filter=no-posts"
                severity={stats.releasesWithoutPosts > 0 ? "info" : "good"}
              />
              <AlertCard
                title="Cards Without Posts"
                value={stats.cardsWithoutPosts}
                description="Individual cards not featured in posts"
                link="/admin/cards?filter=no-posts"
                severity="info"
              />
            </div>

            {stats.recentActivity && stats.recentActivity.length > 0 && (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Recent Activity
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-footy-green/10 dark:bg-footy-orange/10 rounded-full flex items-center justify-center">
                          {activity.type === "RELEASE" && "📦"}
                          {activity.type === "SET" && "📚"}
                          {activity.type === "CARD" && "🃏"}
                          {activity.type === "POST" && "📝"}
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(activity.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {activity.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: string;
  color: "green" | "blue" | "orange" | "purple";
}) {
  const colorClasses = {
    green: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800",
    blue: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800",
    orange: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800",
    purple: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {title}
      </p>
    </div>
  );
}

function AlertCard({
  title,
  value,
  description,
  link,
  severity,
}: {
  title: string;
  value: number;
  description: string;
  link: string;
  severity: "warning" | "info" | "good";
}) {
  const router = useRouter();

  const severityClasses = {
    warning: "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800",
    info: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800",
    good: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800",
  };

  const severityIcon = {
    warning: "⚠️",
    info: "ℹ️",
    good: "✅",
  };

  return (
    <div
      className={`bg-gradient-to-br ${severityClasses[severity]} border rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => router.push(link)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{severityIcon[severity]}</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
