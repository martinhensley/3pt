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
  numbered: string | null;
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

        <main className="flex-grow max-w-5xl space-y-6">
          <Header rounded={true} />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            </div>
          ) : !card ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Card Not Found</h1>
                <p className="text-gray-600 mb-8">The card you&apos;re looking for doesn&apos;t exist.</p>
                <Link href="/" className="text-footy-green hover:underline">
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
                label: `${card.set.release.year || ""} ${card.set.release.name}`.trim(),
                href: `/releases/${card.set.release.slug}`,
              },
              {
                label: card.set.name
                  .replace(/\boptic\s+base\s+set\b/gi, "Optic")
                  .replace(/\boptic\s+base\b/gi, "Optic")
                  .replace(/\bbase\s+optic\b/gi, "Optic")
                  .replace(/\bbase\s+set\b/gi, "Base")
                  .replace(/\bsets?\b/gi, "")
                  .trim(),
                href: `/sets/${[
                  card.set.release.year || "",
                  card.set.release.name,
                  card.set.name
                    .replace(/\boptic\s+base\s+set\b/gi, "Optic")
                    .replace(/\boptic\s+base\b/gi, "Optic")
                    .replace(/\bbase\s+optic\b/gi, "Optic")
                    .replace(/\bbase\s+set\b/gi, "Base")
                    .replace(/\bsets?\b/gi, "")
                    .trim()
                ]
                  .filter(Boolean)
                  .join("-")
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "")
                  .replace(/-+/g, "-")
                  .replace(/^-|-$/g, "")}`,
              },
              ...(card.parallelType && card.parallelType.toLowerCase() !== 'base' ? [{
                label: card.parallelType.replace(/\s*–\s*/g, ' '),
                href: `/sets/${[
                  card.set.release.year || "",
                  card.set.release.name,
                  card.set.name
                    .replace(/\boptic\s+base\s+set\b/gi, "Optic")
                    .replace(/\boptic\s+base\b/gi, "Optic")
                    .replace(/\bbase\s+optic\b/gi, "Optic")
                    .replace(/\bbase\s+set\b/gi, "Base")
                    .replace(/\bsets?\b/gi, "")
                    .trim()
                ]
                  .filter(Boolean)
                  .join("-")
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "")
                  .replace(/-+/g, "-")
                  .replace(/^-|-$/g, "")}/parallels/${card.parallelType
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "")
                  .replace(/-+/g, "-")
                  .replace(/^-|-$/g, "")}`,
              }] : []),
              {
                label: `${card.parallelType && card.parallelType.toLowerCase() !== 'base' ? `${card.parallelType.replace(/\s*–\s*/g, ' ')} ` : ""}${card.playerName || "Unknown Player"} ${card.cardNumber ? `#${card.cardNumber}` : ""}`.trim(),
                href: `/cards/${slug}`,
              },
            ]}
          />

          {/* Card Header */}
          <div className="bg-gradient-to-r from-footy-green to-green-700 rounded-2xl shadow-2xl overflow-hidden mb-8 text-white p-8">
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
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
                      Autograph
                    </span>
                  )}
                  {card.hasMemorabilia && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
                      Memorabilia
                    </span>
                  )}
                  {card.isNumbered && card.printRun && (
                    <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-semibold">
                      /{card.printRun}
                    </span>
                  )}
                  {card.variant && card.variant !== '—' && (
                    <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-semibold">
                      {formatParallelName(card.variant)}
                    </span>
                  )}
                  {card.parallelType && (
                    <span className="px-4 py-2 bg-pink-100 text-pink-800 rounded-full font-semibold">
                      {formatParallelName(card.parallelType.replace(/\s*–\s*/g, ' '))}
                    </span>
                  )}
                  {card.rarity && (
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold capitalize">
                      {card.rarity.replace(/_/g, ' ')}
                    </span>
                  )}
                  {card.finish && (
                    <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-semibold capitalize">
                      {card.finish}
                    </span>
                  )}
                  {card.colorVariant && (
                    <span className="px-4 py-2 bg-cyan-100 text-cyan-800 rounded-full font-semibold capitalize">
                      {card.colorVariant}
                    </span>
                  )}
                  {card.specialFeatures && card.specialFeatures.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-teal-100 text-teal-800 rounded-full font-semibold capitalize"
                    >
                      {feature.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Details */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Card Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <span className="text-gray-600">Player: </span>
                <span className="font-bold text-gray-900">{card.playerName || '—'}</span>
              </div>
              <div>
                <span className="text-gray-600">Team: </span>
                <span className="font-bold text-gray-900">{card.team || '—'}</span>
              </div>
              <div>
                <span className="text-gray-600">Card Number: </span>
                <span className="font-bold text-gray-900">{card.cardNumber || '—'}</span>
              </div>
              {card.variant && (
                <div>
                  <span className="text-gray-600">Variant: </span>
                  <span className="font-bold text-gray-900">{formatParallelName(card.variant)}</span>
                </div>
              )}
              {card.parallelType && (
                <div>
                  <span className="text-gray-600">Parallel: </span>
                  <span className="font-bold text-gray-900">{formatParallelName(card.parallelType.replace(/\s*–\s*/g, ' '))}</span>
                </div>
              )}
              {card.numbered && (
                <div>
                  <span className="text-gray-600">Serial Numbered: </span>
                  <span className="font-bold text-gray-900">{card.numbered}</span>
                </div>
              )}
              {card.rarity && (
                <div>
                  <span className="text-gray-600">Rarity: </span>
                  <span className="font-bold text-gray-900 capitalize">{card.rarity.replace(/_/g, ' ')}</span>
                </div>
              )}
              {card.finish && (
                <div>
                  <span className="text-gray-600">Finish: </span>
                  <span className="font-bold text-gray-900 capitalize">{card.finish}</span>
                </div>
              )}
              {card.colorVariant && (
                <div>
                  <span className="text-gray-600">Color: </span>
                  <span className="font-bold text-gray-900 capitalize">{card.colorVariant}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Images */}
          {(card.imageFront || card.imageBack || card.images.length > 0) && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Card Images</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {card.imageFront && (
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-[2.5/3.5] border-2 border-footy-green">
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
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-[2.5/3.5] border-2 border-footy-green">
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
                    className="relative bg-gray-100 rounded-lg overflow-hidden aspect-[2.5/3.5] border-2 border-footy-green"
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
