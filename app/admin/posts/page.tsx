"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"title" | "created">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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

  // Filter and sort posts
  const filteredAndSortedPosts = posts
    .filter((post) => {
      // Status filter
      if (filter === "published" && !post.published) return false;
      if (filter === "draft" && post.published) return false;

      // Type filter
      if (typeFilter !== "all" && post.type !== typeFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = post.title.toLowerCase();
        const excerpt = (post.excerpt || "").toLowerCase();
        const slug = post.slug.toLowerCase();

        if (!title.includes(query) && !excerpt.includes(query) && !slug.includes(query)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "created":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
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
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Manage Posts", href: "/admin/posts" },
            ]}
          />

          {message && (
            <div
              className={`p-4 rounded-lg mb-4 mt-6 ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Search, Filters, and Actions */}
          <div className="mt-6 mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts by title, excerpt, or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-footy-green focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "published" | "draft")}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="published">Published ({posts.filter(p => p.published).length})</option>
                <option value="draft">Drafts ({posts.filter(p => !p.published).length})</option>
              </select>

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

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "title" | "created")}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="created">Sort by Date</option>
                <option value="title">Sort by Title</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 flex items-center gap-2"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </button>

              <div className="flex-grow"></div>

              <button
                onClick={() => router.push('/admin/posts/create')}
                className="px-4 py-2 bg-footy-green hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Create New Post
              </button>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedPosts.length} of {posts.length} posts
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredAndSortedPosts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {searchQuery || filter !== "all" || typeFilter !== "all"
                  ? "No posts match your filters. Try adjusting your search."
                  : "No posts found. Create your first post to get started!"}
              </p>
            </div>
          ) : (
            filteredAndSortedPosts.map((post) => (
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
                                ? "bg-green-100 text-green-800"
                                : post.type === "CARD"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
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
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
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
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
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
