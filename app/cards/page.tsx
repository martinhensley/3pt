"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import PublicPageLayout from "@/components/PublicPageLayout";

interface Card {
  id: string;
  playerName: string | null;
  team: string | null;
  cardNumber: string | null;
  variant: string | null;
  parallelType: string | null;
  serialNumber: string | null;
  isNumbered: boolean;
  printRun: number | null;
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  imageFront: string | null;
  slug: string | null;
  set: {
    id: string;
    name: string;
    slug: string;
    type: string;
    release: {
      id: string;
      name: string;
      year: string | null;
      slug: string;
      manufacturer: {
        name: string;
      };
    };
  };
}

export default function CardsIndexPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState(""); // The search term currently being used for filtering
  const [yearFilter, setYearFilter] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [setTypeFilter, setSetTypeFilter] = useState("");
  const [specialFilter, setSpecialFilter] = useState("");
  const [sortBy, setSortBy] = useState<"player" | "team" | "year" | "cardNumber">("year");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState(10);

  // Filter options (loaded from initial fetch)
  const [uniqueYears, setUniqueYears] = useState<string[]>([]);
  const [uniqueManufacturers, setUniqueManufacturers] = useState<string[]>([]);
  const [uniqueSetTypes, setUniqueSetTypes] = useState<string[]>([]);

  // Handle search submission
  const handleSearch = () => {
    setActiveSearch(searchQuery);
    setCurrentPage(1);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Fetch cards with server-side filtering
  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: cardsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      if (activeSearch) params.append("search", activeSearch);
      if (yearFilter) params.append("year", yearFilter);
      if (manufacturerFilter) params.append("manufacturer", manufacturerFilter);
      if (setTypeFilter) params.append("setType", setTypeFilter);
      if (specialFilter) params.append("specialFeatures", specialFilter);

      const response = await fetch(`/api/cards?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      const data = await response.json();
      setCards(Array.isArray(data.cards) ? data.cards : []);
      setFilteredCount(data.pagination?.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch cards:", error);
      setCards([]);
      setFilteredCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, cardsPerPage, activeSearch, yearFilter, manufacturerFilter, setTypeFilter, specialFilter, sortBy, sortOrder]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch a small sample to get unique values for filters
        const response = await fetch('/api/cards?page=1&limit=1000');
        const data = await response.json();
        const sampleCards = Array.isArray(data.cards) ? data.cards : [];

        // Extract unique values
        const years = new Set(sampleCards.map((c: Card) => c.set.release.year).filter(Boolean));
        setUniqueYears(Array.from(years).sort().reverse());

        const manufacturers = new Set(sampleCards.map((c: Card) => c.set.release.manufacturer.name));
        setUniqueManufacturers(Array.from(manufacturers).sort());

        const types = new Set(sampleCards.map((c: Card) => c.set.type));
        setUniqueSetTypes(Array.from(types).sort());

        // Store total count
        setTotalCount(data.pagination?.totalCount || 0);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch cards when filters/pagination changes
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearch, yearFilter, manufacturerFilter, setTypeFilter, specialFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredCount / cardsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePerPageChange = (perPage: number) => {
    setCardsPerPage(perPage);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveSearch("");
    setYearFilter("");
    setManufacturerFilter("");
    setSetTypeFilter("");
    setSpecialFilter("");
    setSortBy("year");
    setSortOrder("desc");
  };

  const getCardLink = (card: Card) => {
    if (card.slug) {
      return `/cards/${card.slug}`;
    }
    const parts = [
      card.set.release.year,
      card.set.release.name,
      card.set.name,
      card.cardNumber,
      card.playerName || 'unknown'
    ].filter(Boolean);

    const slug = parts
      .join('-')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    return `/cards/${slug}`;
  };

  const hasActiveFilters = activeSearch || yearFilter || manufacturerFilter || setTypeFilter || specialFilter;

  return (
    <PublicPageLayout
      leftAdQuery="basketball player cards"
      leftAdTitle="Player Cards"
      rightAdQuery="basketball rookie cards"
      rightAdTitle="Rookie Cards"
      loading={loading}
    >
              {/* Header */}
              <div className="bg-gradient-to-r from-footy-green to-green-700 rounded-2xl shadow-2xl overflow-hidden text-white p-8">
                <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
                  All basketball cards
                </h1>
                <div className="text-xl">
                  {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} Card{totalCount !== 1 ? 's' : ''}
                  {hasActiveFilters && <span className="text-sm ml-2">(filtered)</span>}
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Search by player, team, set, release, or card number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      autoComplete="off"
                      data-form-type="other"
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900 placeholder-gray-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setActiveSearch("");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-6 py-3 bg-footy-green text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Search
                  </button>
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

                  {/* Special Features Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Special Features
                    </label>
                    <select
                      value={specialFilter}
                      onChange={(e) => setSpecialFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
                    >
                      <option value="">All Cards</option>
                      <option value="autograph">Autographs Only</option>
                      <option value="memorabilia">Memorabilia Only</option>
                      <option value="numbered">Numbered Only</option>
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
                      <option value="player">Player Name</option>
                      <option value="team">Team</option>
                      <option value="cardNumber">Card Number</option>
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
              <div className="bg-gradient-to-r from-footy-green to-green-700 rounded-xl shadow-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white">
                    Showing {cards.length > 0 ? ((currentPage - 1) * cardsPerPage) + 1 : 0} - {Math.min(currentPage * cardsPerPage, filteredCount)} of {filteredCount.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="perPage" className="text-sm font-medium text-white">
                      Cards per page:
                    </label>
                    <select
                      id="perPage"
                      value={cardsPerPage}
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

              {/* Cards Grid */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                {cards.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">
                      {hasActiveFilters ? "No cards found matching your filters." : "No cards found."}
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
                  <div className="grid gap-4">
                    {cards.map((card) => (
                      <Link
                        key={card.id}
                        href={getCardLink(card)}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-footy-orange hover:shadow-lg transition-all cursor-pointer"
                      >
                        {/* Card Image Preview */}
                        {card.imageFront ? (
                          <div className="flex-shrink-0 w-24 h-32 bg-gray-200 rounded-lg overflow-hidden relative">
                            <Image
                              src={card.imageFront}
                              alt={`${card.playerName} card`}
                              fill
                              className="object-contain"
                              sizes="96px"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-16 h-16 bg-footy-green text-white rounded-lg flex items-center justify-center font-black text-lg">
                            {card.cardNumber || '?'}
                          </div>
                        )}

                        <div className="flex-grow">
                          <div className="font-bold text-lg text-gray-900">
                            {card.playerName || 'Unknown Player'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {card.set.release.year} {card.set.release.manufacturer.name} {card.set.release.name}
                            {card.set.name && ` - ${card.set.name}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            {card.cardNumber && <span>#{card.cardNumber}</span>}
                            {card.team && <span className="ml-2">• {card.team}</span>}
                            {card.variant && <span className="ml-2 text-purple-600">• {card.variant}</span>}
                            {card.parallelType && <span className="ml-2 text-footy-orange">• {card.parallelType}</span>}
                          </div>
                        </div>

                        {(card.hasAutograph || card.hasMemorabilia || card.isNumbered) && (
                          <div className="flex gap-2 flex-wrap">
                            {card.hasAutograph && (
                              <span className="px-3 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full font-semibold">
                                AUTO
                              </span>
                            )}
                            {card.hasMemorabilia && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                                MEM
                              </span>
                            )}
                            {card.isNumbered && card.printRun && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-semibold">
                                /{card.printRun}
                              </span>
                            )}
                          </div>
                        )}
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
    </PublicPageLayout>
  );
}
