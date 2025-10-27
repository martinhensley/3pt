"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Image from "next/image";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  type: string;
  published: boolean;
  createdAt: string;
  images: { id: string; url: string; caption: string | null }[];
  releaseId: string | null;
  setId: string | null;
  cardId: string | null;
}

export default function ManagePostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchPosts();

      // Check URL params for initial filter
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get("typeFilter");
      if (typeParam) {
        setTypeFilter(typeParam);
      }
    }
  }, [session]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (postId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          published: !currentStatus,
        }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Post ${!currentStatus ? "published" : "unpublished"} successfully!`,
        });
        fetchPosts();
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to update post");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update post status" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/posts?id=${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Post deleted successfully!" });
        fetchPosts();
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to delete post");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete post" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleViewPost = (slug: string, type: string, published: boolean, postId: string) => {
    if (published) {
      const typeRoute = type === "RELEASE" ? "release" : type === "SET" ? "set" : type === "CARD" ? "card" : "posts";
      window.open(`/${typeRoute}/${slug}`, "_blank");
    } else {
      // For unpublished posts, use preview route
      window.open(`/admin/posts/preview/${postId}`, "_blank");
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === "published" && !post.published) return false;
    if (filter === "draft" && post.published) return false;
    if (typeFilter !== "all" && post.type !== typeFilter) return false;
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <AdminLayout>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="text-footy-green hover:underline mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-footy-green mb-2">
            Manage Posts
          </h1>
          <p className="text-gray-600">
            View, edit, publish, and delete all blog posts
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Status
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "all"
                      ? "bg-footy-green text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  All ({posts.length})
                </button>
                <button
                  onClick={() => setFilter("published")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "published"
                      ? "bg-footy-green text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Published ({posts.filter(p => p.published).length})
                </button>
                <button
                  onClick={() => setFilter("draft")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "draft"
                      ? "bg-footy-green text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Drafts ({posts.filter(p => !p.published).length})
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="RELEASE">Releases</option>
                <option value="SET">Sets</option>
                <option value="CARD">Cards</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-gray-600">No posts found</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex gap-6">
                  {/* Thumbnail */}
                  {post.images[0] && (
                    <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={post.images[0].url}
                        alt={post.title}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full font-semibold text-xs ${
                              post.type === "RELEASE"
                                ? "bg-green-100 text-green-800"
                                : post.type === "SET"
                                ? "bg-blue-100 text-blue-800"
                                : post.type === "CARD"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {post.type}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full font-semibold text-xs ${
                              post.published
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {post.published ? "Published" : "Draft"}
                          </span>
                          <span className="text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {post.excerpt && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewPost(post.slug, post.type, post.published, post.id)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        {post.published ? "View" : "Preview"}
                      </button>
                      <button
                        onClick={() => router.push(`/admin/posts/edit/${post.id}`)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        Edit Post
                      </button>
                      {post.type === "RELEASE" && post.releaseId && (
                        <button
                          onClick={() => router.push(`/admin/releases/edit/${post.releaseId}`)}
                          className="px-4 py-2 bg-footy-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Edit Release
                        </button>
                      )}
                      <button
                        onClick={() => handlePublishToggle(post.id, post.published)}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          post.published
                            ? "bg-yellow-500 text-white hover:bg-yellow-600"
                            : "bg-footy-green text-white hover:bg-green-700"
                        }`}
                      >
                        {post.published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
    </AdminLayout>
  );
}
