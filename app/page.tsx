"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EbayAd from "@/components/EbayAd";
import EbayAdHorizontal from "@/components/EbayAdHorizontal";
import { useEffect, useState } from "react";

interface Release {
  id: string;
  name: string;
  slug: string;
  year: number | null;
  review: string | null;
  reviewDate: string | null;
  releaseDate: string | null;
  createdAt: string;
  manufacturer: {
    id: string;
    name: string;
  };
  images: { id: string; url: string }[];
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  type: string;
  createdAt: string;
  images: { id: string; url: string }[];
}

type ContentItem = (Release & { itemType: 'release' }) | (Post & { itemType: 'post' });

export default function Home() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/releases").then((res) => res.json()),
      fetch("/api/posts?published=true").then((res) => res.json())
    ])
      .then(([releasesData, postsData]) => {
        // Ensure data is arrays
        const releases = Array.isArray(releasesData) ? releasesData : [];
        const posts = Array.isArray(postsData) ? postsData : [];

        // Mark each item with its type
        const releasesWithType = releases.map((r: Release) => ({ ...r, itemType: 'release' as const }));
        const postsWithType = posts.map((p: Post) => ({ ...p, itemType: 'post' as const }));

        // Combine and sort by createdAt (newest first)
        const combined = [...releasesWithType, ...postsWithType].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setContent(combined);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch content:", error);
        setContent([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query="basketball cards" limit={3} title="Latest Basketball Cards" />
        </aside>

        <main className="flex-grow max-w-5xl mx-auto space-y-6">
          <Header rounded={true} />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            </div>
          ) : (
            <>
        {content.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-lg shadow-lg p-12 max-w-2xl mx-auto transition-colors duration-300">
              <h2 className="text-3xl font-bold text-footy-green mb-4">
                Welcome to 3pt bot
              </h2>
              <p className="text-gray-600">
                No content yet. Check back soon for the latest basketball card releases and posts!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.map((item) => {
              if (item.itemType === 'release') {
                const release = item as Release & { itemType: 'release' };
                const title = `${release.year || ''} ${release.manufacturer.name} ${release.name}`.trim();
                return (
                  <Link
                    key={`release-${release.id}`}
                    href={`/releases/${release.slug}`}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    {release.images[0] && (
                      <div className="relative w-full bg-gray-100">
                        <Image
                          src={release.images[0].url}
                          alt={title}
                          width={800}
                          height={600}
                          className="w-full h-auto"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}

                    <div className={`p-6 flex-grow flex flex-col ${!release.images[0] ? "min-h-[400px]" : ""}`}>
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <span className="bg-footy-green text-white px-2 py-1 rounded-full font-semibold text-xs">
                          Release
                        </span>
                        {release.releaseDate && (
                          <>
                            <span className="text-gray-500">•</span>
                            <time
                              dateTime={new Date(release.releaseDate).toISOString()}
                              className="text-gray-500"
                            >
                              {new Date(release.releaseDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </time>
                          </>
                        )}
                      </div>

                      <h2 className={`font-bold text-footy-green mb-3 ${
                        release.images[0] ? "text-xl line-clamp-2" : "text-2xl line-clamp-4"
                      }`}>
                        {title}
                      </h2>

                      {release.review && (
                        <p className={`text-gray-600 mb-4 flex-grow ${
                          release.images[0] ? "line-clamp-3" : "line-clamp-[12]"
                        }`}>{release.review}</p>
                      )}

                      <div className="mt-auto text-footy-orange font-semibold">
                        View release →
                      </div>
                    </div>
                  </Link>
                );
              } else {
                const post = item as Post & { itemType: 'post' };
                const postTypeColors: Record<string, string> = {
                  NEWS: "bg-blue-500",
                  REVIEW: "bg-purple-500",
                  GUIDE: "bg-green-500",
                  ANALYSIS: "bg-orange-500",
                  GENERAL: "bg-gray-500",
                };
                return (
                  <Link
                    key={`post-${post.id}`}
                    href={`/posts/${post.slug}`}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    {post.images[0] && (
                      <div className="relative w-full bg-gray-100">
                        <Image
                          src={post.images[0].url}
                          alt={post.title}
                          width={800}
                          height={600}
                          className="w-full h-auto"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}

                    <div className={`p-6 flex-grow flex flex-col ${!post.images[0] ? "min-h-[400px]" : ""}`}>
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <span className={`${postTypeColors[post.type] || postTypeColors.GENERAL} text-white px-2 py-1 rounded-full font-semibold text-xs`}>
                          {post.type}
                        </span>
                        <span className="text-gray-500">•</span>
                        <time
                          dateTime={new Date(post.createdAt).toISOString()}
                          className="text-gray-500"
                        >
                          {new Date(post.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      </div>

                      <h2 className={`font-bold text-footy-green mb-3 ${
                        post.images[0] ? "text-xl line-clamp-2" : "text-2xl line-clamp-4"
                      }`}>
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p className={`text-gray-600 mb-4 flex-grow ${
                          post.images[0] ? "line-clamp-3" : "line-clamp-[12]"
                        }`}>{post.excerpt}</p>
                      )}

                      <div className="mt-auto text-footy-orange font-semibold">
                        Read more →
                      </div>
                    </div>
                  </Link>
                );
              }
            })}
          </div>
        )}

          <EbayAdHorizontal query="basketball memorabilia" limit={4} title="More Basketball Collectibles" />

          <Footer rounded={true} />
          </>
        )}
        </main>

        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query="basketball autographs" limit={3} title="Basketball Autographs" />
        </aside>
      </div>
    </div>
  );
}
