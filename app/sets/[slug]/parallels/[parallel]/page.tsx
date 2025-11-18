"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import EbayAd from "@/components/EbayAd";
import EbayAdHorizontal from "@/components/EbayAdHorizontal";
import { useEffect, useState, useMemo } from "react";
import { extractKeywordsFromPost, getAdTitle } from "@/lib/extractKeywords";
import { formatParallelName } from "@/lib/formatters";

interface Card {
  id: string;
  slug: string;
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
    // Fetch set data with parallel parameter
    fetch(`/api/sets?slug=${setSlug}&parallel=${parallelSlug}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Parallel not found');
        }
        return res.json();
      })
      .then((setData) => {
        // Set the parallel name from the API response
        setParallelName(setData.currentParallel || '');

        // Set the cards
        setCards(setData.cards || []);

        // Extract set info
        setSetInfo({
          name: setData.name,
          year: setData.release.year || '',
          manufacturer: setData.release.manufacturer.name,
          releaseSlug: setData.release.slug,
        });

        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch parallel cards:", error);
        setLoading(false);
      });
  }, [setSlug, parallelSlug]);

  const firstCard = cards.length > 0 ? cards[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query={adKeywords.primaryQuery}
            limit={3}
            title={getAdTitle(adKeywords.primaryQuery, "Soccer Cards")}
          />
        </aside>

        <main className="flex-grow max-w-5xl mx-auto space-y-6">
          <Header rounded={true} />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            </div>
          ) : cards.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">No Cards Found</h1>
                <p className="text-gray-600 mb-8">
                  No cards found for this parallel/variation.
                </p>
                <Link href="/" className="text-footy-green hover:underline">
                  ← Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <>

          {setInfo && firstCard && (
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                {
                  label: `${setInfo.year || ""} ${setInfo.manufacturer} ${firstCard.set.release.name}`.trim(),
                  href: `/releases/${setInfo.releaseSlug}`,
                },
                {
                  label: setInfo.name
                    .replace(/\boptic\s+base\s+set\b/gi, "Optic")
                    .replace(/\boptic\s+base\b/gi, "Optic")
                    .replace(/\bbase\s+optic\b/gi, "Optic")
                    .replace(/\bbase\s+set\b/gi, "Base")
                    .replace(/\bsets?\b/gi, "")
                    .trim(),
                  href: `/sets/${setSlug}`,
                },
                {
                  label: formatParallelName(parallelName.replace(/\s*–\s*/g, ' ')),
                  href: `/sets/${setSlug}/parallels/${parallelSlug}`,
                },
              ]}
            />
          )}

          {/* Header */}
          <div className="bg-gradient-to-r from-footy-green to-green-700 rounded-2xl shadow-2xl overflow-hidden mb-8 text-white p-8">
            {setInfo && firstCard && (
              <>
                <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
                  {setInfo.year} {firstCard.set.release.name} {setInfo.name
                    .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
                    .replace(/\boptic\s+base\b/gi, 'Optic')
                    .replace(/\bbase\s+optic\b/gi, 'Optic')
                    .replace(/\bbase\s+set\b/gi, '')
                    .replace(/\bsets?\b/gi, '')
                    .trim()} {formatParallelName(parallelName.replace(/\bbase\b/gi, '').replace(/\s*–\s*/g, ' ').trim())}
                </h1>
                <div className="text-xl">
                  {cards.length} Card{cards.length !== 1 ? 's' : ''} in the Parallel Set
                </div>
              </>
            )}
          </div>

          {/* Cards Grid */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Cards</h2>
            <div className="grid gap-4">
              {[...cards].sort((a, b) => {
                const numA = parseInt(a.cardNumber || '0');
                const numB = parseInt(b.cardNumber || '0');
                return numA - numB;
              }).map((card) => {
                // Generate individual card slug: year-releasename-setname-card#-player-parallel
                // Special handling: Only remove "Base" from Optic sets
                // For regular Base Set, keep "Base" in the slug
                // Use the card's actual slug from the database
                // This was generated correctly during import using generateCardSlug()
                const cardSlug = card.slug;

                return (
                  <Link
                    key={card.id}
                    href={`/cards/${cardSlug}`}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-footy-orange hover:shadow-lg transition-all cursor-pointer"
                  >
                    {/* Card Image Preview */}
                    {card.imageFront && (
                      <div className="flex-shrink-0 w-24 h-32 bg-gray-200 rounded-lg overflow-hidden relative">
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
                      <div className="flex-shrink-0 w-16 h-16 bg-footy-green text-white rounded-lg flex items-center justify-center font-black text-lg">
                        {card.cardNumber}
                      </div>
                    )}

                    <div className="flex-grow">
                      <div className="font-bold text-lg text-gray-900">
                        {card.playerName || 'Unknown Player'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {card.cardNumber && <span>#{card.cardNumber}</span>}
                        {card.team && <span className="ml-2">• {card.team}</span>}
                        {card.variant && <span className="ml-2 text-purple-600">• {formatParallelName(card.variant)}</span>}
                        {card.parallelType && <span className="ml-2 text-footy-orange">• {formatParallelName(card.parallelType.replace(/\s*–\s*/g, ' '))}</span>}
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
                );
              })}
            </div>
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
