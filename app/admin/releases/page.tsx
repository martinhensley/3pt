"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
import Link from "next/link";

interface Release {
  id: string;
  name: string;
  year: string | null;
  slug: string;
  releaseDate: string | null;
  createdAt: string;
  manufacturer: {
    id: string;
    name: string;
  };
  sets: {
    id: string;
    name: string;
    parentSetId: string | null;
    _count: {
      cards: number;
    };
  }[];
  images: {
    id: string;
    url: string;
  }[];
}

export default function ManageReleasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "year" | "created">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchReleases();
    }
  }, [session]);

  const fetchReleases = async () => {
    try {
      const response = await fetch("/api/releases");
      if (response.ok) {
        const data = await response.json();
        setReleases(Array.isArray(data) ? data : [data]);
      }
    } catch (error) {
      console.error("Failed to fetch releases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (releaseId: string, releaseName: string) => {
    if (!confirm(`Are you sure you want to delete "${releaseName}"? This will also delete all sets and cards in this release. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/releases?id=${releaseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Release deleted successfully!",
        });
        fetchReleases();
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to delete release");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete release" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Get unique manufacturers
  const manufacturers = Array.from(
    new Set(releases.map((r) => r.manufacturer.name))
  ).sort();

  // Filter and sort releases
  const filteredAndSortedReleases = releases
    .filter((release) => {
      // Manufacturer filter
      if (manufacturerFilter !== "all" && release.manufacturer.name !== manufacturerFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const manufacturerName = release.manufacturer.name.toLowerCase();
        const releaseName = release.name.toLowerCase();
        const year = release.year?.toLowerCase() || "";
        const fullName = `${manufacturerName} ${releaseName}`.toLowerCase();
        const slug = release.slug.toLowerCase();

        if (!manufacturerName.includes(query) &&
            !releaseName.includes(query) &&
            !year.includes(query) &&
            !fullName.includes(query) &&
            !slug.includes(query)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = `${a.manufacturer.name} ${a.name}`.localeCompare(`${b.manufacturer.name} ${b.name}`);
          break;
        case "year":
          comparison = (a.year || "").localeCompare(b.year || "");
          break;
        case "created":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <AdminLayout>
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Manage Releases & Sets", href: "/admin/releases" },
            ]}
          />

          {message && (
            <div
              className={`p-4 rounded-lg mb-4 mt-6 ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Search, Filters, and Actions */}
          <div className="mt-6 mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search releases by name, manufacturer, or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-footy-green focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="all">All Manufacturers</option>
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "year" | "created")}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="name">Sort by Name</option>
                <option value="year">Sort by Year</option>
                <option value="created">Sort by Created Date</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 flex items-center gap-2"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </button>

              <div className="flex-grow"></div>

              <Link
                href="/admin/releases/create"
                className="px-4 py-2 bg-footy-green hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Create New Release
              </Link>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedReleases.length} of {releases.length} releases
            </div>
          </div>
        </div>

        {/* Releases List */}
        <div className="space-y-4">
          {filteredAndSortedReleases.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {searchQuery || manufacturerFilter !== "all"
                  ? "No releases match your filters. Try adjusting your search."
                  : "No releases found. Create your first release to get started!"}
              </p>
            </div>
          ) : (
            filteredAndSortedReleases.map((release) => (
              <div
                key={release.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-gray-900">
                          {release.year ? `${release.year} ` : ''}{release.manufacturer.name} {release.name}
                        </h2>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {release.sets.length} sets
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          {release.sets.reduce((sum, set) => sum + set._count.cards, 0)} cards
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {release.images.length} images
                        </span>
                        {release.releaseDate && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {release.releaseDate}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-500">
                        Slug: <code className="bg-gray-100 px-2 py-1 rounded">{release.slug}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/releases/${release.slug}`}
                        target="_blank"
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        title="View release"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Link>
                      <Link
                        href={`/admin/releases/edit/${release.id}`}
                        className="px-4 py-2 bg-footy-green hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(release.id, `${release.manufacturer.name} ${release.name}`)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
    </AdminLayout>
  );
}
