"use client";

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import EbayAd from "@/components/EbayAd";
import EbayAdHorizontal from "@/components/EbayAdHorizontal";
import { useEffect, useState, useMemo } from "react";
import { extractKeywordsFromPost, getAdTitle } from "@/lib/extractKeywords";

interface Image {
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
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  imageFront: string | null;
  imageBack: string | null;
}

interface Set {
  id: string;
  name: string;
  description: string | null;
  totalCards: string | null;
  parallels: string[] | null;
  cards: Card[];
}

interface Release {
  id: string;
  name: string;
  year: string | null;
  slug: string;
  description: string | null;
  createdAt: string;
  manufacturer: {
    name: string;
  };
  images: Image[];
  sets: Set[];
}

interface CarouselImage {
  url: string;
  caption: string;
  type: 'release' | 'card';
}

export default function ReleasePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Fetch release data directly from Release model
    fetch(`/api/releases?slug=${slug}`)
      .then((res) => {
        if (!res.ok) {
          notFound();
        }
        return res.json();
      })
      .then((releaseData: Release) => {
        setRelease(releaseData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch data:", error);
        setLoading(false);
        notFound();
      });
  }, [slug]);

  // Extract keywords from release for dynamic ad queries
  const adKeywords = useMemo(() => {
    if (!release) {
      return {
        primaryQuery: 'soccer cards',
        autographQuery: 'soccer autographs',
        relatedQuery: 'soccer cards',
        playerName: null,
        teamName: null,
      };
    }
    // Create a post-like object for keyword extraction using release data
    const postLike = {
      title: `${release.year} ${release.name}`,
      content: `${release.manufacturer.name} ${release.name} ${release.year || ''} trading cards`,
      excerpt: `${release.manufacturer.name} ${release.name} ${release.year || ''} soccer card release`,
      type: 'NEWS',
    };
    return extractKeywordsFromPost(postLike as { title: string; content: string; excerpt: string; type: string });
  }, [release]);

  // Generate carousel images with AI-style captions
  const carouselImages = useMemo<CarouselImage[]>(() => {
    if (!release) return [];

    const images: CarouselImage[] = [];

    // Add release images first
    release.images.forEach(img => {
      const defaultCaption = release?.manufacturer?.name && release?.name
        ? `${release.manufacturer.name} ${release.name} ${release.year || ''} - Official release image showcasing the product design and packaging.`
        : 'Official release image showcasing the product design and packaging.';

      images.push({
        url: img.url,
        caption: img.caption || defaultCaption,
        type: 'release'
      });
    });

    // Add card images from all sets
    release.sets?.forEach(set => {
      set.cards?.forEach(card => {
        if (card.imageFront) {
          // Generate detailed caption for the card
          let caption = '';

          if (card.playerName) {
            caption += card.playerName;
            if (card.team) caption += ` (${card.team})`;
          } else {
            caption += 'Card';
          }

          caption += ` from the ${set.name} set`;

          if (card.cardNumber) {
            caption += ` #${card.cardNumber}`;
          }

          const details: string[] = [];

          if (card.variant) {
            details.push(card.variant);
          }

          if (card.parallelType) {
            details.push(card.parallelType);
          }

          if (card.isNumbered && card.serialNumber) {
            details.push(`Serial: ${card.serialNumber}`);
          } else if (card.isNumbered && card.printRun) {
            details.push(`Limited to ${card.printRun} copies`);
          }

          if (card.hasAutograph) {
            details.push('Autographed');
          }

          if (card.hasMemorabilia) {
            details.push('Game-Used Memorabilia');
          }

          if (details.length > 0) {
            caption += `. Features: ${details.join(', ')}.`;
          }

          images.push({
            url: card.imageFront,
            caption: caption,
            type: 'card'
          });
        }
      });
    });

    return images;
  }, [release]);

  // Auto-rotate carousel
  useEffect(() => {
    if (carouselImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header showBackButton />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!release) {
    notFound();
  }

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${release.year} ${release.manufacturer.name} ${release.name}`,
    description: `${release.manufacturer.name} ${release.name} ${release.year || ''} trading card release`,
    image: release.images.map(img => `https://www.footy.bot${img.url}`),
    datePublished: release.createdAt,
    dateModified: release.createdAt,
    author: {
      "@type": "Organization",
      name: "Footy Bot",
      url: "https://www.footy.bot"
    },
    publisher: {
      "@type": "Organization",
      name: "Footy Bot",
      logo: {
        "@type": "ImageObject",
        url: "https://www.footy.bot/logo.png"
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.footy.bot/releases/${release.slug}`
    },
    articleSection: "New Releases",
    keywords: "soccer cards, football cards, trading cards, collectibles"
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header showBackButton />

      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 py-8">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query={adKeywords.primaryQuery}
            limit={3}
            title={getAdTitle(adKeywords.primaryQuery, "Soccer Cards")}
          />
        </aside>

        <main className="flex-grow max-w-5xl">
          {/* Combined Hero with Carousel */}
          <div className="bg-gradient-to-r from-footy-green to-green-700 rounded-2xl shadow-2xl overflow-hidden mb-8 text-white">
            {/* Hero Header */}
            <div className="p-8 pb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-sm">
                  RELEASE
                </span>
                <span className="text-white/80">•</span>
                <h1 className="text-3xl md:text-4xl font-black leading-tight">
                  {release.year && <span className="text-white/90">{release.year} </span>}
                  {release.manufacturer?.name} {release.name}
                </h1>
              </div>
            </div>

            {/* Image Carousel */}
            {carouselImages.length > 0 && (
              <div className="relative bg-white">
                <div className="relative aspect-[16/9] bg-white">
                  <Image
                    src={carouselImages[currentImageIndex].url}
                    alt={carouselImages[currentImageIndex].caption}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 100vw, 80vw"
                    priority
                  />

                  {/* Navigation Arrows */}
                  {carouselImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
                        aria-label="Previous image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
                        aria-label="Next image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {carouselImages.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {currentImageIndex + 1} / {carouselImages.length}
                    </div>
                  )}

                  {/* Dot Indicators */}
                  {carouselImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {carouselImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`transition-all duration-200 ${
                            idx === currentImageIndex
                              ? 'w-8 h-2 bg-white'
                              : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                          } rounded-full`}
                          aria-label={`Go to image ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {release.description && (
              <div className="p-8 pt-6">
                <p className="text-lg text-white/90 leading-relaxed">
                  {release.description}
                </p>
              </div>
            )}

            {/* All Sets List */}
            <div className="p-8 pt-6 border-t border-white/20">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10">
                {/* Header Row */}
                <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-white/10 border-b border-white/20">
                  <div className="font-bold text-sm uppercase tracking-wide text-white/90">Set Name</div>
                  <div className="font-bold text-sm uppercase tracking-wide text-white/90 text-center">Parallels</div>
                  <div className="font-bold text-sm uppercase tracking-wide text-white/90 text-center">Cards</div>
                </div>

                {/* List ALL sets, sorted alphabetically */}
                {(() => {
                  // Sort all sets alphabetically by name
                  const sortedSets = [...(release.sets || [])].sort((a, b) =>
                    a.name.localeCompare(b.name)
                  );

                  return sortedSets.map((set, idx) => {
                    const setCardCount = set.cards?.length || (set.totalCards ? parseInt(set.totalCards) : 0);
                    const setParallelCount = Array.isArray(set.parallels) ? set.parallels.length : 0;

                    // Clean display name: remove "Base" from Optic sets, keep it for others
                    const displayName = set.name
                      .replace(/\boptic\s+base\s+set\b/gi, 'Optic') // Optic Base Set -> Optic
                      .replace(/\boptic\s+base\b/gi, 'Optic') // Optic Base -> Optic
                      .replace(/\bbase\s+optic\b/gi, 'Optic') // Base Optic -> Optic
                      .replace(/\bsets?\b/gi, '') // Remove "set/sets"
                      .trim();

                    // Gradient colors - cycle through different gradients
                    const gradients = [
                      'from-blue-500/20 to-cyan-500/20',
                      'from-purple-500/20 to-pink-500/20',
                      'from-orange-500/20 to-red-500/20',
                      'from-green-500/20 to-emerald-500/20',
                      'from-indigo-500/20 to-purple-500/20',
                    ];
                    const gradient = gradients[idx % gradients.length];

                    // Generate set slug: year-release-set
                    // Remove "set/sets" and "base" from Optic specifically
                    const cleanSetName = set.name
                      .replace(/\boptic\s+base\s+set\b/gi, 'Optic') // Optic Base Set -> Optic
                      .replace(/\boptic\s+base\b/gi, 'Optic') // Optic Base -> Optic
                      .replace(/\bbase\s+set\b/gi, '') // Remove generic "base set"
                      .replace(/\bsets?\b/gi, '') // Remove remaining "set/sets"
                      .trim();
                    const setSlug = `${release.year || ''}-${release.name}-${cleanSetName}`
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '')
                      .replace(/-+/g, '-')
                      .replace(/^-|-$/g, '');

                    return (
                      <Link
                        key={set.id}
                        href={`/sets/${setSlug}`}
                        className={`grid grid-cols-3 gap-4 px-4 py-3 bg-gradient-to-r ${gradient} hover:from-white/20 hover:to-white/10 transition-all duration-200 border-b border-white/10 last:border-b-0 cursor-pointer`}
                      >
                        <div className="font-semibold text-white hover:underline">{displayName}</div>
                        <div className="text-center">
                          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white font-bold text-sm">
                            {setParallelCount > 0 ? setParallelCount : '—'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white font-bold text-sm">
                            {setCardCount > 0 ? setCardCount.toLocaleString() : '—'}
                          </span>
                        </div>
                      </Link>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center text-footy-green hover:text-green-700 font-semibold transition-colors text-lg"
            >
              ← View All Posts
            </Link>
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

      <footer className="bg-footy-green text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-sm">
            <span className="text-white">footy</span><span className="text-footy-orange">.bot</span> © 2024-{new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
