"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
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

  const postTypeColors: Record<string, string> = {
    NEWS: "bg-blue-500",
    REVIEW: "bg-purple-500",
    GUIDE: "bg-green-500",
    ANALYSIS: "bg-orange-500",
    GENERAL: "bg-gray-500",
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />

      <div className="flex-grow max-w-7xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-footy-green dark:text-footy-orange mb-2">
            All Posts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse our complete collection of articles and posts
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 max-w-2xl mx-auto transition-colors duration-300">
              <h2 className="text-3xl font-bold text-footy-green dark:text-footy-orange mb-4">
                No Posts Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
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
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {post.images[0] && (
                    <div className="relative w-full bg-gray-100 dark:bg-gray-700">
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

                    <h2 className={`font-bold text-footy-green dark:text-footy-orange mb-3 ${
                      post.images[0] ? "text-xl line-clamp-2" : "text-2xl line-clamp-4"
                    }`}>
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className={`text-gray-600 dark:text-gray-300 mb-4 flex-grow ${
                        post.images[0] ? "line-clamp-3" : "line-clamp-[12]"
                      }`}>{post.excerpt}</p>
                    )}

                    <div className="mt-auto text-footy-orange dark:text-footy-orange font-semibold">
                      Read more →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <footer className="bg-footy-green dark:bg-gray-950 text-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-sm">
              <span className="text-white">footy</span><span className="text-footy-orange">.bot</span> © 2024-{new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
