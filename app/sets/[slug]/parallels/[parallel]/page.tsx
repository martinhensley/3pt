"use client";

import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  // Use the slug as-is - it's already been cleaned by the release page link generation
  const setSlug = params.slug as string;
  const parallelSlug = params.parallel as string;
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
    // Convert URL-friendly parallel slug to readable name
    // e.g., "argyle" -> "Argyle", "gold-prizm" -> "Gold Prizm"
    const parallelDisplayName = parallelSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    setParallelName(parallelDisplayName);

    // Fetch all cards and filter by set slug and parallel name
    fetch(`/api/cards/all`)
      .then((res) => res.json())
      .then((data) => {
        // Filter cards based on set slug and parallel matching
        const matchingCards = data.filter((card: Card) => {
          // Generate the card's set slug to match against URL
          // Special handling: Only remove "Base" from Optic sets
          // For regular Base Set, keep "Base" in the slug
          const cleanSetName = card.set.name
            .replace(/\boptic\s+base\s+set\b/gi, 'Optic') // Optic Base Set -> Optic
            .replace(/\boptic\s+base\b/gi, 'Optic') // Optic Base -> Optic
            .replace(/\bbase\s+optic\b/gi, 'Optic') // Base Optic -> Optic
            .replace(/\bbase\s+set\b/gi, 'Base') // Base Set -> Base (keep "Base")
            .replace(/\bsets?\b/gi, '') // Remove remaining "set/sets"
            .trim();
          const cardSetSlug = `${card.set.release.year}-${card.set.release.name}-${cleanSetName}`
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

          const setMatch = cardSetSlug === setSlug;

          const cardParallel = (card.parallelType || card.variant || '').toLowerCase();
          const searchParallel = parallelSlug.replace(/-/g, ' ').toLowerCase();

          const parallelMatch = cardParallel.includes(searchParallel) ||
                                searchParallel.includes(cardParallel);

          return setMatch && parallelMatch;
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
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch cards:", error);
        setLoading(false);
      });
  }, [setSlug, parallelSlug]);

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
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-footy-green dark:text-footy-orange hover:underline flex items-center gap-1"
            >
              ← Back to {setInfo?.name || 'Set'}
            </button>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-footy-green to-green-700 dark:from-footy-orange dark:to-orange-700 rounded-2xl shadow-2xl overflow-hidden mb-8 text-white p-8">
            {setInfo && (
              <>
                <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
                  {setInfo.year} {firstCard.set.release.name} {setInfo.name
                    .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
                    .replace(/\boptic\s+base\b/gi, 'Optic')
                    .replace(/\bbase\s+optic\b/gi, 'Optic')
                    .replace(/\bbase\s+set\b/gi, '')
                    .replace(/\bsets?\b/gi, '')
                    .trim()} {parallelName.replace(/\bbase\b/gi, '').trim()}
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
              {[...cards].sort((a, b) => {
                const numA = parseInt(a.cardNumber || '0');
                const numB = parseInt(b.cardNumber || '0');
                return numA - numB;
              }).map((card) => {
                // Generate individual card slug: year-releasename-setname-card#-player-parallel
                // Special handling: Only remove "Base" from Optic sets
                // For regular Base Set, keep "Base" in the slug
                const cleanSetName = card.set.name
                  .replace(/\boptic\s+base\s+set\b/gi, 'Optic') // Optic Base Set -> Optic
                  .replace(/\boptic\s+base\b/gi, 'Optic') // Optic Base -> Optic
                  .replace(/\bbase\s+optic\b/gi, 'Optic') // Base Optic -> Optic
                  .replace(/\bbase\s+set\b/gi, 'Base') // Base Set -> Base (keep "Base")
                  .replace(/\bsets?\b/gi, '') // Remove remaining "set/sets"
                  .trim();
                const slugParts = [
                  card.set.release.year,
                  card.set.release.name,
                  cleanSetName,
                  card.cardNumber || '',
                  card.playerName || 'unknown',
                ];

                // Always add the parallel name from the URL since we're on a parallel page
                // Use parallelName which is derived from the URL slug
                if (parallelName && parallelName.toLowerCase() !== 'base') {
                  slugParts.push(parallelName);
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
