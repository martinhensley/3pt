"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
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

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts?published=true")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />

      <div className="flex-grow flex gap-4 max-w-[1400px] mx-auto w-full px-4 py-12">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query="soccer cards" limit={3} title="Latest Soccer Cards" />
        </aside>

        <main className="flex-grow">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 max-w-2xl mx-auto transition-colors duration-300">
              <h2 className="text-3xl font-bold text-footy-dark-green dark:text-footy-gold mb-4">
                Welcome to footy limited
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                No posts yet. Check back soon for the latest soccer card news
                and reviews!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {post.images[0] && (
                  <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={post.images[0].url}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}

                <div className={`p-6 flex-grow flex flex-col ${!post.images[0] ? "min-h-[400px]" : ""}`}>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <span className="bg-footy-gold text-footy-dark-green px-2 py-1 rounded-full font-semibold text-xs">
                      {post.type === "CARD" ? "Card" : post.type === "SET" ? "Set" : post.type === "RELEASE" ? "Release" : "General"}
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

                  <h2 className={`font-bold text-footy-dark-green dark:text-footy-gold mb-3 ${
                    post.images[0] ? "text-xl line-clamp-2" : "text-2xl line-clamp-4"
                  }`}>
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p className={`text-gray-600 dark:text-gray-300 mb-4 flex-grow ${
                      post.images[0] ? "line-clamp-3" : "line-clamp-[12]"
                    }`}>{post.excerpt}</p>
                  )}

                  <div className="mt-auto text-footy-gold dark:text-footy-gold font-semibold">
                    Read more →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <EbayAdHorizontal query="soccer memorabilia" limit={4} title="More Soccer Collectibles" />
        </main>

        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query="soccer autographs" limit={3} title="Soccer Autographs" />
        </aside>
      </div>

      <footer className="bg-footy-dark-green dark:bg-gray-950 text-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-footy-gold text-sm">
              footy limited © 2024-{new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
