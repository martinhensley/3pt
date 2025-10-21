"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ReleaseSelect, SetSelect } from "@/components/EntitySelectors";

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

interface SetInfo {
  name: string;
  totalCards?: string;
}

interface SetAnalysisWithCards {
  setName: string;
  totalCards?: string;
  title?: string;
  content?: string;
  excerpt?: string;
  createdRecords?: {
    cardsCreated: number;
  };
  sets?: SetInfo[];
}

interface ReleaseAnalysisResult {
  manufacturer: string;
  releaseName: string;
  year: string;
  sets?: SetInfo[];
  title?: string;
  content?: string;
  excerpt?: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"card" | "set" | "release" | "create" | "manage">("card");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Card form state
  const [cardFrontImage, setCardFrontImage] = useState<File | null>(null);
  const [cardBackImage, setCardBackImage] = useState<File | null>(null);
  const [selectedCardRelease, setSelectedCardRelease] = useState<string>("");
  const [selectedCardSet, setSelectedCardSet] = useState<string>("");

  // Set form state
  const [setFiles, setSetFiles] = useState<File[]>([]);
  const [selectedSetRelease, setSelectedSetRelease] = useState<string>("");
  const [setAnalysisResult, setSetAnalysisResult] = useState<SetAnalysisWithCards | null>(null);

  // Release form state
  const [releaseUrls, setReleaseUrls] = useState<string[]>([""]);
  const [releaseFiles, setReleaseFiles] = useState<File[]>([]);
  const [releaseAnalysisResult, setReleaseAnalysisResult] = useState<ReleaseAnalysisResult | null>(null);

