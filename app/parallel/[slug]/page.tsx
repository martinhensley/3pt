"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import EbayAd from "@/components/EbayAd";
import EbayAdHorizontal from "@/components/EbayAdHorizontal";
import { useEffect, useState, useMemo } from "react";
import { extractKeywordsFromPost, getAdTitle } from "@/lib/extractKeywords";

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
  rarity: string | null;
  finish: string | null;
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  specialFeatures: string[];
  colorVariant: string | null;
  imageFront: string | null;
  imageBack: string | null;
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

export default function ParallelPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [parallelName, setParallelName] = useState("");
  const [setInfo, setSetInfo] = useState<{
    name: string;
    year: string;
    manufacturer: string;
    releaseSlug: string;
  } | null>(null);

  // Extract keywords for ads
  const adKeywords = useMemo(() => {
    if (cards.length === 0) {
      return {
        primaryQuery: 'soccer cards',
        autographQuery: 'soccer autographs',
        relatedQuery: 'soccer cards',
      };
    }

    const firstCard = cards[0];
    const postLike = {
      title: `${parallelName} ${firstCard.set.release.year || ''} ${firstCard.set.release.name} ${firstCard.set.name}`,
      content: `${firstCard.set.release.manufacturer.name} ${firstCard.set.release.name} ${firstCard.set.name} ${parallelName} parallel cards`,
      excerpt: `${parallelName} ${firstCard.set.release.year || ''} ${firstCard.set.release.name}`,
      type: 'NEWS',
    };
    return extractKeywordsFromPost(postLike as { title: string; content: string; excerpt: string; type: string });
  }, [cards, parallelName]);

  useEffect(() => {
    // Parse slug to extract parallel/variation info
    // Format: year-releasename-setname-parallel
    // Example: "2024-25-donruss-soccer-base-set-cubic"
    const parts = slug.split('-');

    // Try to extract components from slug
    let year = '';
    let parallelName = '';

    // Find year pattern (e.g., "2024" or "2024-25")
    if (parts.length > 0 && /^\d{4}$/.test(parts[0])) {
      if (parts.length > 1 && /^\d{2}$/.test(parts[1])) {
        year = `${parts[0]}-${parts[1]}`;
        parts.splice(0, 2); // Remove year parts
      } else {
        year = parts[0];
        parts.splice(0, 1); // Remove year part
      }
    }

    // The last 1-3 parts are likely the parallel name
    // Common patterns: "gold", "prizm", "gold-prizm", "purple-pulsar-prizm"
    const parallelPartCount = Math.min(3, Math.max(1, parts.length - 3));
    const parallelParts = parts.splice(-parallelPartCount);
    parallelName = parallelParts.join(' ');

    // Remaining parts are release name and set name
    // We'll use the full remaining as search context
    const releaseSetParts = parts.join(' ');

    setParallelName(parallelName);

    // Fetch all cards and filter client-side
    fetch(`/api/cards/all`)
      .then((res) => res.json())
      .then((data) => {
        // Filter cards based on parallel/variation matching
        const matchingCards = data.filter((card: Card) => {
          const cardParallel = (card.parallelType || card.variant || '').toLowerCase();
          const searchParallel = parallelName.toLowerCase();

          // Check if parallel name matches
          const parallelMatch = cardParallel.includes(searchParallel) ||
                                searchParallel.includes(cardParallel);

          // If we have year info, also filter by year
          const yearMatch = !year ||
                           card.set.release.year?.includes(year) ||
                           false;

          // Check release/set name if we have parts
          const releaseMatch = !releaseSetParts ||
                              card.set.release.name.toLowerCase().includes(releaseSetParts.toLowerCase()) ||
                              card.set.name.toLowerCase().includes(releaseSetParts.toLowerCase()) ||
                              false;

          return parallelMatch && (yearMatch || releaseMatch);
        });

        setCards(matchingCards);

        // Extract set info from first card
        if (matchingCards.length > 0) {
          const first = matchingCards[0];
          setSetInfo({
            name: first.set.name,
            year: first.set.release.year || '',
            manufacturer: first.set.release.manufacturer.name,
            releaseSlug: first.set.release.slug,
          });

          // Use the actual parallel name from the card data
          setParallelName(first.parallelType || first.variant || parallelName);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch cards:", error);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Cards Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              No cards found for this parallel/variation.
            </p>
            <Link href="/" className="text-footy-green dark:text-footy-orange hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const firstCard = cards[0];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header />

      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 py-8">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query={adKeywords.primaryQuery}
            limit={3}
            title={getAdTitle(adKeywords.primaryQuery, "Soccer Cards")}
          />
        </aside>

        <main className="flex-grow max-w-5xl">
          {/* Breadcrumb */}
          {setInfo && (
            <div className="mb-6">
              <Link
                href={`/sets/${setInfo.year}-${firstCard.set.release.name}-${setInfo.name}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
                className="text-footy-green dark:text-footy-orange hover:underline"
              >
                ← Back to {setInfo.name}
              </Link>
            </div>
          )}

          {/* Header */}
          <div className="bg-gradient-to-r from-footy-green to-green-700 dark:from-footy-orange dark:to-orange-700 rounded-2xl shadow-2xl overflow-hidden mb-8 text-white p-8">
            {setInfo && (
              <>
                <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
                  {setInfo.year} {firstCard.set.release.name} {setInfo.name.replace(/\bsets?\b/gi, '').trim()} {parallelName.replace(/\bbase\b/gi, '').trim()}
                </h1>
                <div className="text-xl">
                  {cards.length} Card{cards.length !== 1 ? 's' : ''} in the Parallel Set
                </div>
              </>
            )}
          </div>

          {/* Cards Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Cards</h2>
            <div className="grid gap-4">
              {cards.map((card) => {
                // Generate individual card slug: year-releasename-setname-card#-player-parallel
                // Remove "set/sets" from set name to avoid redundancy
                const cleanSetName = card.set.name.replace(/\bsets?\b/gi, '').trim();
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

                const cardSlug = slugParts
                  .filter(Boolean)
                  .join('-')
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '')
                  .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                  .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

                return (
                  <Link
                    key={card.id}
                    href={`/card/${cardSlug}`}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-footy-orange hover:shadow-lg transition-all cursor-pointer"
                  >
                    {/* Card Image Preview */}
                    {card.imageFront && (
                      <div className="flex-shrink-0 w-24 h-32 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden relative">
                        <Image
                          src={card.imageFront}
                          alt={`${card.playerName} card`}
                          fill
                          className="object-contain"
                          sizes="96px"
                        />
                      </div>
                    )}

                    {/* Card Number Badge */}
                    {!card.imageFront && card.cardNumber && (
                      <div className="flex-shrink-0 w-16 h-16 bg-footy-green dark:bg-footy-orange text-white rounded-lg flex items-center justify-center font-black text-lg">
                        {card.cardNumber}
                      </div>
                    )}

                    <div className="flex-grow">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {card.playerName || 'Unknown Player'}
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
                );
              })}
            </div>
          </div>

          <EbayAdHorizontal
            query={adKeywords.relatedQuery}
            limit={4}
            title={getAdTitle(adKeywords.relatedQuery, "Related Soccer Cards")}
          />
        </main>

        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query={adKeywords.autographQuery}
            limit={3}
            title={getAdTitle(adKeywords.autographQuery, "Soccer Autographs")}
          />
        </aside>
      </div>

      <footer className="bg-gradient-to-r from-footy-green to-green-700 dark:from-footy-orange dark:to-orange-700 text-white transition-colors duration-300 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-sm">
            <span className="text-white">footy</span><span className="text-white">.bot</span> © 2024-{new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
