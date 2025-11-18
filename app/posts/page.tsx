"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EbayAd from "@/components/EbayAd";
import EbayAdHorizontal from "@/components/EbayAdHorizontal";
import { useEffect, useState } from "react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  type: string;
  createdAt: string;
  images: { id: string; url: string }[];
}

export default function PostsIndex() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts?published=true")
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch posts:", error);
        setPosts([]);
        setLoading(false);
      });
  }, []);

  const postTypeColors: Record<string, string> = {
    NEWS: "bg-blue-500",
    REVIEW: "bg-purple-500",
    GUIDE: "bg-green-500",
    ANALYSIS: "bg-orange-500",
    GENERAL: "bg-gray-500",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query="soccer cards" limit={3} title="Latest Soccer Cards" />
        </aside>

        <main className="flex-grow max-w-5xl lg:mx-auto space-y-6">
          <Header rounded={true} />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            </div>
          ) : (
            <>
              {posts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="bg-white rounded-lg shadow-lg p-12 max-w-2xl mx-auto transition-colors duration-300">
                    <h2 className="text-3xl font-bold text-footy-green mb-4">
                      No Posts Yet
                    </h2>
                    <p className="text-gray-600">
                      Check back soon for the latest articles and posts!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post) => {
                    return (
                      <Link
                        key={post.id}
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
                  })}
                </div>
              )}

              <EbayAdHorizontal query="soccer memorabilia" limit={4} title="More Soccer Collectibles" />

              <Footer rounded={true} />
            </>
          )}
        </main>

        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query="soccer autographs" limit={3} title="Soccer Autographs" />
        </aside>
      </div>
    </div>
  );
}
