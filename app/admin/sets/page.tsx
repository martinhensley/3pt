"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
import Link from "next/link";

interface Set {
  id: string;
  name: string;
  slug: string;
  type: string;
  printRun: number | null;
  createdAt: string;
  release: {
    id: string;
    name: string;
    year: string | null;
    manufacturer: {
      id: string;
      name: string;
    };
  };
  _count: {
    cards: number;
  };
}

export default function ManageSetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [releaseFilter, setReleaseFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "cards" | "created">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchSets();
    }
  }, [session]);

  const fetchSets = async () => {
    try {
      const response = await fetch("/api/checklists?limit=1000");
      if (response.ok) {
        const data = await response.json();
        // The API returns { sets: [...], pagination: {...} }
        setSets(data.sets || []);
      }
    } catch (error) {
      console.error("Failed to fetch sets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (setId: string, setName: string) => {
    if (!confirm(`Are you sure you want to delete "${setName}"? This will also delete all cards in this set. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/sets?id=${setId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Set deleted successfully!",
        });
        fetchSets();
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to delete set");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete set" });
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
    new Set(sets.map((s) => s.release.manufacturer.name))
  ).sort();

  // Get unique releases for selected manufacturer
  const releases = Array.from(
    new Set(
      sets
        .filter(
          (s) =>
            manufacturerFilter === "all" ||
            s.release.manufacturer.name === manufacturerFilter
        )
        .map((s) => `${s.release.id}|${s.release.year} ${s.release.manufacturer.name} ${s.release.name}`)
    )
  )
    .map((r) => {
      const [id, name] = r.split("|");
      return { id, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get unique set types
  const setTypes = Array.from(new Set(sets.map((s) => s.type))).sort();

  // Filter and sort sets
  const filteredAndSortedSets = sets
    .filter((set) => {
      // Manufacturer filter
      if (manufacturerFilter !== "all" && set.release.manufacturer.name !== manufacturerFilter) {
        return false;
      }

      // Release filter
      if (releaseFilter !== "all" && set.release.id !== releaseFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && set.type !== typeFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const setName = set.name.toLowerCase();
        const releaseName = set.release.name.toLowerCase();
        const manufacturerName = set.release.manufacturer.name.toLowerCase();
        const slug = set.slug.toLowerCase();

        if (!setName.includes(query) &&
            !releaseName.includes(query) &&
            !manufacturerName.includes(query) &&
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
          comparison = a.name.localeCompare(b.name);
          break;
        case "cards":
          comparison = a._count.cards - b._count.cards;
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
          <div className="flex items-center justify-between mb-6">
            <Breadcrumb
              items={[
                { label: "Admin", href: "/admin" },
                { label: "Manage Sets", href: "/admin/sets" },
              ]}
            />
            <Link
              href="/admin/sets/create"
              className="px-6 py-2 bg-3pt-green hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Set
            </Link>
          </div>

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
                placeholder="Search sets by name, release, or manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-3pt-green focus:border-transparent"
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
                onChange={(e) => {
                  setManufacturerFilter(e.target.value);
                  setReleaseFilter("all");
                }}
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
                value={releaseFilter}
                onChange={(e) => setReleaseFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="all">All Releases</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="all">All Types</option>
                {setTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "cards" | "created")}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="name">Sort by Name</option>
                <option value="cards">Sort by Card Count</option>
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

              <button
                onClick={() => {
                  setSearchQuery("");
                  setManufacturerFilter("all");
                  setReleaseFilter("all");
                  setTypeFilter("all");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedSets.length} of {sets.length} sets
            </div>
          </div>
        </div>

        {/* Sets List */}
        <div className="space-y-4">
          {filteredAndSortedSets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {searchQuery || manufacturerFilter !== "all" || releaseFilter !== "all" || typeFilter !== "all"
                  ? "No sets match your filters. Try adjusting your search."
                  : "No sets found. Create your first set to get started!"}
              </p>
            </div>
          ) : (
            filteredAndSortedSets.map((set) => (
              <div
                key={set.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-gray-900">
                          {set.name}
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          set.type === 'Base' ? 'bg-cyan-100 text-cyan-800' :
                          set.type === 'Autograph' ? 'bg-orange-100 text-orange-800' :
                          set.type === 'Memorabilia' ? 'bg-yellow-100 text-yellow-800' :
                          set.type === 'Insert' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {set.type}
                        </span>
                        {set.printRun && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                            /{set.printRun}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {set.release.year} {set.release.manufacturer.name} {set.release.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          {set._count.cards} cards
                        </span>
                      </div>

                      <div className="text-sm text-gray-500">
                        Slug: <code className="bg-gray-100 px-2 py-1 rounded">{set.slug}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/sets/${set.slug}`}
                        target="_blank"
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        title="View set"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Link>
                      <Link
                        href={`/admin/sets/edit/${set.id}`}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        title="Edit set"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(set.id, set.name)}
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
