"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";

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
    type: string;
    title: string;
    date: string;
  }[];
  recentPosts: {
    id: string;
    type: string;
    title: string;
    slug: string;
    createdAt: string;
  }[];
  recentReleases: {
    id: string;
    name: string;
    year: string | null;
    slug: string;
    manufacturer: string;
    createdAt: string;
  }[];
  recentCards: {
    id: string;
    playerName: string;
    cardNumber: string;
    setName: string;
    releaseName: string;
    manufacturer: string;
    createdAt: string;
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-footy-green">
            Footy&apos;s Dashboard
          </h1>
        </div>

        {/* Statistics Grid */}
        {stats && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Stats
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard
                title="Total Releases"
                value={stats.totalReleases}
                icon="📦"
              />
              <StatCard
                title="Total Sets"
                value={stats.totalSets}
                icon="📚"
              />
              <StatCard
                title="Sets Without Checklists"
                value={stats.setsWithoutChecklists}
                icon="📋"
              />
              <StatCard
                title="Cards with Image/Total Cards"
                value={`${stats.cardsWithImages}/${stats.totalCards}`}
                icon="🃏"
              />
              <StatCard
                title="Published Posts"
                value={`${stats.publishedPosts}/${stats.totalPosts}`}
                icon="📝"
              />
            </div>
          </>
        )}

        {/* Quick Actions - No heading per user request */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push("/admin/releases/create")}
            className="bg-gradient-to-r from-footy-green to-green-700 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-semibold">Create Release & Sets</span>
            <span className="text-xs text-white/80 text-center">
              AI extracts all sets & cards automatically
            </span>
          </button>

          <button
            onClick={() => router.push("/admin/cards/create")}
            className="bg-gradient-to-r from-footy-orange to-orange-600 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold">Scan Cards</span>
            <span className="text-xs text-white/80 text-center">
              Scan and analyze card images with AI
            </span>
          </button>

          <button
            onClick={() => router.push("/admin/posts/create")}
            className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-semibold">Create Post</span>
            <span className="text-xs text-white/80 text-center">
              Write a new blog post
            </span>
          </button>

          <button
            onClick={() => router.push("/admin/releases")}
            className="bg-gradient-to-r from-footy-green to-green-700 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-semibold">Manage Releases & Sets</span>
            <span className="text-xs text-white/80 text-center">
              Edit releases, sets, and cards
            </span>
          </button>

          <button
            onClick={() => router.push("/admin/cards")}
            className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="font-semibold">Manage Card Images</span>
            <span className="text-xs text-white/80 text-center">
              Add and edit card images in checklist
            </span>
          </button>

          <button
            onClick={() => router.push("/admin/posts")}
            className="bg-gradient-to-r from-purple-400 to-purple-600 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="font-semibold">Manage Posts</span>
            <span className="text-xs text-white/80 text-center">
              View, edit, and publish posts
            </span>
          </button>
        </div>

        {/* Recent Activity */}
        {stats && (
          <>
            {stats.recentActivity && stats.recentActivity.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
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
                          {activity.type === "SET" && "📚"}
                          {activity.type === "CARD" && "🃏"}
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
                        <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {activity.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Recent Content Sections */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Recent Posts */}
              {stats.recentPosts && stats.recentPosts.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-xl">📝</span>
                      Recent Posts
                    </h3>
                    <button
                      onClick={() => router.push("/admin/posts")}
                      className="text-xs text-footy-green hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {stats.recentPosts.map((post) => (
                      <div
                        key={post.id}
                        className="pb-3 border-b border-gray-200 last:border-0 last:pb-0"
                      >
                        <button
                          onClick={() => router.push(`/admin/posts/edit/${post.id}`)}
                          className="text-left w-full hover:text-footy-green transition-colors"
                        >
                          <p className="font-medium text-sm text-gray-900 line-clamp-2">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {post.type}
                            </span>
                            <p className="text-xs text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Releases */}
              {stats.recentReleases && stats.recentReleases.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      Recent Releases
                    </h3>
                    <button
                      onClick={() => router.push("/admin/releases")}
                      className="text-xs text-footy-green hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {stats.recentReleases.map((release) => (
                      <div
                        key={release.id}
                        className="pb-3 border-b border-gray-200 last:border-0 last:pb-0"
                      >
                        <button
                          onClick={() => router.push(`/admin/releases/edit/${release.id}`)}
                          className="text-left w-full hover:text-footy-green transition-colors"
                        >
                          <p className="font-medium text-sm text-gray-900 line-clamp-2">
                            {release.manufacturer} {release.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {release.year && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                                {release.year}
                              </span>
                            )}
                            <p className="text-xs text-gray-500">
                              {new Date(release.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Cards */}
              {stats.recentCards && stats.recentCards.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-xl">🃏</span>
                      Recent Cards
                    </h3>
                    <button
                      onClick={() => router.push("/admin/cards")}
                      className="text-xs text-footy-green hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {stats.recentCards.map((card) => (
                      <div
                        key={card.id}
                        className="pb-3 border-b border-gray-200 last:border-0 last:pb-0"
                      >
                        <div className="text-left w-full">
                          <p className="font-medium text-sm text-gray-900 line-clamp-1">
                            {card.playerName}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-1">
                            #{card.cardNumber} - {card.setName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded line-clamp-1">
                              {card.manufacturer}
                            </span>
                            <p className="text-xs text-gray-500">
                              {new Date(card.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
}: {
  title: string;
  value: number | string;
  icon: string;
}) {
  return (
    <div className="bg-gradient-to-br from-footy-green to-green-700 rounded-xl p-6 shadow-lg text-white">
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
    warning: "from-yellow-50 to-amber-50 border-yellow-200",
    info: "from-blue-50 to-indigo-50 border-blue-200",
    good: "from-green-50 to-emerald-50 border-green-200",
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
        <span className="text-2xl font-bold text-gray-900">
          {value}
        </span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">
        {title}
      </h3>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  );
}
