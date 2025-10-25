"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EbayAd from "@/components/EbayAd";
import EbayAdHorizontal from "@/components/EbayAdHorizontal";

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
  set: {
    id: string;
    name: string;
    parallels: string[] | null;
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
  const [filterRelease, setFilterRelease] = useState("");
  const [filterSet, setFilterSet] = useState("");
  const [filterParallel, setFilterParallel] = useState("");
  const [releaseSearchTerm, setReleaseSearchTerm] = useState("");
  const [setSearchTerm, setSetSearchTerm] = useState("");
  const [parallelSearchTerm, setParallelSearchTerm] = useState("");
  const [showReleaseSuggestions, setShowReleaseSuggestions] = useState(false);
  const [showSetSuggestions, setShowSetSuggestions] = useState(false);
  const [showParallelSuggestions, setShowParallelSuggestions] = useState(false);
  const [releases, setReleases] = useState<Array<{ slug: string; name: string; year: string | null }>>([]);
  const [sets, setSets] = useState<Array<{ id: string; name: string }>>([]);
  const [parallels, setParallels] = useState<Array<string>>([]);

  useEffect(() => {
    // Fetch all cards
    fetch("/api/cards/all")
      .then((res) => res.json())
      .then((data: Card[]) => {
        setCards(data);

        // Extract unique releases for filter dropdown
        const uniqueReleases = Array.from(
          new Map(
            data.map((card) => [
              card.set.release.slug,
              {
                slug: card.set.release.slug,
                name: card.set.release.name,
                year: card.set.release.year,
              },
            ])
          ).values()
        ).sort((a, b) => {
          // Sort by year desc, then by name
          if (a.year && b.year && a.year !== b.year) {
            return b.year.localeCompare(a.year);
          }
          return a.name.localeCompare(b.name);
        });

        setReleases(uniqueReleases);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch cards:", error);
        setLoading(false);
      });
  }, []);

  // Update sets when release filter changes
  useEffect(() => {
    if (filterRelease) {
      const releaseCards = cards.filter((card) => card.set.release.slug === filterRelease);

      // Get unique sets for the selected release
      const releaseSets = Array.from(
        new Map(
          releaseCards.map((card) => [card.set.id, { id: card.set.id, name: card.set.name }])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name));

      setSets(releaseSets);
    } else {
      setSets([]);
      setParallels([]);
      setFilterSet("");
      setFilterParallel("");
      setSetSearchTerm("");
      setParallelSearchTerm("");
    }
  }, [filterRelease, cards]);

  // Update parallels when set filter changes
  useEffect(() => {
    if (filterRelease && filterSet) {
      // Find the first card from the selected set to get the set's parallels array
      const selectedSetCard = cards.find(
        (card) => card.set.release.slug === filterRelease && card.set.id === filterSet
      );

      if (selectedSetCard && selectedSetCard.set.parallels && Array.isArray(selectedSetCard.set.parallels)) {
        // Use the set's parallels array and add "Base" at the beginning
        const setParallels = ["Base", ...selectedSetCard.set.parallels].sort((a, b) => {
          if (a === "Base") return -1;
          if (b === "Base") return 1;
          return a.localeCompare(b);
        });
        setParallels(setParallels);
      } else {
        // Fallback: get unique parallels from actual cards
        const setCards = cards.filter(
          (card) => card.set.release.slug === filterRelease && card.set.id === filterSet
        );

        const uniqueSetParallels = Array.from(
          new Set(
            setCards.map((card) => card.parallelType || "Base")
          )
        ).sort((a, b) => {
          if (a === "Base") return -1;
          if (b === "Base") return 1;
          return a.localeCompare(b);
        });

        setParallels(uniqueSetParallels);
      }
    } else {
      setParallels([]);
      setFilterParallel("");
      setParallelSearchTerm("");
    }
  }, [filterSet, filterRelease, cards]);

  // Filter releases based on search term
  const filteredReleases = releases.filter((release) => {
    if (!releaseSearchTerm) return true; // Show all when empty or clicking dropdown
    const searchLower = releaseSearchTerm.toLowerCase();
    const year = release.year || "";
    const name = release.name.toLowerCase();
    return year.includes(searchLower) || name.includes(searchLower);
  }).slice(0, 20); // Limit to 20 suggestions

  // Filter sets based on search term
  const filteredSets = sets.filter((set) => {
    if (!setSearchTerm) return true;
    return set.name.toLowerCase().includes(setSearchTerm.toLowerCase());
  }).slice(0, 20);

  // Filter parallels based on search term
  const filteredParallels = parallels.filter((parallel) => {
    if (!parallelSearchTerm) return true;
    return parallel.toLowerCase().includes(parallelSearchTerm.toLowerCase());
  }).slice(0, 20);

  // Handle release selection
  const handleReleaseSelect = (release: { slug: string; name: string; year: string | null }) => {
    setFilterRelease(release.slug);
    setReleaseSearchTerm(`${release.year} ${release.name}`);
    setShowReleaseSuggestions(false);
    setFilterSet("");
    setSetSearchTerm("");
  };

  // Handle set selection
  const handleSetSelect = (set: { id: string; name: string }) => {
    setFilterSet(set.id);
    setSetSearchTerm(set.name);
    setShowSetSuggestions(false);
  };

  // Handle parallel selection
  const handleParallelSelect = (parallel: string) => {
    setFilterParallel(parallel);
    setParallelSearchTerm(parallel);
    setShowParallelSuggestions(false);
  };

  // Handle release search input change
  const handleReleaseSearchChange = (value: string) => {
    setReleaseSearchTerm(value);
    if (value.length === 0) {
      setFilterRelease("");
      setFilterSet("");
      setSetSearchTerm("");
    }
  };

  // Handle set search input change
  const handleSetSearchChange = (value: string) => {
    setSetSearchTerm(value);
    if (value.length === 0) {
      setFilterSet("");
    }
  };

  // Handle parallel search input change
  const handleParallelSearchChange = (value: string) => {
    setParallelSearchTerm(value);
    if (value.length === 0) {
      setFilterParallel("");
    }
  };

  // Filter cards based on release, set, and parallel filters
  const filteredCards = cards
    .filter((card) => {
      const matchesRelease = !filterRelease || card.set.release.slug === filterRelease;
      const matchesSet = !filterSet || card.set.id === filterSet;

      // Handle parallel filter - "Base" matches null/empty parallelType
      const matchesParallel = !filterParallel ||
        (filterParallel === "Base" ? (!card.parallelType || card.parallelType === "" || card.parallelType === "Base") : card.parallelType === filterParallel);

      return matchesRelease && matchesSet && matchesParallel;
    })
    .sort((a, b) => {
      // First sort by release year (descending)
      const yearA = a.set.release.year || '';
      const yearB = b.set.release.year || '';
      if (yearA !== yearB) {
        return yearB.localeCompare(yearA);
      }

      // Then sort by set name
      if (a.set.name !== b.set.name) {
        return a.set.name.localeCompare(b.set.name);
      }

      // Then sort by card number numerically
      const numA = parseInt(a.cardNumber || '0') || 0;
      const numB = parseInt(b.cardNumber || '0') || 0;
      if (numA !== numB) {
        return numA - numB;
      }

      // Finally sort by player name
      const nameA = a.playerName || '';
      const nameB = b.playerName || '';
      return nameA.localeCompare(nameB);
    });

  // Generate card slug
  const getCardSlug = (card: Card) => {
    const cleanSetName = card.set.name
      .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
      .replace(/\boptic\s+base\b/gi, 'Optic')
      .replace(/\bbase\s+optic\b/gi, 'Optic')
      .replace(/\bbase\s+set\b/gi, 'Base')
      .replace(/\bsets?\b/gi, '')
      .trim();

    const slugParts = [
      card.set.release.year,
      card.set.release.name,
      cleanSetName,
      card.cardNumber || '',
      card.playerName || 'unknown',
    ];

    if (card.parallelType && card.parallelType.toLowerCase() !== 'base') {
      slugParts.push(card.parallelType);
    } else if (card.variant && card.variant.toLowerCase() !== 'base') {
      slugParts.push(card.variant);
    }

    return slugParts
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          {/* Header */}
          <div className="bg-gradient-to-r from-footy-green to-green-700 rounded-2xl shadow-2xl overflow-hidden mb-8 text-white p-8">
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              All Cards
            </h1>
            <div className="text-xl">
              {filteredCards.length.toLocaleString()} Card{filteredCards.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Release Filter */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Release
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type year or release name..."
                    value={releaseSearchTerm}
                    onChange={(e) => handleReleaseSearchChange(e.target.value)}
                    onFocus={() => setShowReleaseSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowReleaseSuggestions(false), 200)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowReleaseSuggestions(!showReleaseSuggestions)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    ▼
                  </button>
                </div>
                {showReleaseSuggestions && filteredReleases.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredReleases.map((release) => (
                      <button
                        key={release.slug}
                        type="button"
                        onClick={() => handleReleaseSelect(release)}
                        className="w-full text-left px-4 py-2 hover:bg-footy-green hover:text-white transition-colors"
                      >
                        <span className="font-semibold">{release.year}</span> {release.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Set Filter - Only show when release is selected */}
              {filterRelease && sets.length > 0 && (
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Filter by Set
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type set name..."
                      value={setSearchTerm}
                      onChange={(e) => handleSetSearchChange(e.target.value)}
                      onFocus={() => setShowSetSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSetSuggestions(false), 200)}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetSuggestions(!showSetSuggestions)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      ▼
                    </button>
                  </div>
                  {showSetSuggestions && filteredSets.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSets.map((set) => (
                        <button
                          key={set.id}
                          type="button"
                          onClick={() => handleSetSelect(set)}
                          className="w-full text-left px-4 py-2 hover:bg-footy-green hover:text-white transition-colors"
                        >
                          {set.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Parallel Filter - Only show when set is selected */}
              {filterSet && parallels.length > 0 && (
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Filter by Parallel
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type parallel type..."
                      value={parallelSearchTerm}
                      onChange={(e) => handleParallelSearchChange(e.target.value)}
                      onFocus={() => setShowParallelSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowParallelSuggestions(false), 200)}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green bg-white text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowParallelSuggestions(!showParallelSuggestions)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      ▼
                    </button>
                  </div>
                  {showParallelSuggestions && filteredParallels.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredParallels.map((parallel) => (
                        <button
                          key={parallel}
                          type="button"
                          onClick={() => handleParallelSelect(parallel)}
                          className="w-full text-left px-4 py-2 hover:bg-footy-green hover:text-white transition-colors"
                        >
                          {parallel}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
            {filteredCards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">
                  No cards found matching your filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCards.map((card) => (
                  <Link
                    key={card.id}
                    href={`/cards/${getCardSlug(card)}`}
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
                        {card.set.release.year} {card.set.release.name}
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
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">
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

          <EbayAdHorizontal
            query="soccer cards"
            limit={4}
            title="Related Soccer Cards"
          />

          <Footer rounded={true} />
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
