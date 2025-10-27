"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import AdminHeader from "@/components/AdminHeader";
import RichTextEditor from "@/components/RichTextEditor";

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [type, setType] = useState<"NEWS" | "REVIEW" | "GUIDE" | "ANALYSIS" | "GENERAL">("NEWS");
  const [published, setPublished] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // GenAI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiImages, setAiImages] = useState<File[]>([]);
  const [generatingContent, setGeneratingContent] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const removeImageFile = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleAiImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAiImages(Array.from(e.target.files));
    }
  };

  const removeAiImage = (index: number) => {
    setAiImages(aiImages.filter((_, i) => i !== index));
  };

  const handleGenerateContent = async () => {
    try {
      setGeneratingContent(true);
      setMessage(null);

      if (!aiPrompt.trim() && aiImages.length === 0) {
        setMessage({ type: "error", text: "Please provide a text prompt or upload images" });
        return;
      }

      // Prepare multimodal input
      const formData = new FormData();
      formData.append("prompt", aiPrompt);
      formData.append("postType", type);

      // Add images
      aiImages.forEach((file) => {
        formData.append("images", file);
      });

      // Call the API
      const response = await fetch("/api/posts/generate-content", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const data = await response.json();

      // Populate the form with generated content
      setTitle(data.title || "");
      setContent(data.content || "");
      setExcerpt(data.excerpt || "");

      setMessage({ type: "success", text: "Content generated successfully! Review and edit as needed." });

      // Clear AI input fields
      setAiPrompt("");
      setAiImages([]);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to generate content"
      });
      console.error(error);
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setMessage(null);

      // Validate required fields
      if (!title.trim() || !content.trim() || !excerpt.trim()) {
        setMessage({ type: "error", text: "Title, summary, and content are required" });
        return;
      }

      // Upload images
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          imageUrls.push(url);
        }
      }

      // Create post
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || null,
          type,
          published,
          imageUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      setMessage({ type: "success", text: "Post created successfully!" });

      // Clear form
      setTitle("");
      setContent("");
      setExcerpt("");
      setType("NEWS");
      setPublished(false);
      setImageFiles([]);

      setTimeout(() => {
        router.push("/admin/posts");
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create post"
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <AdminLayout maxWidth="4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/posts")}
            className="text-footy-green hover:underline mb-4 flex items-center gap-2"
          >
            ← Back to Posts
          </button>
          <h1 className="text-3xl font-bold text-footy-green mb-2">
            Create Post
          </h1>
          <p className="text-gray-600">
            Create a new blog post or article
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

        {/* AI Content Generator */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">AI Content Generator</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Use AI to generate post content from text descriptions or images. The generated content will populate the form below for you to review and edit.
          </p>

          <div className="space-y-4">
            {/* Post Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Post Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "NEWS" | "REVIEW" | "GUIDE" | "ANALYSIS" | "GENERAL")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                disabled={generatingContent}
              >
                <option value="NEWS">News</option>
                <option value="REVIEW">Review</option>
                <option value="GUIDE">Guide</option>
                <option value="ANALYSIS">Analysis</option>
                <option value="GENERAL">General</option>
              </select>
            </div>

            {/* AI Prompt Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Text Prompt (Optional)
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                placeholder="Describe the post you want to create (e.g., 'Write about Panini Prizm 2024 soccer cards featuring Messi')"
                disabled={generatingContent}
              />
            </div>

            {/* AI Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Reference Images (Optional)
              </label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
                onChange={handleAiImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                disabled={generatingContent}
              />
              {aiImages.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Selected images:
                  </p>
                  {aiImages.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeAiImage(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        disabled={generatingContent}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateContent}
              disabled={generatingContent || (!aiPrompt.trim() && aiImages.length === 0)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {generatingContent ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Content...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Content with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange bg-white text-gray-900"
              placeholder="Enter post title"
              required
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange bg-white text-gray-900"
              placeholder="Brief summary of the post"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your post content..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Use the toolbar to format text, add headings, lists, links, and images.
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Images (Optional)
            </label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.gif"
              onChange={handleImageFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange bg-white text-gray-900"
            />
            {imageFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-gray-700">
                  Selected images:
                </p>
                {imageFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeImageFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-footy-orange focus:ring-footy-orange border-gray-300 rounded"
            />
            <label htmlFor="published" className="text-sm font-semibold text-gray-900">
              Publish immediately
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim() || !excerpt.trim()}
            className="w-full bg-gradient-to-r from-footy-green to-green-700 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? "Creating Post..." : "Create Post"}
          </button>
        </div>
    </AdminLayout>
  );
}
