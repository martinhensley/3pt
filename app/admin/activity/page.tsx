"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";

interface ActivityItem {
  id: string;
  type: "RELEASE" | "SET" | "CARD" | "POST";
  title: string;
  date: string;
  link?: string;
}

function ActivityContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters and pagination
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get("type") || "ALL");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort") || "date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("order") as "asc" | "desc") || "desc"
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [pageSize] = useState(20);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchActivity();
    }
  }, [session, page, typeFilter, sortBy, sortOrder]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sort: sortBy,
        order: sortOrder,
        ...(typeFilter !== "ALL" && { type: typeFilter }),
      });

      const response = await fetch(`/api/admin/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeFilterChange = (type: string) => {
    setTypeFilter(type);
    setPage(1);
    updateURL({ type: type !== "ALL" ? type : null, page: "1" });
  };

  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
      updateURL({ order: newOrder });
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
      updateURL({ sort: newSortBy, order: "desc" });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateURL = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/admin/activity?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / pageSize);

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "RELEASE": return "📦";
      case "SET": return "📚";
      case "CARD": return "🃏";
      case "POST": return "📝";
      default: return "📄";
    }
  };

  return (
    <AdminLayout>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-footy-green hover:underline mb-4 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-footy-green mb-2">
            Activity History
          </h1>
          <p className="text-gray-600">
            Complete history of posts, releases, sets, and cards
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Type Filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-semibold text-gray-700 self-center mr-2">
                Filter by:
              </span>
              {["ALL", "RELEASE", "SET", "CARD", "POST"].map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeFilterChange(type)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    typeFilter === type
                      ? "bg-footy-green text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase() + "s"}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex gap-2 items-center">
              <span className="text-sm font-semibold text-gray-700">
                Sort by:
              </span>
              <button
                onClick={() => handleSortChange("date")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1 ${
                  sortBy === "date"
                    ? "bg-footy-green text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Date
                {sortBy === "date" && (
                  <svg className={`w-4 h-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => handleSortChange("type")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1 ${
                  sortBy === "type"
                    ? "bg-footy-green text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Type
                {sortBy === "type" && (
                  <svg className={`w-4 h-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No activity found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => activity.link && router.push(activity.link)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-footy-green/10 rounded-full flex items-center justify-center text-2xl">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">
                              {activity.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(activity.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                            {activity.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} activities
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>

                      {/* Page numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                page === pageNum
                                  ? "bg-footy-green text-white"
                                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
    </AdminLayout>
  );
}

export default function ActivityHistory() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ActivityContent />
    </Suspense>
  );
}