  // Generated post state
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedExcerpt, setEditedExcerpt] = useState("");

  // Manage posts state
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

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
      setMessage({ type: "error", text: "Please upload the front image" });
      return;
    }

    if (!selectedCardSet) {
      setMessage({ type: "error", text: "Please select a set for this card" });
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

      // Analyze card with set context
      const response = await fetch("/api/analyze/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontImageUrl: frontUrl,
          backImageUrl: backUrl || undefined,
          setId: selectedCardSet,
          createDatabaseRecords: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze card");
      }

      const analysis = await response.json();

      if (analysis.createdRecords) {
        setMessage({
          type: "success",
          text: "Card created successfully in the database!",
        });
      }

      // Optionally create blog post
      if (analysis.title && analysis.content) {
        setGeneratedPost({
          ...analysis,
          type: "CARD",
          imageUrls: [frontUrl, backUrl].filter(Boolean)
        });
        setEditedTitle(analysis.title);
        setEditedContent(analysis.content);
        setEditedExcerpt(analysis.excerpt);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to analyze card. Please try again." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for Set file management
  const addSetFile = (file: File) => {
    setSetFiles([...setFiles, file]);
  };

  const removeSetFile = (index: number) => {
    setSetFiles(setFiles.filter((_, i) => i !== index));
  };

  const handleSetAnalysis = async () => {
    if (setFiles.length === 0) {
      setMessage({ type: "error", text: "Please upload at least one file" });
      return;
    }

    if (!selectedSetRelease) {
      setMessage({ type: "error", text: "Please select a release" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Upload all files
      const uploadedFileData: Array<{ url: string; type: string }> = [];
      for (const file of setFiles) {
        const url = await uploadFile(file);
        // Determine file type from extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        let type = "text";
        if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) type = "image";
        else if (ext === "pdf") type = "pdf";
        else if (ext === "csv") type = "csv";
        else if (ext === "html" || ext === "htm") type = "html";

        uploadedFileData.push({ url, type });
      }

      // Analyze set with all documents
      const response = await fetch("/api/analyze/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: uploadedFileData,
          releaseId: selectedSetRelease,
          createDatabaseRecords: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze set");
      }

      const analysis = await response.json();
      setSetAnalysisResult(analysis);

      if (analysis.createdRecords) {
        const cardsMsg = analysis.createdRecords.cardsCreated > 0
          ? ` with ${analysis.createdRecords.cardsCreated} cards`
          : "";
        setMessage({
          type: "success",
          text: `Set "${analysis.setName}" created${cardsMsg}!`,
        });
      }

      // Optionally create blog post
      if (analysis.title && analysis.content) {
        setGeneratedPost({
          ...analysis,
          type: "SET",
          imageUrls: uploadedFileData.map(f => f.url)
        });
        setEditedTitle(analysis.title);
        setEditedContent(analysis.content);
        setEditedExcerpt(analysis.excerpt);
      }
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
        setSetFiles([]);
        setReleaseFiles([]);
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
      // Upload new images
      const uploadedImageUrls: string[] = [];
      for (const file of newImages) {
        const url = await uploadFile(file);
        uploadedImageUrls.push(url);
      }

      const response = await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPost.id,
          title: editingPost.title,
          content: editingPost.content,
          excerpt: editingPost.excerpt,
          published: editingPost.published,
          newImageUrls: uploadedImageUrls,
          removeImageIds: imagesToRemove,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      setMessage({ type: "success", text: "Post updated successfully!" });
      setEditingPost(null);
      setNewImages([]);
      setImagesToRemove([]);
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

  // Helper functions for managing dynamic URL inputs
  const addUrlInput = () => {
    setReleaseUrls([...releaseUrls, ""]);
  };

  const removeUrlInput = (index: number) => {
    if (releaseUrls.length > 1) {
      setReleaseUrls(releaseUrls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const updated = [...releaseUrls];
    updated[index] = value;
    setReleaseUrls(updated);
  };

  // Helper functions for managing file uploads
  const addFile = (file: File) => {
    setReleaseFiles([...releaseFiles, file]);
  };

  const removeFile = (index: number) => {
    setReleaseFiles(releaseFiles.filter((_, i) => i !== index));
  };

  const handleReleaseAnalysis = async () => {
    // Validate that we have at least one URL or file
    const validUrls = releaseUrls.filter(url => url.trim() !== "");
    if (validUrls.length === 0 && releaseFiles.length === 0) {
      setMessage({ type: "error", text: "Please provide at least one URL or upload at least one file" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Upload all files
      const uploadedFileData: Array<{ url: string; type: string }> = [];
      for (const file of releaseFiles) {
        const url = await uploadFile(file);
        // Determine file type from extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        let type = "text";
        if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) type = "image";
        else if (ext === "pdf") type = "pdf";
        else if (ext === "csv") type = "csv";
        else if (ext === "html" || ext === "htm") type = "html";

        uploadedFileData.push({ url, type });
      }

      // Combine URLs and uploaded files
      const allFiles = [
        ...validUrls.map(url => ({ url, type: "html" })),
        ...uploadedFileData
      ];

      // Analyze release with all documents
      const response = await fetch("/api/analyze/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: allFiles,
          createDatabaseRecords: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze release");
      }

      const analysis = await response.json();
      setReleaseAnalysisResult(analysis);

      if (analysis.createdRecords) {
        setMessage({
          type: "success",
          text: `Release "${analysis.releaseName}" created with ${analysis.sets?.length || 0} sets!`,
        });
      }

      // Optionally create blog post if analysis includes title/content
      if (analysis.title && analysis.content) {
        setGeneratedPost({
          ...analysis,
          type: "RELEASE",
          imageUrls: uploadedFileData.map(f => f.url)
        });
        setEditedTitle(analysis.title);
        setEditedContent(analysis.content);
        setEditedExcerpt(analysis.excerpt);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to analyze release. Please try again." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImagesToRemove([...imagesToRemove, imageId]);
  };

  const handleUndoRemoveImage = (imageId: string) => {
    setImagesToRemove(imagesToRemove.filter((id) => id !== imageId));
  };

  const handleAddNewImages = (files: FileList | null) => {
    if (files) {
      setNewImages([...newImages, ...Array.from(files)]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/fa/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-footy-green text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">footy<span className="text-footy-orange">.bot</span> admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-footy-orange">Welcome, {session.user?.name || "Admin"}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-footy-orange text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90"
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
                  ? "text-footy-orange border-b-2 border-footy-orange"
                  : "text-gray-800 hover:text-footy-green"
              }`}
            >
              Analyze Card
            </button>
            <button
              onClick={() => setActiveTab("set")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "set"
                  ? "text-footy-orange border-b-2 border-footy-orange"
                  : "text-gray-800 hover:text-footy-green"
              }`}
            >
              Analyze Set
            </button>
            <button
              onClick={() => setActiveTab("release")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "release"
                  ? "text-footy-orange border-b-2 border-footy-orange"
                  : "text-gray-800 hover:text-footy-green"
              }`}
            >
              Analyze Release
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "create"
                  ? "text-footy-orange border-b-2 border-footy-orange"
                  : "text-gray-800 hover:text-footy-green"
              }`}
            >
              Create Post
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "manage"
                  ? "text-footy-orange border-b-2 border-footy-orange"
                  : "text-gray-800 hover:text-footy-green"
              }`}
            >
              Manage Posts
            </button>
          </div>

          {activeTab === "card" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-footy-green">
                  Analyze Card
                </h2>
                <p className="text-gray-700 mt-2">
                  Upload card images and associate with a set in a release for context-aware AI analysis.
                </p>
              </div>

              {/* Release and Set Selection */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Select Release & Set
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose the release and set that this card belongs to. This provides context for better AI analysis.
                </p>

                <div className="space-y-4">
                  <ReleaseSelect
                    onReleaseSelected={(releaseId) => {
                      setSelectedCardRelease(releaseId);
                      setSelectedCardSet(""); // Reset set selection when release changes
                    }}
                    value={selectedCardRelease}
                    label="Release"
                  />

                  <SetSelect
                    releaseId={selectedCardRelease}
                    onSetSelected={(setId) => setSelectedCardSet(setId)}
                    value={selectedCardSet}
                    label="Set"
                  />
                </div>
              </div>

              {/* Card Images Upload */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Card Images
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload clear images of the card front (required) and back (optional)
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Card Front (Required)
                    </label>
                    <div className="relative">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors border-blue-300">
                        {cardFrontImage ? (
                          <div className="flex flex-col items-center justify-center p-4">
                            <svg className="w-12 h-12 mb-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-gray-900 text-center break-all px-2">
                              {cardFrontImage.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(cardFrontImage.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-600 font-medium">
                              <span className="text-blue-600">Click to upload</span>
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCardFrontImage(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                      {cardFrontImage && (
                        <button
                          type="button"
                          onClick={() => setCardFrontImage(null)}
                          className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Card Back (Optional)
                    </label>
                    <div className="relative">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors border-gray-300">
                        {cardBackImage ? (
                          <div className="flex flex-col items-center justify-center p-4">
                            <svg className="w-12 h-12 mb-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-gray-900 text-center break-all px-2">
                              {cardBackImage.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(cardBackImage.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-600 font-medium">
                              <span className="text-gray-600">Click to upload</span>
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCardBackImage(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                      {cardBackImage && (
                        <button
                          type="button"
                          onClick={() => setCardBackImage(null)}
                          className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleCardAnalysis}
                disabled={loading || !cardFrontImage || !selectedCardSet}
                className="w-full bg-gradient-to-r from-footy-green to-green-700 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Analyze Card & Create Record</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "set" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-footy-green">
                  Analyze Set
                </h2>
                <p className="text-gray-700 mt-2">
                  Upload documents about a specific set within an existing release. Can extract individual cards from checklists.
                </p>
              </div>

              {/* Release Selection */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Select Parent Release
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose the release that this set belongs to
                </p>
                <ReleaseSelect
                  onReleaseSelected={(releaseId) => setSelectedSetRelease(releaseId)}
                  value={selectedSetRelease}
                  label="Release"
                />
              </div>

              {/* File Upload Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Set Documents
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload checklists, sell sheets, PDFs, or images about this set
                </p>

                {/* File Input */}
                <div className="mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-600 font-medium">
                        <span className="text-green-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, CSV, Images (PNG, JPG), HTML, or Text files
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf,.csv,.html,.htm,.txt"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          Array.from(e.target.files).forEach(file => addSetFile(file));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Selected Files Display */}
                {setFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Selected Files ({setFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {setFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {file.type.startsWith("image/") ? (
                                <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              ) : file.name.endsWith(".pdf") ? (
                                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSetFile(index)}
                            className="ml-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis Result Display */}
              {setAnalysisResult && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Analysis Result
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-800">
                      <span className="font-semibold">Set Name:</span> {setAnalysisResult.setName}
                    </p>
                    <p className="text-gray-800">
                      <span className="font-semibold">Total Cards:</span> {setAnalysisResult.totalCards || "Unknown"}
                    </p>
                    {setAnalysisResult.createdRecords && (
                      <p className="text-gray-800">
                        <span className="font-semibold">Cards Extracted:</span> {setAnalysisResult.createdRecords.cardsCreated || 0}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleSetAnalysis}
                disabled={loading || setFiles.length === 0 || !selectedSetRelease}
                className="w-full bg-gradient-to-r from-footy-green to-green-700 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Analyze Set & Create Records</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "release" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-footy-green">
                  Analyze Release
                </h2>
                <p className="text-gray-700 mt-2">
                  Upload multiple documents about a release: PDFs, CSVs, images, or provide URLs to web pages.
                  The system will extract manufacturer, release info, sets, and create database records.
                </p>
              </div>

              {/* URL Inputs Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Web URLs
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter URLs of web pages containing release information (e.g., manufacturer press releases, product pages)
                </p>
                <div className="space-y-3">
                  {releaseUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateUrl(index, e.target.value)}
                        placeholder="https://example.com/release-info"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
                      />
                      {releaseUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUrlInput(index)}
                          className="px-3 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addUrlInput}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another URL
                </button>
              </div>

              {/* File Upload Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Files
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload PDFs, CSVs, images, or other documents containing release information
                </p>

                {/* File Input */}
                <div className="mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-600 font-medium">
                        <span className="text-green-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, CSV, Images (PNG, JPG), HTML, or Text files
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf,.csv,.html,.htm,.txt"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          Array.from(e.target.files).forEach(file => addFile(file));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Selected Files Display */}
                {releaseFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Selected Files ({releaseFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {releaseFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {file.type.startsWith("image/") ? (
                                <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              ) : file.name.endsWith(".pdf") ? (
                                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis Result Display */}
              {releaseAnalysisResult && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Analysis Result
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-800">
                      <span className="font-semibold">Manufacturer:</span> {releaseAnalysisResult.manufacturer}
                    </p>
                    <p className="text-gray-800">
                      <span className="font-semibold">Release:</span> {releaseAnalysisResult.releaseName} ({releaseAnalysisResult.year})
                    </p>
                    <p className="text-gray-800">
                      <span className="font-semibold">Sets Identified:</span> {releaseAnalysisResult.sets?.length || 0}
                    </p>
                    {releaseAnalysisResult.sets && releaseAnalysisResult.sets.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-yellow-300">
                        <p className="font-semibold text-gray-800 mb-2">Sets:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {releaseAnalysisResult.sets.map((set: SetInfo, idx: number) => (
                            <li key={idx}>
                              {set.name} {set.totalCards ? `(${set.totalCards} cards)` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleReleaseAnalysis}
                disabled={loading || (releaseUrls.filter(u => u.trim()).length === 0 && releaseFiles.length === 0)}
                className="w-full bg-gradient-to-r from-footy-green to-green-700 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Analyze Release & Create Records</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "create" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-footy-green">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange text-gray-900"
                />
                <p className="mt-2 text-sm text-gray-600">
                  The more specific you are, the better the AI-generated content will be.
                </p>
              </div>

              <button
                onClick={handleGeneratePost}
                disabled={loading || !createPrompt.trim()}
                className="w-full bg-footy-green text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Post with AI"}
              </button>
            </div>
          )}

          {activeTab === "manage" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-footy-green">
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
                            <h3 className="text-lg font-bold text-footy-green">
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
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-footy-orange text-footy-green">
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
                            onClick={() => {
                              setEditingPost(post);
                              setNewImages([]);
                              setImagesToRemove([]);
                            }}
                            className="px-4 py-2 bg-footy-green text-white rounded hover:opacity-90 text-sm font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleTogglePublished(post)}
                            disabled={loading}
                            className="px-4 py-2 bg-footy-orange text-footy-green rounded hover:opacity-90 text-sm font-semibold disabled:opacity-50"
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
            <h2 className="text-2xl font-bold text-footy-green mb-6">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange font-mono text-sm text-gray-900"
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
                  className="flex-1 bg-footy-orange text-footy-green font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
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
              <h2 className="text-2xl font-bold text-footy-green">
                Edit Post
              </h2>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setNewImages([]);
                  setImagesToRemove([]);
                }}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange font-mono text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Images
                </label>

                {/* Existing Images */}
                {editingPost.images && editingPost.images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {editingPost.images.map((image) => (
                        <div
                          key={image.id}
                          className={`relative border rounded-lg overflow-hidden ${
                            imagesToRemove.includes(image.id)
                              ? "opacity-50 border-red-500"
                              : "border-gray-300"
                          }`}
                        >
                          <div className="relative w-full h-32">
                            <Image
                              src={image.url}
                              alt={image.caption || "Post image"}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 33vw"
                            />
                          </div>
                          {image.caption && (
                            <p className="text-xs text-gray-600 p-2 bg-gray-50">
                              {image.caption}
                            </p>
                          )}
                          <div className="absolute top-2 right-2">
                            {imagesToRemove.includes(image.id) ? (
                              <button
                                type="button"
                                onClick={() => handleUndoRemoveImage(image.id)}
                                className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-green-700"
                              >
                                Undo
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(image.id)}
                                className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {newImages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">New Images to Add</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {newImages.map((file, index) => (
                        <div
                          key={index}
                          className="relative border border-green-300 rounded-lg overflow-hidden"
                        >
                          <div className="relative w-full h-32">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2 bg-green-50">
                            <p className="text-xs text-gray-700 truncate">
                              {file.name}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Images
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleAddNewImages(e.target.files)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    You can select multiple images at once
                  </p>
                </div>
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
                    className="w-4 h-4 text-footy-orange focus:ring-footy-orange"
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    Published
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setNewImages([]);
                    setImagesToRemove([]);
                  }}
                  className="flex-1 bg-gray-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePost}
                  disabled={loading}
                  className="flex-1 bg-footy-green text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
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
