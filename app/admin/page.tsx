"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

interface Stats {
  totalReleases: number;
  totalSets: number;
  totalCards: number;
  cardsWithImages: number;
  totalPosts: number;
  publishedPosts: number;
  parallelSetsWithoutImages: number;
  setsWithoutChecklists: number;
  releasesWithoutPosts: number;
  recentActivity: {
    type: "POST" | "RELEASE";
    title: string;
    id: string;
    date: string;
    action: "created" | "edited";
  }[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [libraryExpanded, setLibraryExpanded] = useState(true);
  const [statsExpanded, setStatsExpanded] = useState(true);

  // Removed redirect - allow unauthenticated users to see login page

  useEffect(() => {
    if (status === "loading") return; // Wait for auth to finish loading

    if (session?.user) {
      fetchStats();
    } else {
      setLoading(false); // Stop loading if no user session
    }
  }, [session, status]);

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
      <AdminLayout maxWidth="1600px">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!session?.user) {
    return (
      <AdminLayout maxWidth="1600px">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-footy-green mb-4">
              Admin Login Required
            </h1>
            <p className="text-gray-600 mb-6">
              Please sign in to access the admin dashboard.
            </p>
            <button
              onClick={() => signIn()}
              className="w-full bg-gradient-to-r from-footy-green to-green-700 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-105 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout maxWidth="1600px">
        <div className="mb-6">
          {/* Quick Actions */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/admin/releases/create")}
              className="bg-gradient-to-br from-green-500 via-footy-green to-green-700 text-white p-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col items-center gap-3"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-bold text-lg">Create Release</span>
              <span className="text-xs text-white/80 text-center">
                Add a new card product release
              </span>
            </button>

            <button
              onClick={() => router.push("/admin/posts/create")}
              className="bg-gradient-to-br from-orange-500 via-footy-orange to-orange-700 text-white p-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col items-center gap-3"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="font-bold text-lg">Create Post</span>
              <span className="text-xs text-white/80 text-center">
                Write a new blog post or article
              </span>
            </button>

            <button
              onClick={() => router.push("/admin/cards/scan")}
              className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white p-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col items-center gap-3"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-bold text-lg">Scan Cards</span>
              <span className="text-xs text-white/80 text-center">
                Upload and identify card images
              </span>
            </button>
          </div>
        </div>

          {/* Recent Activity */}
          {stats && stats.recentActivity && stats.recentActivity.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4 mt-8">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Activity
              </h2>
              <button
                onClick={() => router.push("/admin/activity")}
                className="text-sm font-semibold text-footy-green hover:underline flex items-center gap-1"
              >
                View All Activity
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-footy-green/10 rounded-full flex items-center justify-center">
                      {activity.type === "RELEASE" && "📦"}
                      {activity.type === "POST" && "📝"}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(activity.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        activity.action === "created"
                          ? "bg-green-100 text-green-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {activity.action === "created" ? "New" : "Edited"}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {activity.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </>
          )}


        {/* Library Accordion */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <button
            onClick={() => setLibraryExpanded(!libraryExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-bold text-gray-900">Library</h2>
            <svg
              className={`w-6 h-6 text-gray-600 transition-transform ${libraryExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {libraryExpanded && (
            <div className="px-6 pb-6">
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push("/admin/library/source-documents")}
                  className="bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 text-footy-green border-2 border-green-200 p-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col items-center gap-2"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Source Documents</span>
                  <span className="text-xs text-green-700 text-center">
                    PDFs, docs used for GenAI releases and posts
                  </span>
                </button>

                <button
                  onClick={() => router.push("/admin/library/checklists")}
                  className="bg-gradient-to-br from-orange-50 via-orange-100 to-amber-100 text-footy-orange border-2 border-orange-200 p-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col items-center gap-2"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span className="font-semibold">Checklists</span>
                  <span className="text-xs text-orange-700 text-center">
                    Manage set checklists and card listings
                  </span>
                </button>

                <button
                  onClick={() => router.push("/admin/library/card-images")}
                  className="bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 text-footy-green border-2 border-green-200 p-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col items-center gap-2"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Card Images</span>
                  <span className="text-xs text-green-700 text-center">
                    Browse and manage all card images
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Accordion */}
        {stats && (
          <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
            <button
              onClick={() => setStatsExpanded(!statsExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-xl font-bold text-gray-900">Statistics</h2>
              <svg
                className={`w-6 h-6 text-gray-600 transition-transform ${statsExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {statsExpanded && (
              <div className="px-6 pb-6">
                {/* Primary Stats Grid */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Overview</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Attention Needed</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <AlertCard
                      title="Sets Without Checklists"
                      value={stats.setsWithoutChecklists}
                      icon="📋"
                      description="Sets missing checklist data"
                    />
                    <AlertCard
                      title="Cards Missing Images"
                      value={stats.totalCards - stats.cardsWithImages}
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
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Detailed Metrics</h3>
                  <div className="space-y-3">
                    <MetricRow
                      label="Image Coverage"
                      value={stats.cardsWithImages}
                      total={stats.totalCards}
                      percentage={Math.round((stats.cardsWithImages / stats.totalCards) * 100)}
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
              </div>
            )}
          </div>
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
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 shadow-lg text-white`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl opacity-90">{icon}</span>
        <span className="text-2xl font-bold">
          {value}
        </span>
      </div>
      <p className="text-xs font-semibold text-white/90">
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
    <div className={`rounded-xl p-4 shadow-lg border-2 ${
      isWarning
        ? 'bg-amber-50 border-amber-300'
        : 'bg-green-50 border-green-300'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl">{icon}</span>
        <span className={`text-2xl font-bold ${
          isWarning ? 'text-amber-700' : 'text-green-700'
        }`}>
          {value}
        </span>
      </div>
      <p className={`text-sm font-semibold mb-0.5 ${
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
      <div className="flex items-center justify-between mb-1">
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
