"use client";

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import { useEffect, useState } from "react";

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

export default function PostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts`)
      .then((res) => res.json())
      .then((data: Post[]) => {
        const foundPost = data.find((p) => p.slug === slug && p.published);
        if (!foundPost) {
          notFound();
        }
        setPost(foundPost);
        setLoading(false);
      });
  }, [slug]);

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

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header showBackButton />

      <div className="flex-grow flex gap-4 max-w-[1400px] mx-auto w-full px-4 py-12">
        <aside className="hidden lg:block w-48 flex-shrink-0">
          <div className="bg-gray-700 dark:bg-gray-800 border-2 border-footy-gold rounded p-4 text-center sticky top-4">
            <p className="text-xs text-white mb-2">Left Ad</p>
            <p className="text-xs text-gray-400">Placeholder</p>
            <div className="h-96 flex items-center justify-center text-gray-500 text-xs">
              Ad Space
            </div>
          </div>
        </aside>

        <main className="flex-grow max-w-4xl mx-auto">
        <article>
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span className="bg-footy-gold text-footy-dark-green px-3 py-1 rounded-full font-semibold">
                {post.type === "CARD" ? "Card" : post.type === "SET" ? "Set" : post.type === "RELEASE" ? "Release" : "General"}
              </span>
              <span>•</span>
              <time dateTime={new Date(post.createdAt).toISOString()}>
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-footy-dark-green dark:text-footy-gold mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">{post.excerpt}</p>
            )}
          </div>

          {post.images.length > 0 && (
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              {post.images.map((image) => (
                <div
                  key={image.id}
                  className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-footy-dark-green dark:border-footy-gold shadow-lg"
                >
                  <div className="relative w-full" style={{ paddingBottom: "140%" }}>
                    <Image
                      src={image.url}
                      alt={image.caption || post.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  {image.caption && (
                    <p className="p-2 text-sm text-gray-600 dark:text-gray-300 text-center bg-white dark:bg-gray-800">
                      {image.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className="prose prose-lg max-w-none prose-headings:text-footy-dark-green dark:prose-headings:text-footy-gold prose-a:text-footy-gold prose-strong:text-footy-dark-green dark:prose-strong:text-footy-gold dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/"
              className="inline-flex items-center text-footy-dark-green dark:text-footy-gold hover:text-footy-gold font-semibold transition-colors"
            >
              ← View All Posts
            </Link>
          </div>
        </article>
        </main>

        <aside className="hidden lg:block w-48 flex-shrink-0">
          <div className="bg-gray-700 dark:bg-gray-800 border-2 border-footy-gold rounded p-4 text-center sticky top-4">
            <p className="text-xs text-white mb-2">Right Ad</p>
            <p className="text-xs text-gray-400">Placeholder</p>
            <div className="h-96 flex items-center justify-center text-gray-500 text-xs">
              Ad Space
            </div>
          </div>
        </aside>
      </div>

      <footer className="bg-footy-dark-green dark:bg-gray-950 text-white transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-footy-gold font-bold text-xl">footy limited</p>
        </div>
      </footer>
    </div>
  );
}
