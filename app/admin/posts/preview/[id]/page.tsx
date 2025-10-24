"use client";

import { notFound, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function PreviewPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && postId) {
      fetch(`/api/posts`)
        .then((res) => res.json())
        .then((data: Post[]) => {
          const foundPost = data.find((p) => p.id === postId);
          if (!foundPost) {
            notFound();
          }
          setPost(foundPost);
          setLoading(false);
        });
    }
  }, [session, postId]);

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Header showBackButton />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !post) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Header showBackButton />

      {/* Preview Banner */}
      <div className="bg-yellow-100 dark:bg-yellow-900/30 border-b-2 border-yellow-500 dark:border-yellow-700 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-semibold text-yellow-800 dark:text-yellow-200">
              Preview Mode - This post is {post.published ? "published" : "not published"}
            </span>
          </div>
          <button
            onClick={() => router.push("/admin/posts")}
            className="text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
          >
            Back to Posts
          </button>
        </div>
      </div>

      <main className="flex-grow">
        <article className="max-w-4xl mx-auto px-6 py-12">
          {/* Post Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full font-semibold text-sm ${
                  post.type === "RELEASE"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                    : post.type === "SET"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    : post.type === "CARD"
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200"
                    : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                }`}
              >
                {post.type}
              </span>
              {!post.published && (
                <span className="px-3 py-1 rounded-full font-semibold text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                  DRAFT
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 mt-6 text-sm text-gray-500 dark:text-gray-400">
              <time dateTime={post.createdAt}>
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
          </header>

          {/* Post Images */}
          {post.images.length > 0 && (
            <div className="mb-8">
              {post.images.length === 1 ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <Image
                    src={post.images[0].url}
                    alt={post.images[0].caption || post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {post.images.map((image) => (
                    <div
                      key={image.id}
                      className="relative w-full aspect-video rounded-lg overflow-hidden"
                    >
                      <Image
                        src={image.url}
                        alt={image.caption || post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Post Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:text-gray-900 dark:prose-headings:text-white
              prose-p:text-gray-700 dark:prose-p:text-gray-300
              prose-a:text-footy-green dark:prose-a:text-footy-orange
              prose-strong:text-gray-900 dark:prose-strong:text-white
              prose-ul:text-gray-700 dark:prose-ul:text-gray-300
              prose-ol:text-gray-700 dark:prose-ol:text-gray-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
    </div>
  );
}
