"use client";

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PublicPageLayout from "@/components/PublicPageLayout";
import { useEffect, useState, useMemo } from "react";
import { buildReleaseQueries } from "@/lib/ebayQueries";
import { isParallelSet, getBaseSetSlug, sortSets, sortSetsGrouped, groupSetsByBase } from "@/lib/setUtils";

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

interface CardSet {
  id: string;
  name: string;
  slug: string;
  type: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other';
  description: string | null;
  expectedCardCount: number | null;
  printRun: number | null;
  isParallel: boolean;
  baseSetSlug: string | null;
  cards: Card[];
}

interface SourceDocument {
  id: string;
  filename: string;
  displayName: string;
  blobUrl: string;
  mimeType: string;
  fileSize: number;
  documentType: 'SELL_SHEET' | 'CHECKLIST' | 'PRESS_RELEASE' | 'PRICE_GUIDE' | 'IMAGE' | 'OTHER';
  description: string | null;
  uploadedAt: string;
}

interface ReleaseSourceDocument {
  id: string;
  filename: string;
  displayName: string;
  blobUrl: string;
  mimeType: string;
  fileSize: number;
  documentType: 'SELL_SHEET' | 'CHECKLIST' | 'PRESS_RELEASE' | 'PRICE_GUIDE' | 'IMAGE' | 'OTHER';
  entityType: 'RELEASE' | 'POST';
  description: string | null;
  usageContext: string | null;
  uploadedAt: string;
}

interface SourceFile {
  url: string;
  type: string;
  filename: string;
}

