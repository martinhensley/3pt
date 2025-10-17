"use client";

import { useUser, useStackApp } from "@stackframe/stack";
import { useEffect, useState } from "react";

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  type: string;
  published: boolean;
  createdAt: string;
  images: { id: string; url: string; caption: string | null }[];
}

interface GeneratedPost {
  title: string;
  content: string;
  excerpt: string;
  type: string;
  imageUrls: string[];
}

export default function AdminPage() {
  const user = useUser({ or: "redirect" });
  const stackApp = useStackApp();
  const [activeTab, setActiveTab] = useState<"card" | "set" | "release" | "create" | "manage">("card");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Card form state
  const [cardFrontImage, setCardFrontImage] = useState<File | null>(null);
  const [cardBackImage, setCardBackImage] = useState<File | null>(null);

  // Set form state
  const [checklistImage, setChecklistImage] = useState<File | null>(null);
  const [sellSheetImage, setSellSheetImage] = useState<File | null>(null);

  // Release form state
  const [releaseImage, setReleaseImage] = useState<File | null>(null);

  // Generated post state
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedExcerpt, setEditedExcerpt] = useState("");

  // Manage posts state
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Create post state
  const [createPrompt, setCreatePrompt] = useState("");


  const fetchAllPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const posts = await response.json();
        setAllPosts(posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "manage") {
      fetchAllPosts();
    }
  }, [activeTab]);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const data = await response.json();
    return data.url;
  };

  const handleCardAnalysis = async () => {
    if (!cardFrontImage) {
      setMessage({ type: "error", text: "Please upload at least the front image" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Upload images
      const frontUrl = await uploadFile(cardFrontImage);

      let backUrl = "";
      if (cardBackImage) {
        backUrl = await uploadFile(cardBackImage);
      }

      // Analyze card
      const response = await fetch("/api/analyze/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontImageUrl: frontUrl,
          backImageUrl: backUrl || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze card");
      }

      const analysis = await response.json();
      setGeneratedPost({ ...analysis, type: "CARD", imageUrls: [frontUrl, backUrl].filter(Boolean) });
      setEditedTitle(analysis.title);
      setEditedContent(analysis.content);
      setEditedExcerpt(analysis.excerpt);
      setMessage({ type: "success", text: "Card analyzed successfully! Review and publish below." });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to analyze card. Please try again." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAnalysis = async () => {
    if (!checklistImage) {
      setMessage({ type: "error", text: "Please upload at least the checklist image" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Upload images
      const checkUrl = await uploadFile(checklistImage);

      let sellUrl = "";
      if (sellSheetImage) {
        sellUrl = await uploadFile(sellSheetImage);
      }

      // Analyze set
      const response = await fetch("/api/analyze/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistImageUrl: checkUrl,
          sellSheetImageUrl: sellUrl || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze set");
      }

      const analysis = await response.json();
      setGeneratedPost({ ...analysis, type: "SET", imageUrls: [checkUrl, sellUrl].filter(Boolean) });
      setEditedTitle(analysis.title);
      setEditedContent(analysis.content);
      setEditedExcerpt(analysis.excerpt);
      setMessage({ type: "success", text: "Set analyzed successfully! Review and publish below." });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to analyze set. Please try again." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishPost = async (published: boolean) => {
    if (!generatedPost) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          excerpt: editedExcerpt,
          type: generatedPost.type,
          imageUrls: generatedPost.imageUrls,
          published,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      await response.json();
      setMessage({
        type: "success",
        text: `Post ${published ? "published" : "saved as draft"} successfully!`,
      });

      // Reset form
      setTimeout(() => {
        setGeneratedPost(null);
        setCardFrontImage(null);
        setCardBackImage(null);
        setChecklistImage(null);
        setSellSheetImage(null);
        setEditedTitle("");
        setEditedContent("");
        setEditedExcerpt("");
      }, 2000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create post. Please try again." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPost.id,
          title: editingPost.title,
          content: editingPost.content,
          excerpt: editingPost.excerpt,
          published: editingPost.published,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      setMessage({ type: "success", text: "Post updated successfully!" });
      setEditingPost(null);
      fetchAllPosts();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update post. Please try again." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/posts?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      setMessage({ type: "success", text: "Post deleted successfully!" });
      fetchAllPosts();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete post. Please try again." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublished = async (post: Post) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          published: !post.published,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      setMessage({
        type: "success",
        text: `Post ${!post.published ? "published" : "unpublished"} successfully!`,
      });
      fetchAllPosts();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update post. Please try again." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseAnalysis = async () => {
    if (!releaseImage) {
      setMessage({ type: "error", text: "Please upload a release document" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Upload image
      const imageUrl = await uploadFile(releaseImage);

      // Analyze release
      const response = await fetch("/api/analyze/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze release");
      }

      const analysis = await response.json();
      setGeneratedPost({ ...analysis, type: "RELEASE", imageUrls: [imageUrl] });
      setEditedTitle(analysis.title);
      setEditedContent(analysis.content);
      setEditedExcerpt(analysis.excerpt);
      setMessage({ type: "success", text: "Release analyzed successfully! Review and publish below." });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to analyze release. Please try again." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePost = async () => {
    if (!createPrompt.trim()) {
      setMessage({ type: "error", text: "Please enter a title, subject, or idea for the post" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/generate/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: createPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate post");
      }

      const analysis = await response.json();
      setGeneratedPost({ ...analysis, type: "GENERAL", imageUrls: [] });
      setEditedTitle(analysis.title);
      setEditedContent(analysis.content);
      setEditedExcerpt(analysis.excerpt);
      setMessage({ type: "success", text: "Post generated successfully! Review and publish below." });
      setCreatePrompt("");
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate post. Please try again." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-footy-dark-green text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">footy limited admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-footy-gold">Welcome, {user.displayName || user.primaryEmail || "Admin"}</span>
            <button
              onClick={() => user.signOut()}
              className="bg-footy-gold text-footy-dark-green px-4 py-2 rounded-lg font-semibold hover:opacity-90"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab("card")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "card"
                  ? "text-footy-gold border-b-2 border-footy-gold"
                  : "text-gray-800 hover:text-footy-dark-green"
              }`}
            >
              Analyze Card
            </button>
            <button
              onClick={() => setActiveTab("set")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "set"
                  ? "text-footy-gold border-b-2 border-footy-gold"
                  : "text-gray-800 hover:text-footy-dark-green"
              }`}
            >
              Analyze Set
            </button>
            <button
              onClick={() => setActiveTab("release")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "release"
                  ? "text-footy-gold border-b-2 border-footy-gold"
                  : "text-gray-800 hover:text-footy-dark-green"
              }`}
            >
              Analyze Release
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "create"
                  ? "text-footy-gold border-b-2 border-footy-gold"
                  : "text-gray-800 hover:text-footy-dark-green"
              }`}
            >
              Create Post
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "manage"
                  ? "text-footy-gold border-b-2 border-footy-gold"
                  : "text-gray-800 hover:text-footy-dark-green"
              }`}
            >
              Manage Posts
            </button>
          </div>

          {activeTab === "card" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-footy-dark-green">
                Upload Card Images
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Card Front (Required)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCardFrontImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
                  />
                  {cardFrontImage && (
                    <p className="mt-2 text-sm text-gray-800 font-medium">{cardFrontImage.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Card Back (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCardBackImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
                  />
                  {cardBackImage && (
                    <p className="mt-2 text-sm text-gray-800 font-medium">{cardBackImage.name}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleCardAnalysis}
                disabled={loading || !cardFrontImage}
                className="w-full bg-footy-dark-green text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze Card & Generate Post"}
              </button>
            </div>
          )}

          {activeTab === "set" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-footy-dark-green">
                Upload Set Documents
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Checklist (Required)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setChecklistImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
                  />
                  {checklistImage && (
                    <p className="mt-2 text-sm text-gray-800 font-medium">{checklistImage.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Sell Sheet (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSellSheetImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
                  />
                  {sellSheetImage && (
                    <p className="mt-2 text-sm text-gray-800 font-medium">{sellSheetImage.name}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSetAnalysis}
                disabled={loading || !checklistImage}
                className="w-full bg-footy-dark-green text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze Set & Generate Post"}
              </button>
            </div>
          )}

          {activeTab === "release" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-footy-dark-green">
                Upload Release Document
              </h2>
              <p className="text-gray-700">
                Upload a sell sheet, catalog, or promotional material for an entire release from a manufacturer.
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Release Document (Required)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReleaseImage(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
                />
                {releaseImage && (
                  <p className="mt-2 text-sm text-gray-800 font-medium">{releaseImage.name}</p>
                )}
              </div>

              <button
                onClick={handleReleaseAnalysis}
                disabled={loading || !releaseImage}
                className="w-full bg-footy-dark-green text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze Release & Generate Post"}
              </button>
            </div>
          )}

          {activeTab === "create" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-footy-dark-green">
                Generate Post with AI
              </h2>
              <p className="text-gray-700">
                Enter a title, subject, or idea for a blog post about cards, sets, or football card collecting and let AI generate the content for you.
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Title, Subject, or Idea
                </label>
                <textarea
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                  placeholder="E.g., '1998 Panini World Cup Ronaldo rookie card', '2022 Topps Chrome UEFA Champions League set', or 'Tips for storing and preserving vintage football cards'"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
                />
                <p className="mt-2 text-sm text-gray-600">
                  The more specific you are, the better the AI-generated content will be.
                </p>
              </div>

              <button
                onClick={handleGeneratePost}
                disabled={loading || !createPrompt.trim()}
                className="w-full bg-footy-dark-green text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Post with AI"}
              </button>
            </div>
          )}

          {activeTab === "manage" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-footy-dark-green">
                All Posts
              </h2>

              {allPosts.length === 0 ? (
                <p className="text-gray-800 text-center py-8">No posts yet.</p>
              ) : (
                <div className="space-y-4">
                  {allPosts.map((post) => (
                    <div
                      key={post.id}
                      className="border border-gray-300 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-footy-dark-green">
                              {post.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                post.published
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {post.published ? "Published" : "Draft"}
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-footy-gold text-footy-dark-green">
                              {post.type === "CARD" ? "Card" : post.type === "SET" ? "Set" : post.type === "RELEASE" ? "Release" : "General"}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">
                            {post.excerpt}
                          </p>
                          <p className="text-gray-600 text-xs">
                            Created:{" "}
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setEditingPost(post)}
                            className="px-4 py-2 bg-footy-dark-green text-white rounded hover:opacity-90 text-sm font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleTogglePublished(post)}
                            disabled={loading}
                            className="px-4 py-2 bg-footy-gold text-footy-dark-green rounded hover:opacity-90 text-sm font-semibold disabled:opacity-50"
                          >
                            {post.published ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:opacity-90 text-sm font-semibold disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {generatedPost && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-footy-dark-green mb-6">
              Review Generated Post
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={editedExcerpt}
                  onChange={(e) => setEditedExcerpt(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold font-mono text-sm text-gray-900"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handlePublishPost(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handlePublishPost(true)}
                  disabled={loading}
                  className="flex-1 bg-footy-gold text-footy-dark-green font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Publish Post
                </button>
              </div>
            </div>
          </div>
        )}

        {editingPost && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-footy-dark-green">
                Edit Post
              </h2>
              <button
                onClick={() => setEditingPost(null)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editingPost.title}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={editingPost.excerpt}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, excerpt: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Content
                </label>
                <textarea
                  value={editingPost.content}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, content: e.target.value })
                  }
                  rows={15}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold font-mono text-sm text-gray-900"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPost.published}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        published: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-footy-gold focus:ring-footy-gold"
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    Published
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setEditingPost(null)}
                  className="flex-1 bg-gray-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePost}
                  disabled={loading}
                  className="flex-1 bg-footy-dark-green text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
