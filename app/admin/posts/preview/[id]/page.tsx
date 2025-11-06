"use client";

import { notFound, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminLayout from "@/components/AdminLayout";
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
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!session?.user || !post) {
    return null;
  }

  return (
    <AdminLayout>
      {/* Preview Banner */}
      <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg py-3 px-4 mb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-semibold text-yellow-800">
              Preview Mode - This post is {post.published ? "published" : "not published"}
            </span>
          </div>
          <button
            onClick={() => router.push("/admin/posts")}
            className="text-sm text-yellow-700 hover:underline"
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
                    ? "bg-green-100 text-green-800"
                    : post.type === "SET"
                    ? "bg-green-100 text-green-800"
                    : post.type === "CARD"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {post.type}
              </span>
              {!post.published && (
                <span className="px-3 py-1 rounded-full font-semibold text-sm bg-yellow-100 text-yellow-800">
                  DRAFT
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-xl text-gray-600 leading-relaxed">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
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
            className="prose prose-lg max-w-none
              prose-headings:text-gray-900
              prose-p:text-gray-700
              prose-a:text-footy-green
              prose-strong:text-gray-900
              prose-ul:text-gray-700
              prose-ol:text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
    </AdminLayout>
  );
}
