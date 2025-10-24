"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import EbayAd from "@/components/EbayAd";
import EbayAdHorizontal from "@/components/EbayAdHorizontal";
import { useEffect, useState, useMemo } from "react";
import { extractKeywordsFromPost, getAdTitle } from "@/lib/extractKeywords";

interface CardImage {
  id: string;
  url: string;
  caption: string | null;
  order: number;
}

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
  images: CardImage[];
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

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract keywords from card for dynamic ad queries - MUST be before conditional returns
  const adKeywords = useMemo(() => {
    if (!card) {
      return {
        primaryQuery: 'soccer cards',
        autographQuery: 'soccer autographs',
        relatedQuery: 'soccer cards',
      };
    }

    // Create a post-like object for keyword extraction
    const postLike = {
      title: `${card.playerName || 'Unknown'} ${card.set.release.year || ''} ${card.set.release.name} ${card.set.name} #${card.cardNumber || ''}`,
      content: `${card.set.release.manufacturer.name} ${card.set.release.name} ${card.set.name} ${card.playerName || ''} ${card.team || ''} card number ${card.cardNumber || ''}`,
      excerpt: `${card.playerName || ''} ${card.team || ''} ${card.set.release.year || ''} ${card.set.release.name}`,
      type: 'NEWS',
    };
    return extractKeywordsFromPost(postLike as { title: string; content: string; excerpt: string; type: string });
  }, [card]);

  useEffect(() => {
    // Fetch card data by slug
    fetch(`/api/cards?slug=${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Card not found');
        }
        return res.json();
      })
      .then((cardData: Card) => {
        setCard(cardData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch card:", error);
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

  if (!card) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Card Not Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">The card you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/" className="text-footy-green dark:text-footy-orange hover:underline">
              ← Back to Home
            </Link>
          </div>
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
              ← Back
            </button>
          </div>

          {/* Card Header */}
          <div className="bg-gradient-to-r from-footy-green to-green-700 dark:from-footy-orange dark:to-orange-700 rounded-2xl shadow-2xl overflow-hidden mb-8 text-white p-8">
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              {card.cardNumber && <span className="text-white/90">#{card.cardNumber} </span>}
              {card.playerName || 'Unknown Player'}
            </h1>

            <div className="text-xl mb-2">
              {card.set.release.year && <span className="text-white/90">{card.set.release.year} </span>}
              {card.set.release.manufacturer.name} {card.set.release.name}
              {card.set.name && card.set.name.toLowerCase() !== 'base set' && ` - ${card.set.name}`}
            </div>

            {card.team && (
              <div className="text-lg mb-6">
                {card.team}
              </div>
            )}

            {/* Card Features */}
            {(card.hasAutograph || card.hasMemorabilia || card.isNumbered || card.variant || card.parallelType || card.rarity || card.finish || card.colorVariant || (card.specialFeatures && card.specialFeatures.length > 0)) && (
              <div className="pt-6 border-t border-white/20">
                <div className="flex gap-2 flex-wrap">
                  {card.hasAutograph && (
                    <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-semibold">
                      Autograph
                    </span>
                  )}
                  {card.hasMemorabilia && (
                    <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full font-semibold">
                      Memorabilia
                    </span>
                  )}
                  {card.isNumbered && card.printRun && (
                    <span className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full font-semibold">
                      /{card.printRun}
                    </span>
                  )}
                  {card.variant && card.variant !== '—' && (
                    <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full font-semibold">
                      {card.variant}
                    </span>
                  )}
                  {card.parallelType && (
                    <span className="px-4 py-2 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full font-semibold">
                      {card.parallelType}
                    </span>
                  )}
                  {card.rarity && (
                    <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full font-semibold capitalize">
                      {card.rarity.replace(/_/g, ' ')}
                    </span>
                  )}
                  {card.finish && (
                    <span className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full font-semibold capitalize">
                      {card.finish}
                    </span>
                  )}
                  {card.colorVariant && (
                    <span className="px-4 py-2 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded-full font-semibold capitalize">
                      {card.colorVariant}
                    </span>
                  )}
                  {card.specialFeatures && card.specialFeatures.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-full font-semibold capitalize"
                    >
                      {feature.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {card.serialNumber && (
                    <span className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full font-semibold">
                      Serial: {card.serialNumber}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card Images */}
          {(card.imageFront || card.imageBack || card.images.length > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Card Images</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {card.imageFront && (
                  <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-[2.5/3.5] border-2 border-footy-green dark:border-footy-orange">
                    <Image
                      src={card.imageFront}
                      alt={`${card.playerName} front`}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 font-semibold">
                      Front
                    </div>
                  </div>
                )}
                {card.imageBack && (
                  <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-[2.5/3.5] border-2 border-footy-green dark:border-footy-orange">
                    <Image
                      src={card.imageBack}
                      alt={`${card.playerName} back`}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 font-semibold">
                      Back
                    </div>
                  </div>
                )}
                {card.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-[2.5/3.5] border-2 border-footy-green dark:border-footy-orange"
                  >
                    <Image
                      src={image.url}
                      alt={image.caption || `${card.playerName} card`}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 px-2 text-sm">
                        {image.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}


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
