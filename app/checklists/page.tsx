"use client";

import Link from "next/link";
import PublicPageLayout from "@/components/PublicPageLayout";
import { useEffect, useState, useCallback } from "react";

interface Manufacturer {
  id: string;
  name: string;
}

interface Release {
  id: string;
  name: string;
  year: string | null;
  manufacturer: Manufacturer;
}

interface SetWithRelease {
  id: string;
  name: string;
  slug: string;
  type: string;
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

export default function ChecklistsPage() {
  const [sets, setSets] = useState<SetWithRelease[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedRelease, setSelectedRelease] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Sort and pagination states
  const [sortBy, setSortBy] = useState<"name" | "year" | "cardCount" | "type">("year");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [setsPerPage, setSetsPerPage] = useState(25);

  // Fetch filter options on mount
  useEffect(() => {
    fetch("/api/checklists/filters")
      .then((res) => res.json())
      .then((data) => {
        setManufacturers(data.manufacturers || []);
        setReleases(data.releases || []);
      })
      .catch((error) => {
        console.error("Failed to fetch filter options:", error);
      });
  }, []);

  // Fetch sets with server-side filtering, sorting, and pagination
  const fetchSets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: setsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append("search", search);
      if (selectedManufacturer) params.append("manufacturer", selectedManufacturer);
      if (selectedRelease) params.append("release", selectedRelease);
      if (selectedType) params.append("type", selectedType);

      const response = await fetch(`/api/checklists?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch checklists');
      }
      const data = await response.json();
      setSets(Array.isArray(data.sets) ? data.sets : []);
      setFilteredCount(data.pagination?.totalCount || 0);
      if (!totalCount) {
        setTotalCount(data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch checklists:", error);
      setSets([]);
      setFilteredCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, setsPerPage, search, selectedManufacturer, selectedRelease, selectedType, sortBy, sortOrder, totalCount]);

  // Fetch sets when filters/pagination/sorting changes
  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedManufacturer, selectedRelease, selectedType, sortBy, sortOrder]);

  // Filter releases based on selected manufacturer
  const filteredReleases = selectedManufacturer
    ? releases.filter((r) => r.manufacturer.id === selectedManufacturer)
    : releases;

  // Get set type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Base":
        return "bg-cyan-100 text-cyan-800";
      case "Insert":
        return "bg-yellow-100 text-yellow-800";
      case "Autograph":
        return "bg-red-100 text-red-800";
      case "Memorabilia":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalPages = Math.ceil(filteredCount / setsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePerPageChange = (perPage: number) => {
    setSetsPerPage(perPage);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedManufacturer("");
    setSelectedRelease("");
    setSelectedType("");
    setSortBy("year");
    setSortOrder("desc");
  };

  const hasActiveFilters = search || selectedManufacturer || selectedRelease || selectedType;

  return (
    <PublicPageLayout
      leftAdQuery="basketball cards checklist"
      leftAdTitle="Card Checklists"
      rightAdQuery="soccer memorabilia"
      rightAdTitle="Soccer Memorabilia"
      horizontalAdQuery="soccer trading cards"
      horizontalAdTitle="More Soccer Cards"
      loading={loading}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-footy-green to-green-700 rounded-2xl shadow-2xl overflow-hidden text-white p-8 mb-6">
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
          Set Checklists
        </h1>
        <div className="text-xl">
          {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} Set{totalCount !== 1 ? 's' : ''}
          {hasActiveFilters && <span className="text-sm ml-2">(filtered)</span>}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search set names..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
            />
          </div>

          {/* Manufacturer filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Manufacturer
            </label>
            <select
              value={selectedManufacturer}
              onChange={(e) => {
                setSelectedManufacturer(e.target.value);
                setSelectedRelease(""); // Reset release when manufacturer changes
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
            >
              <option value="">All Manufacturers</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Release filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Release
            </label>
            <select
              value={selectedRelease}
              onChange={(e) => setSelectedRelease(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
            >
              <option value="">All Releases</option>
              {filteredReleases.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.year} {r.manufacturer.name} {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Set Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
            >
              <option value="">All Types</option>
              <option value="Base">Base</option>
              <option value="Insert">Insert</option>
              <option value="Autograph">Autograph</option>
              <option value="Memorabilia">Memorabilia</option>
            </select>
          </div>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-footy-green hover:text-green-700 font-semibold"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Sort Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sort</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sort By */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
            >
              <option value="year">Year</option>
              <option value="name">Set Name</option>
              <option value="cardCount">Card Count</option>
              <option value="type">Type</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Per Page & Count */}
      <div className="bg-gradient-to-r from-footy-green to-green-700 rounded-xl shadow-lg p-4 border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white">
            Showing {sets.length > 0 ? ((currentPage - 1) * setsPerPage) + 1 : 0} - {Math.min(currentPage * setsPerPage, filteredCount)} of {filteredCount.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="perPage" className="text-sm font-medium text-white">
              Sets per page:
            </label>
            <select
              id="perPage"
              value={setsPerPage}
              onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-white text-gray-900"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {sets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold text-footy-green mb-4">
              No Checklists Found
            </h2>
            <p className="text-gray-600">
              {hasActiveFilters ? "Try adjusting your filters to see more results" : "No checklists available"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2 bg-footy-green text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Checklists table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Set Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Release
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cards
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sets.map((set) => (
                    <tr key={set.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{set.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {set.release.year} {set.release.manufacturer.name} {set.release.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadgeColor(set.type)}`}>
                          {set.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{set._count.cards}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/sets/${set.slug}`}
                          className="text-footy-orange hover:text-orange-600 font-semibold text-sm transition-colors"
                        >
                          View Checklist →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mt-6">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-footy-green text-white border-footy-green'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Last
                </button>
              </div>
              <div className="text-center mt-4 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </>
      )}
    </PublicPageLayout>
  );
}
