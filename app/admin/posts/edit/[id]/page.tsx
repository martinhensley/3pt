"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
import AdminHeader from "@/components/AdminHeader";
import Image from "next/image";
import RichTextEditor from "@/components/RichTextEditor";

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
}

export default function EditPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [published, setPublished] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && postId) {
      fetchPost();
    }
  }, [session, postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const posts = await response.json();
        const foundPost = posts.find((p: Post) => p.id === postId);
        if (foundPost) {
          setPost(foundPost);
          setTitle(foundPost.title);
          setContent(foundPost.content);
          setExcerpt(foundPost.excerpt);
          setPublished(foundPost.published);
        } else {
          setMessage({ type: "error", text: "Post not found" });
        }
      }
    } catch (error) {
      console.error("Failed to fetch post:", error);
      setMessage({ type: "error", text: "Failed to load post" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages(Array.from(e.target.files));
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImagesToRemove([...imagesToRemove, imageId]);
  };

  const handleUndoRemoveImage = (imageId: string) => {
    setImagesToRemove(imagesToRemove.filter((id) => id !== imageId));
  };

  const handleRegenerateContent = async () => {
    try {
      setRegenerating(true);
      setMessage(null);

      const response = await fetch("/api/posts/regenerate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to regenerate content");
      }

      const data = await response.json();

      // Update the form fields with the regenerated content
      setTitle(data.title);
      setContent(data.content);
      setExcerpt(data.excerpt);

      setMessage({
        type: "success",
        text: "Content regenerated successfully! Review and save when ready."
      });
    } catch (error) {
      console.error("Regenerate content error:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to regenerate content"
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Upload new images
      const newImageUrls: string[] = [];
      for (const file of newImages) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          newImageUrls.push(url);
        }
      }

      // Update post
      const response = await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          title,
          content,
          excerpt,
          published,
          newImageUrls,
          removeImageIds: imagesToRemove,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      setMessage({ type: "success", text: "Post updated successfully!" });
      setNewImages([]);
      setImagesToRemove([]);

      // Refresh post data
      await fetchPost();

      setTimeout(() => {
        router.push("/admin/posts");
      }, 2000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update post" });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !post) {
    return null;
  }

  return (
    <AdminLayout maxWidth="4xl">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Posts", href: "/admin/posts" },
              { label: "Edit Post", href: `/admin/posts/edit/${postId}` },
            ]}
          />
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

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Post Type Badge */}
          <div>
            <span
              className={`px-3 py-1 rounded-full font-semibold text-sm ${
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
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange bg-white text-gray-900"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange bg-white text-gray-900"
            />
          </div>

          {/* Regenerate Content Button (only for RELEASE posts) */}
          {post.type === "RELEASE" && (
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-grow">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  AI Content Regeneration
                </p>
                <p className="text-xs text-gray-600">
                  Use AI to regenerate the title, excerpt, and content based on the current release data
                </p>
              </div>
              <button
                onClick={handleRegenerateContent}
                disabled={regenerating}
                className="px-4 py-2 bg-gradient-to-r from-footy-orange to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
              >
                {regenerating ? "Regenerating..." : "🔄 Regenerate Content"}
              </button>
            </div>
          )}

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Content
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Edit your post content..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Use the toolbar to format text, add headings, lists, links, and images.
            </p>
          </div>

          {/* Current Images */}
          {post.images.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Current Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {post.images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative group ${
                      imagesToRemove.includes(image.id) ? "opacity-50" : ""
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.caption || "Post image"}
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {imagesToRemove.includes(image.id) ? (
                      <button
                        onClick={() => handleUndoRemoveImage(image.id)}
                        className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRemoveImage(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Add New Images
            </label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.gif"
              onChange={handleImageFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange bg-white text-gray-900"
            />
            {newImages.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {newImages.length} new image(s) selected
              </p>
            )}
          </div>

          {/* Published Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-5 h-5 text-footy-green rounded focus:ring-2 focus:ring-footy-orange"
            />
            <label htmlFor="published" className="text-sm font-semibold text-gray-900">
              Published
            </label>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-grow bg-gradient-to-r from-footy-green to-green-700 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => router.push("/admin/posts")}
              className="px-6 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
    </AdminLayout>
  );
}
