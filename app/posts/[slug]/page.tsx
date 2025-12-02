"use client";

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PublicPageLayout from "@/components/PublicPageLayout";
import { useEffect, useState, useMemo } from "react";
import { buildPostQueries } from "@/lib/ebayQueries";

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
  const ebayQueries = useMemo(() => {
    if (!post) {
      return {
        primary: 'basketball cards',
        autograph: 'basketball autograph cards',
        related: 'NBA basketball cards',
        primaryTitle: 'Basketball Cards',
        autographTitle: 'Autographs',
        relatedTitle: 'NBA Cards',
      };
    }
    return buildPostQueries(post);
  }, [post]);

  // Call notFound if post not found and not loading
  if (!loading && !post) {
    notFound();
  }

  // Breadcrumbs (extract for PublicPageLayout)
  const breadcrumbs = post ? [
    { label: "Home", href: "/" },
    { label: post.title, href: `/posts/${post.slug}` }
  ] : undefined;

  // Structured data for SEO (only when post exists)
  const structuredData = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.images.map(img => `https://www.3pt.bot${img.url}`),
    datePublished: post.createdAt,
    dateModified: post.createdAt,
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
      "@id": `https://www.3pt.bot/posts/${post.slug}`
    },
    articleSection: post.type === "CARD" ? "Trading Cards" : post.type === "SET" ? "Card Sets" : post.type === "RELEASE" ? "New Releases" : "General",
    keywords: "basketball cards, NBA cards, WNBA cards, trading cards, collectibles"
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
      >
        {post && (
          <article>
            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <span className="bg-3pt-orange text-white px-3 py-1 rounded-full font-semibold">
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

              <h1 className="text-4xl md:text-5xl font-bold text-3pt-green mb-6">
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
                    className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-3pt-green shadow-lg"
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
              className="prose prose-lg max-w-none prose-headings:text-3pt-green prose-a:text-3pt-orange prose-strong:text-3pt-green
              prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
              prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-h2:leading-tight
              prose-h3:text-2xl prose-h3:font-bold prose-h3:mt-10 prose-h3:mb-4 prose-h3:leading-snug
              prose-h4:text-xl prose-h4:font-semibold prose-h4:mt-8 prose-h4:mb-3
              prose-ul:my-6 prose-ul:space-y-2 prose-li:text-gray-800 prose-li:leading-relaxed prose-li:text-lg
              prose-ol:my-6 prose-ol:space-y-2
              prose-blockquote:border-l-4 prose-blockquote:border-3pt-orange prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
              prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-3pt-green
              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
              prose-em:text-gray-700 prose-em:italic
              prose-img:rounded-lg prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-12 pt-8 border-t border-gray-200">
              <Link
                href="/"
                className="inline-flex items-center text-3pt-green hover:text-3pt-orange font-semibold transition-colors"
              >
                ← View All Posts
              </Link>
            </div>
          </article>
        )}
      </PublicPageLayout>
    </>
  );
}
