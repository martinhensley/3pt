"use client";

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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

  // Extract keywords from post for dynamic ad queries (must be before early returns)
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

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header showBackButton />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

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
      "@id": `https://www.footy.bot/posts/${post.slug}`
    },
    articleSection: post.type === "CARD" ? "Trading Cards" : post.type === "SET" ? "Card Sets" : post.type === "RELEASE" ? "New Releases" : "General",
    keywords: "soccer cards, football cards, trading cards, collectibles"
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-[1600px] mx-auto w-full px-4 pt-6">
        <Header showBackButton={true} rounded={true} />
      </div>

      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pb-12">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd
            query={adKeywords.primaryQuery}
            limit={3}
            title={getAdTitle(adKeywords.primaryQuery, "Soccer Cards")}
          />
        </aside>

        <main className="flex-grow max-w-4xl mx-auto space-y-6">
        <article>
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span className="bg-footy-orange text-white px-3 py-1 rounded-full font-semibold">
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

            <h1 className="text-4xl md:text-5xl font-bold text-footy-green mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-8">{post.excerpt}</p>
            )}
          </div>

          {post.images.length > 0 && (
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              {post.images.map((image) => (
                <div
                  key={image.id}
                  className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-footy-green shadow-lg"
                >
                  <Image
                    src={image.url}
                    alt={image.caption || post.title}
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {image.caption && (
                    <p className="p-2 text-sm text-gray-600 text-center bg-white">
                      {image.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className="prose prose-lg max-w-none prose-headings:text-footy-green prose-a:text-footy-orange prose-strong:text-footy-green"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center text-footy-green hover:text-footy-orange font-semibold transition-colors"
            >
              ← View All Posts
            </Link>
          </div>
        </article>

        <EbayAdHorizontal
          query={adKeywords.relatedQuery}
          limit={4}
          title={getAdTitle(adKeywords.relatedQuery, "Related Soccer Cards")}
        />

          <Footer rounded={true} />
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
