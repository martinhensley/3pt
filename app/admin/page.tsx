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
    type: "POST" | "RELEASE" | "CARD";
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
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [libraryExpanded, setLibraryExpanded] = useState(true);

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-footy-green">
            Footy&apos;s Dashboard
          </h1>
        </div>

        {/* Recent Activity - Moved to top */}
        {stats && stats.recentActivity && stats.recentActivity.length > 0 && (
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
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        activity.action === "created"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
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

        {/* Statistics Accordion */}
        {stats && (
          <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
            <button
              onClick={() => setStatsExpanded(!statsExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-xl font-bold text-gray-900">Stats</h2>
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
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
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
              </div>
            )}
          </div>
        )}

        {/* Quick Actions Accordion */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <button
            onClick={() => setActionsExpanded(!actionsExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <svg
              className={`w-6 h-6 text-gray-600 transition-transform ${actionsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {actionsExpanded && (
            <div className="px-6 pb-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
          )}
        </div>

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
                  className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Source Documents</span>
                  <span className="text-xs text-white/80 text-center">
                    PDFs, docs used for GenAI releases and posts
                  </span>
                </button>

                <button
                  onClick={() => router.push("/admin/library/checklists")}
                  className="bg-gradient-to-r from-teal-500 to-teal-700 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span className="font-semibold">Checklists</span>
                  <span className="text-xs text-white/80 text-center">
                    Manage set checklists and card listings
                  </span>
                </button>

                <button
                  onClick={() => router.push("/admin/library/card-images")}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center gap-2"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Card Images</span>
                  <span className="text-xs text-white/80 text-center">
                    Browse and manage all card images
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
    </AdminLayout>
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
