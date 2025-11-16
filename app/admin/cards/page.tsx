"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
import Link from "next/link";
import Image from "next/image";

interface Card {
  id: string;
  slug: string | null;
  playerName: string | null;
  team: string | null;
  cardNumber: string | null;
  variant: string | null;
  parallelType: string | null;
  printRun: number | null;
  numbered: string | null;
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  imageFront: string | null;
  imageBack: string | null;
  createdAt: string;
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
        id: string;
        name: string;
      };
    };
  };
  images: {
    id: string;
    url: string;
  }[];
}

export default function ManageCardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [releaseFilter, setReleaseFilter] = useState<string>("all");
  const [setFilter, setSetFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"player" | "number" | "created">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const cardsPerPage = 50;

  // Helper function to get the effective type of a card
  const getCardType = (card: Card): string => {
    return card.set.type;
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchCards();
    }
  }, [session, currentPage]);

  const fetchCards = async () => {
    try {
      const response = await fetch(`/api/cards?page=${currentPage}&limit=${cardsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setCards(Array.isArray(data.cards) ? data.cards : []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cardId: string, cardName: string) => {
    if (!confirm(`Are you sure you want to delete "${cardName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/cards?id=${cardId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Card deleted successfully!",
        });
        fetchCards();
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to delete card");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete card" });
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
    new Set(cards.map((c) => c.set.release.manufacturer.name))
  ).sort();

  // Get unique releases for selected manufacturer
  const releases = Array.from(
    new Set(
      cards
        .filter(
          (c) =>
            manufacturerFilter === "all" ||
            c.set.release.manufacturer.name === manufacturerFilter
        )
        .map((c) => `${c.set.release.id}|${c.set.release.year} ${c.set.release.manufacturer.name} ${c.set.release.name}`)
    )
  )
    .map((r) => {
      const [id, name] = r.split("|");
      return { id, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get unique sets for selected release
  const sets = Array.from(
    new Set(
      cards
        .filter(
          (c) =>
            (manufacturerFilter === "all" ||
              c.set.release.manufacturer.name === manufacturerFilter) &&
            (releaseFilter === "all" || c.set.release.id === releaseFilter)
        )
        .map((c) => `${c.set.id}|${c.set.name}`)
    )
  )
    .map((s) => {
      const [id, name] = s.split("|");
      return { id, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter and sort cards
  const filteredAndSortedCards = cards
    .filter((card) => {
      // Manufacturer filter
      if (manufacturerFilter !== "all" && card.set.release.manufacturer.name !== manufacturerFilter) {
        return false;
      }

      // Release filter
      if (releaseFilter !== "all" && card.set.release.id !== releaseFilter) {
        return false;
      }

      // Set filter
      if (setFilter !== "all" && card.set.id !== setFilter) {
        return false;
      }

      // Type filter
      if (typeFilter === "autograph" && !card.hasAutograph) return false;
      if (typeFilter === "memorabilia" && !card.hasMemorabilia) return false;
      if (typeFilter === "numbered" && !card.numbered) return false;
      if (typeFilter === "parallel" && !card.parallelType) return false;

      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const playerMatch = card.playerName?.toLowerCase().includes(search);
        const teamMatch = card.team?.toLowerCase().includes(search);
        const numberMatch = card.cardNumber?.toLowerCase().includes(search);
        const variantMatch = card.variant?.toLowerCase().includes(search);
        return playerMatch || teamMatch || numberMatch || variantMatch;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "player":
          comparison = (a.playerName || "").localeCompare(b.playerName || "");
          break;
        case "number":
          comparison = (a.cardNumber || "").localeCompare(b.cardNumber || "");
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
              { label: "Manage Cards", href: "/admin/cards" },
            ]}
          />
          <Link
            href="/admin/cards/create"
            className="px-6 py-2 bg-footy-green hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Card
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
              placeholder="Search cards by player, team, number, or variant..."
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
              onChange={(e) => {
                setManufacturerFilter(e.target.value);
                setReleaseFilter("all");
                setSetFilter("all");
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
              onChange={(e) => {
                setReleaseFilter(e.target.value);
                setSetFilter("all");
              }}
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
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              <option value="all">All Sets</option>
              {sets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              <option value="all">All Types</option>
              <option value="autograph">Autographs</option>
              <option value="memorabilia">Memorabilia</option>
              <option value="numbered">Numbered</option>
              <option value="parallel">Parallels</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "player" | "number" | "created")}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              <option value="created">Sort by Date</option>
              <option value="player">Sort by Player</option>
              <option value="number">Sort by Number</option>
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
                setSetFilter("all");
                setTypeFilter("all");
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedCards.length} of {totalCount.toLocaleString()} cards
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredAndSortedCards.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {searchQuery || manufacturerFilter !== "all" || releaseFilter !== "all" || setFilter !== "all" || typeFilter !== "all"
                ? "No cards match your filters. Try adjusting your search."
                : "No cards found in the database."}
            </p>
          </div>
        ) : (
          filteredAndSortedCards.map((card) => {
            const cardName = `${card.playerName || "Unknown Player"}${
              card.cardNumber ? ` #${card.cardNumber}` : ""
            }${card.variant ? ` - ${card.variant}` : ""}`;

            return (
              <div
                key={card.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Card Images - Front and Back */}
                    <div className="flex-shrink-0 flex gap-2">
                      {/* Front Image */}
                      <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                        {card.imageFront ? (
                          <Image
                            src={card.imageFront}
                            alt={`${cardName} - Front`}
                            width={96}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <div className="text-center px-1">
                              <div className="text-xs font-semibold text-gray-400 mb-1">Front</div>
                              <div className="text-[10px] text-gray-400 leading-tight">Image coming soon</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Back Image */}
                      <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                        {card.imageBack ? (
                          <Image
                            src={card.imageBack}
                            alt={`${cardName} - Back`}
                            width={96}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <div className="text-center px-1">
                              <div className="text-xs font-semibold text-gray-400 mb-1">Back</div>
                              <div className="text-[10px] text-gray-400 leading-tight">Image coming soon</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {cardName}
                          </h2>

                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {card.hasAutograph && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                                Auto
                              </span>
                            )}
                            {card.hasMemorabilia && (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                Relic
                              </span>
                            )}
                            {card.numbered && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                {card.numbered}
                              </span>
                            )}
                            {card.parallelType && (
                              <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-semibold">
                                {card.parallelType}
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <div>
                              <span className="font-semibold">Release:</span>{" "}
                              {card.set.release.year} {card.set.release.manufacturer.name} {card.set.release.name}
                            </div>
                            <div>
                              <span className="font-semibold">Set:</span> {card.set.name}
                            </div>
                            {card.team && (
                              <div>
                                <span className="font-semibold">Team:</span> {card.team}
                              </div>
                            )}
                            {card.printRun && (
                              <div>
                                <span className="font-semibold">Print Run:</span> {card.printRun}
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 mt-2">
                            Slug: <code className="bg-gray-100 px-2 py-1 rounded">{card.slug || "N/A"}</code>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          {card.slug && (
                            <Link
                              href={`/cards/${card.slug}`}
                              target="_blank"
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                              title="View card"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </Link>
                          )}
                          <Link
                            href={`/admin/cards/edit/${card.id}`}
                            className="px-4 py-2 bg-footy-green hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(card.id, cardName)}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedCards.length > 0 && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {currentPage > 3 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  1
                </button>
                {currentPage > 4 && <span className="px-2">...</span>}
              </>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded-lg ${
                    currentPage === pageNum
                      ? "bg-footy-green text-white border-footy-green"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