interface Release {
  id: string;
  name: string;
  year: string | null;
  slug: string;
  summary: string | null;
  releaseDate: string | null;
  createdAt: string;
  manufacturer: {
    name: string;
  };
  images: Image[];
  sets: CardSet[];
  sourceDocuments?: ReleaseSourceDocument[];
  sourceFiles?: SourceFile[] | null; // JSON field - can be array or null
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
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<globalThis.Set<string>>(new globalThis.Set(['Base', 'Autograph', 'Memorabilia', 'Insert', 'Other'])); // All set types expanded by default

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
  const ebayQueries = useMemo(() => {
    if (!release) {
      return {
        primary: 'basketball cards',
        autograph: 'basketball autograph cards',
        related: 'NBA basketball cards',
        primaryTitle: 'Basketball Cards',
        autographTitle: 'Autographs',
        relatedTitle: 'NBA Cards',
      };
    }
    return buildReleaseQueries(release);
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
    if (carouselImages.length <= 1 || isCarouselPaused) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [carouselImages.length, isCarouselPaused]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const toggleSetType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  // Group sets by type and sort using our new logic
  const setsByType = useMemo(() => {
    if (!release?.sets) return new Map();

    const grouped = new Map<string, CardSet[]>();

    // Group all sets by type
    release.sets.forEach(set => {
      const type = set.type || 'Other';
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(set);
    });

    // Apply our custom sorting logic to each type group
    // Use the enhanced sortSetsGrouped function for all types to properly group sets with their parallels
    grouped.forEach((sets, type) => {
      const sortedSets = sortSetsGrouped(sets);
      grouped.set(type, sortedSets);
    });

    return grouped;
  }, [release]);

  if (!release && !loading) {
    notFound();
  }

  // Extract breadcrumbs for PublicPageLayout
  const breadcrumbs = release ? [
    { label: "Home", href: "/" },
    {
      label: `${release.year} ${release.manufacturer.name} ${release.name}`,
      href: `/releases/${release.slug}`,
    },
  ] : undefined;

  // Structured data for SEO
  const structuredData = release ? {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${release.year} ${release.manufacturer.name} ${release.name}`,
    description: `${release.manufacturer.name} ${release.name} ${release.year || ''} trading card release`,
    image: release.images.map(img => `https://www.3pt.bot${img.url}`),
    datePublished: release.createdAt,
    dateModified: release.createdAt,
    author: {
      "@type": "Organization",
      name: "3pt Bot",
      url: "https://www.3pt.bot"
    },
    publisher: {
      "@type": "Organization",
      name: "3pt Bot",
      logo: {
        "@type": "ImageObject",
        url: "https://www.3pt.bot/logo.png"
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.3pt.bot/releases/${release.slug}`
    },
    articleSection: "New Releases",
    keywords: "soccer cards, football cards, trading cards, collectibles"
  } : null;

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <PublicPageLayout
        leftAdQuery={ebayQueries.primary}
        leftAdTitle={ebayQueries.primaryTitle}
        rightAdQuery={ebayQueries.autograph}
        rightAdTitle={ebayQueries.autographTitle}
        horizontalAdQuery={ebayQueries.related}
        horizontalAdTitle={ebayQueries.relatedTitle}
        breadcrumbs={breadcrumbs}
        loading={loading}
        error={!loading && !release ? "Release not found" : undefined}
      >
        {release && (
          <>

          {/* Combined Hero with Carousel */}
          <div className="bg-gradient-to-r from-3pt-green to-green-700 rounded-2xl shadow-2xl overflow-hidden mb-8 text-white w-full max-w-full">
            {/* Hero Header */}
            <div className="p-4 md:p-8 pb-6">
              <div className="space-y-3 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-sm">
                      RELEASE
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black leading-tight break-words w-full sm:w-auto">
                    {release.year} {release.manufacturer.name} {release.name}
                  </h1>
                </div>
                {release.releaseDate && !isNaN(new Date(release.releaseDate).getTime()) && (
                  <p className="text-base text-white/80">
                    Release Date: {new Intl.DateTimeFormat('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }).format(new Date(release.releaseDate))}
                  </p>
                )}
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

                  {/* Image Counter with Pause/Play Button */}
                  {carouselImages.length > 1 && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button
                        onClick={() => setIsCarouselPaused(!isCarouselPaused)}
                        className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-all duration-200"
                        aria-label={isCarouselPaused ? 'Play carousel' : 'Pause carousel'}
                      >
                        {isCarouselPaused ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        )}
                      </button>
                      <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {currentImageIndex + 1} / {carouselImages.length}
                      </div>
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

            {/* Summary */}
            {release.summary && (
              <div className="p-4 md:p-8 pt-6">
                {/* Summary Content */}
                <div className="space-y-4">
                  {release.summary.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-lg text-white/90 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Sets - Single Combined Table */}
            <div className="p-4 md:p-8 pt-6 border-t border-white/20">
              {release.sets && release.sets.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-lg overflow-x-auto border border-white/10 max-w-full">
                  {/* Header Row - Always Visible */}
                  <div className="grid grid-cols-[minmax(0,2fr)_70px_70px] md:grid-cols-[minmax(0,2fr)_120px_120px] gap-2 md:gap-4 px-2 md:px-4 py-3 bg-white/10">
                    <div className="font-bold text-sm uppercase tracking-wide text-white/90">Set Name</div>
                    <div className="font-bold text-sm uppercase tracking-wide text-white/90 text-center">Print Run</div>
                    <div className="font-bold text-sm uppercase tracking-wide text-white/90 text-center">Cards</div>
                  </div>

                  {/* Render all set types in order */}
                  {['Base', 'Autograph', 'Memorabilia', 'Insert', 'Other'].map(setType => {
                    const setsOfType = setsByType.get(setType);
                    if (!setsOfType || setsOfType.length === 0) return null;

                    const typeColors: Record<string, { bg: string; text: string }> = {
                      Base: { bg: 'bg-blue-500/20', text: 'text-blue-200' },
                      Insert: { bg: 'bg-green-500/20', text: 'text-green-200' },
                      Autograph: { bg: 'bg-purple-500/20', text: 'text-purple-200' },
                      Memorabilia: { bg: 'bg-orange-500/20', text: 'text-orange-200' },
                      Other: { bg: 'bg-gray-500/20', text: 'text-gray-200' },
                    };
                    const colors = typeColors[setType] || typeColors.Other;

                    const isExpanded = expandedTypes.has(setType);

                    return (
                      <div key={setType}>
                        {/* Type Label Row - Clickable Accordion Header */}
                        <button
                          onClick={() => toggleSetType(setType)}
                          className={`w-full px-4 py-3 ${colors.bg} border-t border-white/10 flex items-center justify-between hover:opacity-80 transition-opacity`}
                        >
                          <span className={`font-bold text-lg ${colors.text}`}>{setType}</span>
                          <svg
                            className={`w-5 h-5 ${colors.text} transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Set Rows - Collapsible */}
                        {isExpanded && setsOfType.map((set: CardSet, idx: number) => {
                          // For parallel sets, use totalCards field (which should be set to match parent)
                          // Fall back to cards length only if totalCards is not set
                          const setCardCount = set.expectedCardCount ? set.expectedCardCount : (set.cards?.length || 0);

                          // Display print run for this set (if it has one)
                          const printRun = set.printRun;
                          const printRunDisplay = printRun
                            ? (printRun === 1 ? '1/1' : `/${printRun}`)
                            : '—';

                          // Display name formatting
                          // Use the database name directly - it's already correctly formatted
                          let displayName = set.name
                            .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
                            .replace(/\boptic\s+base\b/gi, 'Optic')
                            .replace(/\bbase\s+optic\b/gi, 'Optic')
                            .replace(/\bsets?\b/gi, '')
                            .trim();

                          const gradients = [
                            'from-blue-500/20 to-cyan-500/20',
                            'from-purple-500/20 to-pink-500/20',
                            'from-orange-500/20 to-red-500/20',
                            'from-green-500/20 to-emerald-500/20',
                            'from-indigo-500/20 to-purple-500/20',
                          ];
                          const gradient = gradients[idx % gradients.length];

                          return (
                            <Link
                              key={set.id}
                              href={`/sets/${set.slug}`}
                              className={`grid grid-cols-[minmax(0,2fr)_70px_70px] md:grid-cols-[minmax(0,2fr)_120px_120px] gap-2 md:gap-4 px-2 md:px-4 py-3 bg-gradient-to-r ${gradient} hover:from-white/20 hover:to-white/10 transition-all duration-200 border-t border-white/10 cursor-pointer`}
                            >
                              <div className="font-semibold text-white hover:underline truncate">{displayName}</div>
                              <div className="text-center flex-shrink-0">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white font-bold text-sm whitespace-nowrap">
                                  {printRunDisplay}
                                </span>
                              </div>
                              <div className="text-center flex-shrink-0">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white font-bold text-sm whitespace-nowrap">
                                  {setCardCount > 0 ? setCardCount.toLocaleString() : '—'}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Source Documents Section */}
          {((release.sourceFiles && Array.isArray(release.sourceFiles) && release.sourceFiles.length > 0) ||
            (release.sourceDocuments && release.sourceDocuments.length > 0)) && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-3pt-green to-green-700 px-6 py-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Source Documents
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {/* Display sourceFiles (JSON field) - exclude image files */}
                {release.sourceFiles && Array.isArray(release.sourceFiles) && release.sourceFiles
                  .filter((file) => {
                    // Exclude image files
                    const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename || '');
                    return !isImage;
                  })
                  .map((file, idx) => {
                  const fileExtension = file.filename?.split('.').pop()?.toUpperCase() || 'FILE';

                  // Determine document type from filename or mime type
                  const isCSV = file.type === 'text/csv' || file.filename?.toLowerCase().endsWith('.csv');
                  const isPDF = file.type === 'application/pdf' || file.filename?.toLowerCase().endsWith('.pdf');
                  const isExcel = file.type?.includes('spreadsheet') || /\.(xlsx?|xls)$/i.test(file.filename || '');

                  const docType = isCSV || isExcel ? 'CHECKLIST' : isPDF ? 'SELL_SHEET' : 'OTHER';

                  const typeColors: Record<string, { bg: string; text: string }> = {
                    SELL_SHEET: { bg: 'bg-blue-100', text: 'text-blue-800' },
                    CHECKLIST: { bg: 'bg-green-100', text: 'text-green-800' },
                    OTHER: { bg: 'bg-gray-100', text: 'text-gray-800' },
                  };
                  const colors = typeColors[docType] || typeColors.OTHER;

                  // PDFs open in new tab, CSVs/Excel download
                  const shouldDownload = isCSV || isExcel;

                  return (
                    <a
                      key={`sf-${idx}`}
                      href={file.url}
                      {...(shouldDownload ? { download: file.filename } : { target: "_blank", rel: "noopener noreferrer" })}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-3pt-green hover:bg-gray-50 transition-all duration-200 group"
                    >
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-3pt-green to-green-700 rounded-lg flex items-center justify-center text-white font-bold text-xs group-hover:scale-110 transition-transform duration-200">
                          {fileExtension}
                        </div>
                      </div>

                      {/* Document Info */}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-3pt-green transition-colors truncate">
                          {file.filename || 'Unnamed File'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {docType.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Download Icon for CSV/Excel, External Link for PDFs */}
                      <div className="flex-shrink-0">
                        {shouldDownload ? (
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-3pt-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-3pt-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </div>
                    </a>
                  );
                })}

                {/* Display sourceDocuments from Document Library - exclude IMAGE type */}
                {release.sourceDocuments && release.sourceDocuments
                  .filter((doc) => doc.documentType !== 'IMAGE')
                  .map((doc) => {
                  // sourceDocuments is directly an array of SourceDocument entities
                  const fileExtension = doc.filename?.split('.').pop()?.toUpperCase() || 'FILE';
                  const fileSizeMB = doc.fileSize ? (doc.fileSize / (1024 * 1024)).toFixed(2) : 'Unknown';

                  // Determine if this should download or open in new tab
                  const isChecklistDoc = doc.documentType === 'CHECKLIST' ||
                    /\.(csv|xlsx?|xls)$/i.test(doc.filename || '');
                  const shouldDownloadDoc = isChecklistDoc;

                  // Document type badge colors
                  const typeColors: Record<string, { bg: string; text: string }> = {
                    SELL_SHEET: { bg: 'bg-blue-100', text: 'text-blue-800' },
                    CHECKLIST: { bg: 'bg-green-100', text: 'text-green-800' },
                    PRESS_RELEASE: { bg: 'bg-purple-100', text: 'text-purple-800' },
                    PRICE_GUIDE: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
                    IMAGE: { bg: 'bg-pink-100', text: 'text-pink-800' },
                    OTHER: { bg: 'bg-gray-100', text: 'text-gray-800' },
                  };
                  const colors = typeColors[doc.documentType] || typeColors.OTHER;

                  return (
                    <a
                      key={doc.id}
                      href={doc.blobUrl}
                      {...(shouldDownloadDoc ? { download: doc.filename } : { target: "_blank", rel: "noopener noreferrer" })}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-3pt-green hover:bg-gray-50 transition-all duration-200 group"
                    >
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-3pt-green to-green-700 rounded-lg flex items-center justify-center text-white font-bold text-xs group-hover:scale-110 transition-transform duration-200">
                          {fileExtension}
                        </div>
                      </div>

                      {/* Document Info */}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-3pt-green transition-colors truncate">
                          {doc.displayName || 'Unnamed Document'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {doc.documentType?.replace(/_/g, ' ') || 'UNKNOWN'}
                          </span>
                          {doc.fileSize > 0 && (
                            <span className="text-sm text-gray-500">
                              {fileSizeMB} MB
                            </span>
                          )}
                          {doc.usageContext && (
                            <span className="text-sm text-gray-500 italic truncate">
                              • {doc.usageContext}
                            </span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {doc.description}
                          </p>
                        )}
                      </div>

                      {/* Download Icon for checklists, External Link for PDFs/others */}
                      <div className="flex-shrink-0">
                        {shouldDownloadDoc ? (
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-3pt-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-3pt-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </>
        )}
      </PublicPageLayout>
    </>
  );
}
