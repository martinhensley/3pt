"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRelease, setFilterRelease] = useState("");
  const [releases, setReleases] = useState<Array<{ slug: string; name: string; year: string | null }>>([]);

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

  // Filter cards based on search and release filter
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      !searchTerm ||
      (card.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (card.team?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (card.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesRelease = !filterRelease || card.set.release.slug === filterRelease;

    return matchesSearch && matchesRelease;
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
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600 dark:text-gray-300">Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header />

      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 py-8">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query="soccer cards"
            limit={3}
            title="Soccer Cards"
          />
        </aside>

        <main className="flex-grow max-w-5xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-footy-green to-green-700 dark:from-footy-orange dark:to-orange-700 rounded-2xl shadow-2xl overflow-hidden mb-8 text-white p-8">
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              All Cards
            </h1>
            <div className="text-xl">
              {filteredCards.length.toLocaleString()} Card{filteredCards.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Search Cards
                </label>
                <input
                  type="text"
                  placeholder="Player name, team, or card number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green dark:focus:ring-footy-orange bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Release
                </label>
                <select
                  value={filterRelease}
                  onChange={(e) => setFilterRelease(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green dark:focus:ring-footy-orange bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Releases</option>
                  {releases.map((release) => (
                    <option key={release.slug} value={release.slug}>
                      {release.year} {release.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
            {filteredCards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No cards found matching your filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCards.map((card) => (
                  <Link
                    key={card.id}
                    href={`/cards/${getCardSlug(card)}`}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-footy-orange hover:shadow-lg transition-all cursor-pointer"
                  >
                    {/* Card Image Preview */}
                    {card.imageFront ? (
                      <div className="flex-shrink-0 w-24 h-32 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden relative">
                        <Image
                          src={card.imageFront}
                          alt={`${card.playerName} card`}
                          fill
                          className="object-contain"
                          sizes="96px"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-16 bg-footy-green dark:bg-footy-orange text-white rounded-lg flex items-center justify-center font-black text-lg">
                        {card.cardNumber || '?'}
                      </div>
                    )}

                    <div className="flex-grow">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {card.playerName || 'Unknown Player'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {card.set.release.year} {card.set.release.name}
                        {card.set.name && ` - ${card.set.name}`}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {card.cardNumber && <span>#{card.cardNumber}</span>}
                        {card.team && <span className="ml-2">• {card.team}</span>}
                        {card.variant && <span className="ml-2 text-purple-600 dark:text-purple-400">• {card.variant}</span>}
                        {card.parallelType && <span className="ml-2 text-footy-orange">• {card.parallelType}</span>}
                      </div>
                    </div>

                    {(card.hasAutograph || card.hasMemorabilia || card.isNumbered) && (
                      <div className="flex gap-2 flex-wrap">
                        {card.hasAutograph && (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-semibold">
                            AUTO
                          </span>
                        )}
                        {card.hasMemorabilia && (
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full font-semibold">
                            MEM
                          </span>
                        )}
                        {card.isNumbered && card.printRun && (
                          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full font-semibold">
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
        </main>

        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query="soccer autographs"
            limit={3}
            title="Soccer Autographs"
          />
        </aside>
      </div>

      <footer className="bg-footy-green dark:bg-gray-950 text-white transition-colors duration-300 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-sm">
            <span className="text-white">footy</span><span className="text-footy-orange">.bot</span> © 2024-{new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
