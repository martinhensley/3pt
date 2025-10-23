"use client";

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import EbayAd from "@/components/EbayAd";
import EbayAdHorizontal from "@/components/EbayAdHorizontal";
import { useEffect, useState, useMemo } from "react";
import { extractKeywordsFromPost, getAdTitle } from "@/lib/extractKeywords";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  type: string;
  createdAt: string;
  published: boolean;
  images: { id: string; url: string; caption: string | null }[];
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
  totalCards: string | null;
  parallels: any;
  cards: Card[];
}

interface Release {
  id: string;
  name: string;
  year: string | null;
  manufacturer: {
    name: string;
  };
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
  const [post, setPost] = useState<Post | null>(null);
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Fetch post
    fetch(`/api/posts`)
      .then((res) => res.json())
      .then((data: Post[]) => {
        const foundPost = data.find((p) => p.slug === slug && p.published && p.type === "RELEASE");
        if (!foundPost) {
          notFound();
        }
        setPost(foundPost);

        // Fetch release data
        return fetch(`/api/releases?slug=${slug}`);
      })
      .then((res) => res.json())
      .then((releaseData: Release) => {
        setRelease(releaseData);
        // Set first set as active by default
        if (releaseData?.sets?.length > 0) {
          setActiveSetId(releaseData.sets[0].id);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      });
  }, [slug]);

  // Extract keywords from post for dynamic ad queries
  const adKeywords = useMemo(() => {
    if (!post) {
      return {
        primaryQuery: 'soccer cards',
        autographQuery: 'soccer autographs',
        relatedQuery: 'soccer cards',
        playerName: null,
        teamName: null,
      };
    }
    return extractKeywordsFromPost(post);
  }, [post]);

  // Generate carousel images with AI-style captions
  const carouselImages = useMemo<CarouselImage[]>(() => {
    if (!post || !release) return [];

    const images: CarouselImage[] = [];

    // Add release images first
    post.images.forEach(img => {
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
  }, [post, release]);

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
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Header showBackButton />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!post || !release) {
    notFound();
  }

  const activeSet = release.sets?.find(s => s.id === activeSetId);

  // Calculate statistics
  const totalCards = release.sets?.reduce((sum, set) => {
    if (set.cards?.length > 0) return sum + set.cards.length;
    if (set.totalCards) return sum + parseInt(set.totalCards);
    return sum;
  }, 0) || 0;

  const totalParallels = release.sets?.reduce((sum, set) => {
    if (Array.isArray(set.parallels)) return sum + set.parallels.length;
    return sum;
  }, 0) || 0;

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.images.map(img => `https://www.footy.bot${img.url}`),
    datePublished: post.createdAt,
    dateModified: post.createdAt,
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
      "@id": `https://www.footy.bot/release/${post.slug}`
    },
    articleSection: "New Releases",
    keywords: "soccer cards, football cards, trading cards, collectibles"
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
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
          {/* Image Carousel */}
          {carouselImages.length > 0 && (
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden mb-8 border border-gray-200 dark:border-gray-700">
              <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
                <Image
                  src={carouselImages[currentImageIndex].url}
                  alt={carouselImages[currentImageIndex].caption}
                  fill
                  className="object-contain"
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

                {/* Image Type Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    carouselImages[currentImageIndex].type === 'release'
                      ? 'bg-footy-green text-white'
                      : 'bg-footy-orange text-white'
                  }`}>
                    {carouselImages[currentImageIndex].type === 'release' ? 'Release' : 'Card'}
                  </span>
                </div>

                {/* Image Counter */}
                {carouselImages.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {currentImageIndex + 1} / {carouselImages.length}
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6">
                <p className="text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                  {carouselImages[currentImageIndex].caption}
                </p>
              </div>

              {/* Dot Indicators */}
              {carouselImages.length > 1 && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
                  {carouselImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`transition-all duration-200 ${
                        idx === currentImageIndex
                          ? 'w-8 h-2 bg-footy-orange'
                          : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                      } rounded-full`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hero Header */}
          <div className="bg-gradient-to-r from-footy-green to-green-700 dark:from-footy-orange dark:to-orange-700 rounded-2xl shadow-2xl p-8 mb-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-sm">
                RELEASE
              </span>
              <span className="text-white/80">•</span>
              <time dateTime={new Date(post.createdAt).toISOString()} className="text-white/80">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>

            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              {release.manufacturer?.name} {release.name}
              {release.year && <span className="block text-3xl md:text-4xl mt-2 text-white/90">{release.year}</span>}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-white/90 leading-relaxed">{post.excerpt}</p>
            )}

            {/* Set Breakdown Summary */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10">
                {/* Table Header */}
                <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-white/10 border-b border-white/20">
                  <div className="font-bold text-sm uppercase tracking-wide text-white/90">Set Name</div>
                  <div className="font-bold text-sm uppercase tracking-wide text-white/90 text-center">Parallels</div>
                  <div className="font-bold text-sm uppercase tracking-wide text-white/90 text-center">Cards</div>
                </div>

                {/* Table Rows - Alphabetically Sorted */}
                {release.sets
                  ?.slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((set, idx) => {
                    const setCardCount = set.cards?.length || (set.totalCards ? parseInt(set.totalCards) : 0);
                    const setParallelCount = Array.isArray(set.parallels) ? set.parallels.length : 0;

                    // Gradient colors - cycle through different gradients
                    const gradients = [
                      'from-purple-500/20 to-pink-500/20',
                      'from-blue-500/20 to-cyan-500/20',
                      'from-green-500/20 to-emerald-500/20',
                      'from-orange-500/20 to-red-500/20',
                      'from-indigo-500/20 to-purple-500/20',
                      'from-teal-500/20 to-green-500/20',
                    ];
                    const gradient = gradients[idx % gradients.length];

                    return (
                      <div
                        key={set.id}
                        className={`grid grid-cols-3 gap-4 px-4 py-3 bg-gradient-to-r ${gradient} hover:from-white/20 hover:to-white/10 transition-all duration-200 border-b border-white/10 last:border-b-0`}
                      >
                        <div className="font-semibold text-white">{set.name}</div>
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
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Release Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
            <div
              className="prose prose-lg max-w-none prose-headings:text-footy-green dark:prose-headings:text-footy-orange prose-a:text-footy-orange prose-strong:text-footy-green dark:prose-strong:text-footy-orange dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Sets Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-black text-footy-green dark:text-footy-orange mb-6 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Complete Set Breakdown
            </h2>

            {/* Set Navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
              {release.sets?.map((set) => (
                <button
                  key={set.id}
                  onClick={() => setActiveSetId(set.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    activeSetId === set.id
                      ? 'bg-footy-green dark:bg-footy-orange text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {set.name}
                  {set.totalCards && <span className="ml-2 text-sm opacity-80">({set.totalCards})</span>}
                </button>
              ))}
            </div>

            {/* Active Set Details */}
            {activeSet && (
              <div className="space-y-6">
                {/* Set Header */}
                <div className="bg-gradient-to-r from-footy-green/10 to-green-100/50 dark:from-footy-orange/10 dark:to-orange-900/30 rounded-xl p-6 border-l-4 border-footy-green dark:border-footy-orange">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    {activeSet.name}
                  </h3>
                  {activeSet.totalCards && (
                    <p className="text-lg text-gray-700 dark:text-gray-300">
                      <strong>{activeSet.totalCards}</strong> cards in this set
                    </p>
                  )}
                </div>

                {/* Parallels/Variations */}
                {Array.isArray(activeSet.parallels) && activeSet.parallels.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-footy-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Parallels & Variations
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeSet.parallels.map((parallel: string, idx: number) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow"
                        >
                          <div className="text-sm font-bold text-purple-900 dark:text-purple-300">
                            {parallel}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Checklist */}
                {activeSet.cards && activeSet.cards.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-footy-green dark:text-footy-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Complete Checklist ({activeSet.cards?.length || 0} cards)
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div className="grid gap-2">
                        {activeSet.cards?.map((card) => (
                          <div
                            key={card.id}
                            className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-footy-green dark:hover:border-footy-orange transition-colors"
                          >
                            {card.cardNumber && (
                              <div className="flex-shrink-0 w-12 h-12 bg-footy-green dark:bg-footy-orange text-white rounded-lg flex items-center justify-center font-bold">
                                {card.cardNumber}
                              </div>
                            )}
                            <div className="flex-grow">
                              <div className="font-bold text-gray-900 dark:text-white">
                                {card.playerName || 'Unknown Player'}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {card.team && <span>{card.team}</span>}
                                {card.variant && <span className="ml-2 text-purple-600 dark:text-purple-400">• {card.variant}</span>}
                              </div>
                            </div>
                            {(card.hasAutograph || card.hasMemorabilia || card.isNumbered) && (
                              <div className="flex gap-1">
                                {card.hasAutograph && (
                                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-semibold">
                                    AUTO
                                  </span>
                                )}
                                {card.hasMemorabilia && (
                                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full font-semibold">
                                    MEM
                                  </span>
                                )}
                                {card.isNumbered && card.printRun && (
                                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full font-semibold">
                                    /{card.printRun}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(!activeSet.cards || activeSet.cards.length === 0) && !activeSet.totalCards && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 italic">
                    Checklist information not yet available for this set
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/"
              className="inline-flex items-center text-footy-green dark:text-footy-orange hover:text-footy-orange font-semibold transition-colors text-lg"
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

      <footer className="bg-footy-green dark:bg-gray-950 text-white transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-sm">
            <span className="text-white">footy</span><span className="text-footy-orange">.bot</span> © 2024-{new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
