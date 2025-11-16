"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EbayAd from "@/components/EbayAd";

interface Set {
  id: string;
  name: string;
  slug: string;
  type: string;
  totalCards: string | null;
  printRun: number | null;
  isParallel: boolean;
  baseSetSlug: string | null;
  createdAt: string;
  release: {
    id: string;
    name: string;
    year: string | null;
    slug: string;
    manufacturer: {
      name: string;
    };
  };
  _count: {
    cards: number;
  };
}

export default function SetsIndexPage() {
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [setTypeFilter, setSetTypeFilter] = useState("");
  const [parallelFilter, setParallelFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "year" | "cardCount" | "release">("year");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [setsPerPage, setSetsPerPage] = useState(12);

  // Filter options (loaded from initial fetch)
  const [uniqueYears, setUniqueYears] = useState<string[]>([]);
  const [uniqueManufacturers, setUniqueManufacturers] = useState<string[]>([]);
  const [uniqueSetTypes, setUniqueSetTypes] = useState<string[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch sets with server-side filtering
  const fetchSets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: setsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (yearFilter) params.append("year", yearFilter);
      if (manufacturerFilter) params.append("manufacturer", manufacturerFilter);
      if (setTypeFilter) params.append("type", setTypeFilter);
      if (parallelFilter) params.append("parallel", parallelFilter);

      const response = await fetch(`/api/checklists?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sets');
      }
      const data = await response.json();
      setSets(Array.isArray(data.sets) ? data.sets : []);
      setFilteredCount(data.pagination?.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch sets:", error);
      setSets([]);
      setFilteredCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, setsPerPage, debouncedSearch, yearFilter, manufacturerFilter, setTypeFilter, parallelFilter, sortBy, sortOrder]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch a small sample to get unique values for filters
        const response = await fetch('/api/checklists?page=1&limit=500');
        const data = await response.json();
        const sampleSets = Array.isArray(data.sets) ? data.sets : [];

        // Extract unique values
        const years = new Set(sampleSets.map((s: Set) => s.release.year).filter(Boolean));
        setUniqueYears(Array.from(years).sort().reverse());

        const manufacturers = new Set(sampleSets.map((s: Set) => s.release.manufacturer.name));
        setUniqueManufacturers(Array.from(manufacturers).sort());

        const types = new Set(sampleSets.map((s: Set) => s.type));
        setUniqueSetTypes(Array.from(types).sort());

        // Store total count
        setTotalCount(data.pagination?.totalCount || 0);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch sets when filters/pagination changes
  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, yearFilter, manufacturerFilter, setTypeFilter, parallelFilter, sortBy, sortOrder]);

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
    setSearchQuery("");
    setYearFilter("");
    setManufacturerFilter("");
    setSetTypeFilter("");
    setParallelFilter("");
    setSortBy("year");
    setSortOrder("desc");
  };

  const hasActiveFilters = searchQuery || yearFilter || manufacturerFilter || setTypeFilter || parallelFilter;

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "Base":
        return "bg-blue-100 text-blue-800";
      case "Insert":
        return "bg-purple-100 text-purple-800";
      case "Autograph":
        return "bg-green-100 text-green-800";
      case "Memorabilia":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query="soccer cards"
            limit={3}
            title="Soccer Cards"
          />
        </aside>

        <main className="flex-grow max-w-5xl space-y-6">
          <Header rounded={true} />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-footy-green to-green-700 rounded-2xl shadow-2xl overflow-hidden text-white p-8">
                <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
                  All Sets
                </h1>
                <div className="text-xl">
                  {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} Set{totalCount !== 1 ? 's' : ''}
                  {hasActiveFilters && <span className="text-sm ml-2">(filtered)</span>}
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by set name, release, or manufacturer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900 placeholder-gray-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filters and Sort */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Year Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Year
                    </label>
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
                    >
                      <option value="">All Years</option>
                      {uniqueYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Manufacturer Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Manufacturer
                    </label>
                    <select
                      value={manufacturerFilter}
                      onChange={(e) => setManufacturerFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
                    >
                      <option value="">All Manufacturers</option>
                      {uniqueManufacturers.map(mfg => (
                        <option key={mfg} value={mfg}>{mfg}</option>
                      ))}
                    </select>
                  </div>

                  {/* Set Type Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Set Type
                    </label>
                    <select
                      value={setTypeFilter}
                      onChange={(e) => setSetTypeFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
                    >
                      <option value="">All Types</option>
                      {uniqueSetTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Parallel Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Parallel Status
                    </label>
                    <select
                      value={parallelFilter}
                      onChange={(e) => setParallelFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
                    >
                      <option value="">All Sets</option>
                      <option value="non-parallel">Non-Parallel Only</option>
                      <option value="parallel">Parallel Only</option>
                    </select>
                  </div>

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
                      <option value="release">Release</option>
                      <option value="cardCount">Card Count</option>
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

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-footy-green hover:text-green-700 font-semibold"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Per Page Selector */}
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {sets.length > 0 ? ((currentPage - 1) * setsPerPage) + 1 : 0} - {Math.min(currentPage * setsPerPage, filteredCount)} of {filteredCount.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="perPage" className="text-sm font-medium text-gray-700">
                      Sets per page:
                    </label>
                    <select
                      id="perPage"
                      value={setsPerPage}
                      onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
                    >
                      <option value="12">12</option>
                      <option value="24">24</option>
                      <option value="48">48</option>
                      <option value="96">96</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sets Grid */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                {sets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">
                      {hasActiveFilters ? "No sets found matching your filters." : "No sets found."}
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
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {sets.map((set) => (
                      <Link
                        key={set.id}
                        href={`/sets/${set.slug}`}
                        className="block bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 hover:border-footy-orange hover:shadow-xl transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-grow">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {set.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {set.release.year} {set.release.manufacturer.name} {set.release.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(set.type)}`}>
                            {set.type}
                          </span>
                          {set.isParallel && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                              Parallel
                            </span>
                          )}
                          {set.printRun && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                              /{set.printRun}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">{set._count.cards.toLocaleString()}</span> card{set._count.cards !== 1 ? 's' : ''}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
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

              <Footer rounded={true} />
            </>
          )}
        </main>

        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query="soccer autographs"
            limit={3}
            title="Soccer Autographs"
          />
        </aside>
      </div>
    </div>
  );
}
