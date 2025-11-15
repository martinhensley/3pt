"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import EbayAd from "@/components/EbayAd";
import EbayAdHorizontal from "@/components/EbayAdHorizontal";
import { useEffect, useState, useMemo } from "react";
import { extractKeywordsFromPost, getAdTitle } from "@/lib/extractKeywords";
import { formatParallelName } from "@/lib/formatters";
import { isParallelSet, getBaseSetSlug, getParallelVariant, getParallelPrintRun } from "@/lib/setUtils";

interface Card {
  id: string;
  slug: string | null;
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
  imageBack: string | null;
}

interface Set {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  totalCards: string | null;
  printRun: number | null;
  isParallel: boolean;
  baseSetSlug: string | null;
  cards: Card[];
  release: {
    id: string;
    name: string;
    year: string | null;
    slug: string;
    manufacturer: {
      name: string;
    };
  };
}

export default function SetPage() {
  const params = useParams();
  // Use the slug as-is - it's already been cleaned by the release page link generation
  const slug = params.slug as string;
  const [set, setSet] = useState<Set | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch set data by slug
    fetch(`/api/sets?slug=${slug}`)
      .then((res) => {
        if (!res.ok) {
          setSet(null);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((setData: Set | null) => {
        if (setData) {
          setSet(setData);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch set:", error);
        setSet(null);
        setLoading(false);
      });
  }, [slug]);

  // Clean display name: remove "Base" from Optic sets, keep it for others
  // Also remove duplicate "Obsidian" if the release name already contains it
  const displayName = set?.name
    ? set.name
        .replace(/\boptic\s+base\s+set\b/gi, 'Optic') // Optic Base Set -> Optic
        .replace(/\boptic\s+base\b/gi, 'Optic') // Optic Base -> Optic
        .replace(/\bbase\s+optic\b/gi, 'Optic') // Base Optic -> Optic
        .replace(/\bsets?\b/gi, '') // Remove "set/sets"
        // Remove duplicate "Obsidian" if release name contains it
        .replace(new RegExp(`\\b${set.release.name.split(' ')[0]}\\b`, 'gi'), '')
        .trim()
    : '';

  // For parallel sets, check if print run is already in the name before appending
  // Also check for "1 of 1" pattern for 1/1 cards
  const isParallel = set ? isParallelSet(set.slug) : false;
  const displayNameWithPrintRun = set && isParallel && set.printRun
    ? (displayName.match(/\/\d+$/) || displayName.match(/\b1\s+of\s+1\b/i) ? displayName : `${displayName} /${set.printRun}`)
    : displayName;

  // Extract keywords from set for dynamic ad queries - MUST be before conditional returns
  const adKeywords = useMemo(() => {
    if (!set) {
      return {
        primaryQuery: 'soccer cards',
        autographQuery: 'soccer autographs',
        relatedQuery: 'soccer cards',
      };
    }

    // Create a post-like object for keyword extraction
    const postLike = {
      title: `${set.release.year} ${set.release.name} ${displayName}`,
      content: `${set.release.manufacturer.name} ${set.release.name} ${displayName} ${set.release.year || ''} trading cards checklist`,
      excerpt: `${set.release.manufacturer.name} ${set.release.name} ${displayName} ${set.release.year || ''} soccer card set`,
      type: 'NEWS',
    };
    return extractKeywordsFromPost(postLike as { title: string; content: string; excerpt: string; type: string });
  }, [set, displayName]);

  // For base sets with mixed base + parallel cards, only show base cards
  // For parallel sets, show all cards (they all belong to that parallel)
  const displayCards = isParallel
    ? (set?.cards || []) // Parallel set: show all cards
    : (set?.cards?.filter(card => // Base set: show only base cards
        card.parallelType === 'Base' || card.parallelType === null
      ) || []);

  // Get unique parallel types (excluding Base)
  const uniqueParallels = set?.cards
    ? Array.from(new Set(
        set.cards
          .map(card => card.parallelType)
          .filter(type => type && type !== 'Base')
      ))
    : [];

  const setCardCount = displayCards.length || (set?.totalCards ? parseInt(set.totalCards) : 0);
  const setParallelCount = uniqueParallels.length;

  // Sort cards numerically by cardNumber
  const sortedCards = displayCards.length > 0 ? [...displayCards].sort((a, b) => {
    const numA = parseInt(a.cardNumber || '0');
    const numB = parseInt(b.cardNumber || '0');
    return numA - numB;
  }) : [];

  // Since sets are now independent, we don't need to build a parallel list
  // Each parallel is its own set accessible from the release page

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query={adKeywords.primaryQuery}
            limit={3}
            title={getAdTitle(adKeywords.primaryQuery, "Soccer Cards")}
          />
        </aside>

        <main className="flex-grow max-w-5xl space-y-6">
          <Header rounded={true} />

          {loading ? (
            <div className="flex-grow flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            </div>
          ) : !set ? (
            <div className="flex-grow flex items-center justify-center py-20">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-footy-green mb-4">Set Not Found</h1>
                <p className="text-gray-600 mb-8">The set you&apos;re looking for doesn&apos;t exist.</p>
                <Link href="/" className="text-footy-orange hover:underline font-semibold">
                  ← Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <>

          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              {
                label: `${set.release.year || ""} ${set.release.name}`.trim(),
                href: `/releases/${set.release.slug}`,
              },
              // If this is a parallel set, we could include the base set in breadcrumb
              // But since parallels are now independent, we just go straight from release to set
              {
                label: displayNameWithPrintRun,
                href: `/sets/${slug}`,
              },
            ]}
          />

        {/* Set Header */}
        <div className="bg-gradient-to-r from-footy-green to-green-700 rounded-2xl shadow-2xl overflow-hidden mb-8 text-white p-8">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-sm">
              SET
            </span>
            <span className="text-white/80">•</span>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">
              {set.release.year && <span className="text-white/90">{set.release.year} </span>}
              {set.release.name} {displayNameWithPrintRun}
            </h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-sm text-white/80 uppercase tracking-wide mb-1">Total Cards</div>
              <div className="text-3xl font-bold text-white">{setCardCount > 0 ? setCardCount.toLocaleString() : '—'}</div>
            </div>
            {/* Only show parallels count for base sets (not for parallel sets) */}
            {!isParallel && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-sm text-white/80 uppercase tracking-wide mb-1">Parallels</div>
                <div className="text-3xl font-bold text-white">{setParallelCount > 0 ? setParallelCount : '—'}</div>
              </div>
            )}
          </div>

          {/* Set Description */}
          {set.description && (
            <div className="pt-6 border-t border-white/20">
              <p className="text-lg text-white/90 leading-relaxed">
                {set.description}
              </p>
            </div>
          )}
        </div>

        {/* Parallels are now independent sets accessible from the release page */}

        {/* Card Checklist */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 transition-colors duration-300">
          <h3 className="text-2xl font-bold text-footy-green mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-footy-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Set Checklist ({setCardCount > 0 ? setCardCount.toLocaleString() : '—'} cards)
          </h3>

          {sortedCards && sortedCards.length > 0 ? (
            <div className="grid gap-3">
              {sortedCards.map((card) => {
                // Use the card's slug from the database
                // This was generated correctly during import using generateCardSlug()
                const cardSlug = card.slug;

                return (
                  <Link
                    key={card.id}
                    href={`/cards/${cardSlug}`}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-footy-orange hover:shadow-lg transition-all"
                  >
                  {card.cardNumber && (
                    <div className="flex-shrink-0 w-16 h-16 bg-footy-green text-white rounded-lg flex items-center justify-center font-bold text-lg">
                      {card.cardNumber}
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="font-bold text-lg text-footy-green">
                      {card.playerName || 'Unknown Player'}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {card.team && (
                        <span className="text-sm text-gray-600">{card.team}</span>
                      )}
                      {/* Show card-specific print run badge */}
                      {card.printRun && (
                        <span className="px-2 py-0.5 bg-orange-100 text-footy-orange text-xs rounded-full font-semibold">
                          # /{card.printRun}
                        </span>
                      )}
                      {card.variant && (
                        <span className="text-sm text-footy-orange">• {formatParallelName(card.variant)}</span>
                      )}
                    </div>
                  </div>
                  {(card.hasAutograph || card.hasMemorabilia) && (
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
                    </div>
                  )}
                </Link>
              );
            })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg italic">
                Detailed checklist not yet available for this set
              </p>
              {set.totalCards && (
                <p className="text-gray-600 mt-2">
                  This set contains {set.totalCards} cards
                </p>
              )}
            </div>
          )}
        </div>

        <EbayAdHorizontal
          query={adKeywords.relatedQuery}
          limit={4}
          title={getAdTitle(adKeywords.relatedQuery, "Related Soccer Cards")}
        />

          <Footer rounded={true} />
            </>
          )}
        </main>

        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query={adKeywords.autographQuery}
            limit={3}
            title={getAdTitle(adKeywords.autographQuery, "Soccer Autographs")}
          />
        </aside>
      </div>
    </div>
  );
}
