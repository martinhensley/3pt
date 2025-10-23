"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";

interface CardInfo {
  playerName: string;
  team?: string;
  cardNumber: string;
  variant?: string;
  setName?: string;
}

interface SetInfo {
  name: string;
  description?: string;
  totalCards?: string;
  features?: string[];
  cards?: CardInfo[];
}

interface ReleaseAnalysisResult {
  manufacturer: string;
  releaseName: string;
  year: string;
  sets: SetInfo[];
  features: string[];
  title: string;
  content: string;
  excerpt: string;
}

export default function CreateReleasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [releaseFiles, setReleaseFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [releaseUrls, setReleaseUrls] = useState<string[]>([""]);
  const [analysisResult, setAnalysisResult] = useState<ReleaseAnalysisResult | null>(null);

  // Editable release fields
  const [editedManufacturer, setEditedManufacturer] = useState("");
  const [editedReleaseName, setEditedReleaseName] = useState("");
  const [editedYear, setEditedYear] = useState("");
  const [editedSets, setEditedSets] = useState<SetInfo[]>([]);

  // Editable post fields
  const [editedTitle, setEditedTitle] = useState("");
  const [editedExcerpt, setEditedExcerpt] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [contentViewMode, setContentViewMode] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReleaseFiles(Array.from(e.target.files));
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setReleaseFiles(releaseFiles.filter((_, i) => i !== index));
  };

  const removeImageFile = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...releaseUrls];
    newUrls[index] = value;
    setReleaseUrls(newUrls);
  };

  const addUrlField = () => {
    setReleaseUrls([...releaseUrls, ""]);
  };

  const removeUrlField = (index: number) => {
    setReleaseUrls(releaseUrls.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setMessage(null);

      // Validate inputs
      const validUrls = releaseUrls.filter(url => url.trim());
      if (releaseFiles.length === 0 && validUrls.length === 0) {
        setMessage({ type: "error", text: "Please provide at least one file or URL" });
        return;
      }

      // Upload files
      const uploadedFileData: Array<{ url: string; type: string }> = [];
      for (const file of releaseFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          const ext = file.name.split(".").pop()?.toLowerCase();
          let type = "pdf";
          if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) type = "image";
          else if (ext === "pdf") type = "pdf";
          else if (ext === "csv") type = "csv";
          else if (ext === "html" || ext === "htm") type = "html";

          uploadedFileData.push({ url, type });
        }
      }

      // Combine URLs and uploaded files
      const allFiles = [
        ...validUrls.map(url => ({ url, type: "html" })),
        ...uploadedFileData
      ];

      // Analyze
      const response = await fetch("/api/analyze/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: allFiles,
          createDatabaseRecords: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Failed to analyze release");
      }

      const analysis = await response.json();
      setAnalysisResult(analysis);

      // Populate editable release fields
      setEditedManufacturer(analysis.manufacturer);
      setEditedReleaseName(analysis.releaseName);
      setEditedYear(analysis.year);
      setEditedSets(analysis.sets || []);

      // Populate editable post fields with AI-generated content
      // Format title as "Year Release Name" (e.g., "2024-25 Donruss Soccer")
      const formattedTitle = analysis.year
        ? `${analysis.year} ${analysis.releaseName}`
        : analysis.releaseName;
      setEditedTitle(formattedTitle);
      setEditedExcerpt(analysis.excerpt);
      setEditedContent(analysis.content);

      setMessage({
        type: "success",
        text: "Release analyzed successfully! Review and edit the content below before publishing.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to analyze release" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Set management functions
  const handleAddSet = () => {
    const newSet: SetInfo = {
      name: "",
      description: "",
      totalCards: "",
      features: [],
      cards: [],
    };
    setEditedSets([...editedSets, newSet]);
  };

  const handleUpdateSet = (index: number, field: keyof SetInfo, value: string) => {
    const updatedSets = [...editedSets];
    if (field === "name" || field === "description" || field === "totalCards") {
      updatedSets[index] = { ...updatedSets[index], [field]: value };
      setEditedSets(updatedSets);
    }
  };

  const handleRemoveSet = (index: number) => {
    const updatedSets = editedSets.filter((_, i) => i !== index);
    setEditedSets(updatedSets);
  };

  const parseChecklistText = (text: string, setName: string): CardInfo[] => {
    const cards: CardInfo[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Match pattern: "1 Kylian Mbappe, France" or "1. Kylian Mbappe, France"
      const match = line.match(/^(\d+)\.?\s+([^,]+)(?:,\s*(.+))?/);
      if (match) {
        const [, cardNumber, playerName, team] = match;
        cards.push({
          cardNumber: cardNumber.trim(),
          playerName: playerName.trim(),
          team: team?.trim(),
          setName: setName,
        });
      }
    }

    return cards;
  };

  const handleChecklistUpload = async (index: number, file: File) => {
    try {
      const text = await file.text();
      const setName = editedSets[index].name || `Set ${index + 1}`;
      const cards = parseChecklistText(text, setName);

      const updatedSets = [...editedSets];
      updatedSets[index] = {
        ...updatedSets[index],
        cards: cards,
        totalCards: String(cards.length),
      };
      setEditedSets(updatedSets);
    } catch (error) {
      console.error("Failed to parse checklist file:", error);
      alert("Failed to parse checklist file. Please check the format.");
    }
  };

  const handleChecklistPaste = (index: number, text: string) => {
    const setName = editedSets[index].name || `Set ${index + 1}`;
    const cards = parseChecklistText(text, setName);

    const updatedSets = [...editedSets];
    updatedSets[index] = {
      ...updatedSets[index],
      cards: cards,
      totalCards: String(cards.length),
    };
    setEditedSets(updatedSets);
  };

  const handleClearChecklist = (index: number) => {
    const updatedSets = [...editedSets];
    updatedSets[index] = {
      ...updatedSets[index],
      cards: [],
    };
    setEditedSets(updatedSets);
  };

  const parseParallelsText = (text: string): string[] => {
    const parallels: string[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Clean up the line and add to parallels
      const cleaned = line.trim();
      if (cleaned) {
        parallels.push(cleaned);
      }
    }

    return parallels;
  };

  const handleParallelsUpload = async (index: number, file: File) => {
    try {
      const text = await file.text();
      const parallels = parseParallelsText(text);

      const updatedSets = [...editedSets];
      updatedSets[index] = {
        ...updatedSets[index],
        features: parallels,
      };
      setEditedSets(updatedSets);
    } catch (error) {
      console.error("Failed to parse parallels file:", error);
      alert("Failed to parse parallels file. Please check the format.");
    }
  };

  const handleParallelsPaste = (index: number, text: string) => {
    const parallels = parseParallelsText(text);

    const updatedSets = [...editedSets];
    updatedSets[index] = {
      ...updatedSets[index],
      features: parallels,
    };
    setEditedSets(updatedSets);
  };

  const handleClearParallels = (index: number) => {
    const updatedSets = [...editedSets];
    updatedSets[index] = {
      ...updatedSets[index],
      features: [],
    };
    setEditedSets(updatedSets);
  };

  const handleCreateRelease = async () => {
    if (!analysisResult) return;

    try {
      setLoading(true);

      // Create database records with edited values
      const dbResponse = await fetch("/api/analyze/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: [],
          createDatabaseRecords: true,
          analysisData: {
            ...analysisResult,
            manufacturer: editedManufacturer,
            releaseName: editedReleaseName,
            year: editedYear,
            sets: editedSets,
          },
        }),
      });

      if (!dbResponse.ok) {
        throw new Error("Failed to create database records");
      }

      const dbResult = await dbResponse.json();
      const releaseId = dbResult.createdRecords?.release?.id;

      if (!releaseId) {
        throw new Error("No release ID returned");
      }

      // Upload images (from dedicated image upload field)
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

      // Create post using edited values
      const postResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          excerpt: editedExcerpt,
          type: "RELEASE",
          imageUrls,
          published: false,
          releaseId,
        }),
      });

      if (!postResponse.ok) {
        throw new Error("Failed to create post");
      }

      const post = await postResponse.json();

      setMessage({
        type: "success",
        text: `Release created successfully with ${analysisResult.sets?.length || 0} sets! Post ID: ${post.id}`,
      });

      // Clear form
      setAnalysisResult(null);
      setReleaseFiles([]);
      setImageFiles([]);
      setReleaseUrls([""]);
      setEditedManufacturer("");
      setEditedReleaseName("");
      setEditedYear("");
      setEditedSets([]);
      setEditedTitle("");
      setEditedExcerpt("");
      setEditedContent("");

      setTimeout(() => {
        router.push("/admin");
      }, 3000);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to create release" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="text-footy-green dark:text-footy-orange hover:underline mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-footy-green dark:text-footy-orange mb-2">
            Create Release
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload documents to analyze and create a new release with sets
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          {/* Document Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Upload Documents for Analysis (PDFs, CSVs, etc.)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.csv,.html,.htm"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-footy-orange bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {releaseFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Documents to analyze:
                </p>
                {releaseFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
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

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Upload Set Images (JPG, PNG, WebP)
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              These images will be displayed in the post
            </p>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.gif"
              onChange={handleImageFileChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-footy-orange bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {imageFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Images for post:
                </p>
                {imageFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
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

          {/* URL Inputs */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Or Enter URLs
            </label>
            {releaseUrls.map((url, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder="https://example.com/release-info"
                  className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-footy-orange bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {releaseUrls.length > 1 && (
                  <button
                    onClick={() => removeUrlField(index)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addUrlField}
              className="text-footy-orange hover:underline text-sm"
            >
              + Add another URL
            </button>
          </div>

          {/* Analyze Button */}
          {!analysisResult && (
            <button
              onClick={handleAnalyze}
              disabled={loading || (releaseFiles.length === 0 && releaseUrls.filter(u => u.trim()).length === 0)}
              className="w-full bg-gradient-to-r from-footy-green to-green-700 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Analyzing..." : "Analyze Documents"}
            </button>
          )}
        </div>

        {/* Analysis Result & Editable Form */}
        {analysisResult && (
          <div className="mt-6 space-y-6">
            {/* Release Information Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                Release Information
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Manufacturer:
                  </label>
                  <input
                    type="text"
                    value={editedManufacturer}
                    onChange={(e) => setEditedManufacturer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Panini, Topps, Upper Deck"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Year:
                    </label>
                    <input
                      type="text"
                      value={editedYear}
                      onChange={(e) => setEditedYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2024 or 2024-25"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Release Name:
                    </label>
                    <input
                      type="text"
                      value={editedReleaseName}
                      onChange={(e) => setEditedReleaseName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Donruss Soccer, Select, Prizm"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-300 dark:border-blue-700">
                  <p className="text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">Full Release:</span> {editedYear} {editedReleaseName}
                  </p>
                </div>
                <p className="text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">Sets Detected:</span> {editedSets.length}
                </p>
                <p>
                  <span className="font-semibold">Total Cards Extracted:</span>{" "}
                  {editedSets.reduce((sum, set) => sum + (set.cards?.length || 0), 0)}
                </p>
                <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold">Sets Breakdown:</p>
                    <button
                      type="button"
                      onClick={handleAddSet}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Set
                    </button>
                  </div>
                  {editedSets.length > 0 ? (
                    <ul className="list-none space-y-3">
                      {editedSets.map((set, idx) => (
                        <li key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <input
                              type="text"
                              value={set.name}
                              onChange={(e) => handleUpdateSet(idx, "name", e.target.value)}
                              placeholder="Set Name (e.g., Base Set, Optic)"
                              className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(idx)}
                              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                              title="Remove set"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <input
                            type="text"
                            value={set.totalCards || ""}
                            onChange={(e) => handleUpdateSet(idx, "totalCards", e.target.value)}
                            placeholder="Total Cards (optional)"
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 mb-2"
                          />
                          <textarea
                            value={set.description || ""}
                            onChange={(e) => handleUpdateSet(idx, "description", e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 mb-2"
                          />

                          {/* Checklist Upload/Paste Section */}
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Add Checklist (optional):
                            </p>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <label className="flex-1">
                                  <input
                                    type="file"
                                    accept=".txt,.csv,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleChecklistUpload(idx, file);
                                    }}
                                    className="hidden"
                                  />
                                  <div className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 cursor-pointer text-center transition-colors">
                                    Upload File (TXT, CSV, PDF)
                                  </div>
                                </label>
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                                  Or paste checklist text
                                </summary>
                                <textarea
                                  placeholder="Paste checklist here (e.g., '1 Player Name, Team')"
                                  rows={4}
                                  onChange={(e) => {
                                    if (e.target.value.trim()) {
                                      handleChecklistPaste(idx, e.target.value);
                                      e.target.value = ''; // Clear after processing
                                    }
                                  }}
                                  className="w-full px-2 py-1 mt-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Format: &quot;1 Kylian Mbappe, France&quot; (one per line)
                                </p>
                              </details>
                            </div>
                          </div>

                          {set.cards && set.cards.length > 0 && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                                    Checklist loaded: {set.cards.length} cards
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleClearChecklist(idx)}
                                  className="px-2 py-0.5 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded transition-colors"
                                  title="Clear checklist"
                                >
                                  Clear
                                </button>
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-green-600 dark:text-green-400 hover:underline">
                                  View cards
                                </summary>
                                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                  {set.cards.map((card, cardIdx) => (
                                    <div key={cardIdx} className="text-xs text-gray-700 dark:text-gray-300">
                                      #{card.cardNumber} {card.playerName}
                                      {card.team && ` (${card.team})`}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}

                          {/* Parallels/Variations Upload/Paste Section */}
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Add Parallels/Variations (optional):
                            </p>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <label className="flex-1">
                                  <input
                                    type="file"
                                    accept=".txt,.csv"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleParallelsUpload(idx, file);
                                    }}
                                    className="hidden"
                                  />
                                  <div className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 cursor-pointer text-center transition-colors">
                                    Upload File (TXT, CSV)
                                  </div>
                                </label>
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                                  Or paste parallels text
                                </summary>
                                <textarea
                                  placeholder="Paste parallels here (one per line)"
                                  rows={4}
                                  onChange={(e) => {
                                    if (e.target.value.trim()) {
                                      handleParallelsPaste(idx, e.target.value);
                                      e.target.value = ''; // Clear after processing
                                    }
                                  }}
                                  className="w-full px-2 py-1 mt-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Format: &quot;Gold – /10&quot; or &quot;Black – 1/1&quot; (one per line)
                                </p>
                              </details>
                            </div>
                          </div>

                          {set.features && set.features.length > 0 && (
                            <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                    Parallels loaded: {set.features.length}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleClearParallels(idx)}
                                  className="px-2 py-0.5 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded transition-colors"
                                  title="Clear parallels"
                                >
                                  Clear
                                </button>
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-purple-600 dark:text-purple-400 hover:underline">
                                  View parallels
                                </summary>
                                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                  {set.features.map((parallel, parallelIdx) => (
                                    <div key={parallelIdx} className="text-xs text-gray-700 dark:text-gray-300">
                                      • {parallel}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No sets detected. Click &quot;Add Set&quot; to manually add sets.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Editable Post Content */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-footy-green to-green-700 dark:from-footy-orange dark:to-orange-700 px-8 py-6">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Review & Edit Post Content
                </h3>
                <p className="text-white/90 text-sm mt-2">
                  AI-generated content ready for your review. Edit as needed before publishing.
                </p>
              </div>

              <div className="p-8 space-y-8">
                {/* Title */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      T
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white">
                        Post Title
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Format: Year Release Name (e.g., "2024-25 Donruss Soccer")
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-footy-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    placeholder="e.g., 2024-25 Donruss Soccer"
                  />
                </div>

                {/* Excerpt */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                      E
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white">
                        Excerpt
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        1-2 sentence summary displayed in previews
                      </p>
                    </div>
                  </div>
                  <textarea
                    value={editedExcerpt}
                    onChange={(e) => setEditedExcerpt(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-footy-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    placeholder="A concise summary that captures the essence of this release..."
                  />
                  <div className="mt-2 flex justify-end">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {editedExcerpt.length} characters
                    </span>
                  </div>
                </div>

                {/* Content with Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-6 pt-6 pb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                      C
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white">
                        Post Content (HTML)
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Full article content with HTML formatting
                      </p>
                    </div>
                  </div>

                  {/* Tabs for Edit/Preview */}
                  <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setContentViewMode('edit')}
                        className={`px-4 py-2 font-semibold text-sm transition-all ${
                          contentViewMode === 'edit'
                            ? 'border-b-2 border-footy-orange text-footy-orange'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                      >
                        📝 Edit HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setContentViewMode('preview')}
                        className={`px-4 py-2 font-semibold text-sm transition-all ${
                          contentViewMode === 'preview'
                            ? 'border-b-2 border-footy-orange text-footy-orange'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                      >
                        👁️ Preview
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {contentViewMode === 'edit' ? (
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={20}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-footy-orange focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm leading-relaxed transition-all"
                        placeholder="<p>Your HTML content here...</p>"
                      />
                    ) : (
                      <div
                        className="prose prose-lg max-w-none prose-headings:text-footy-green dark:prose-headings:text-footy-orange prose-a:text-footy-orange prose-strong:text-footy-green dark:prose-strong:text-footy-orange dark:prose-invert min-h-[400px] p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                        dangerouslySetInnerHTML={{ __html: editedContent }}
                      />
                    )}
                  </div>

                  <div className="px-6 pb-4 flex justify-end">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {editedContent.length} characters
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Release Button */}
            <button
              onClick={handleCreateRelease}
              disabled={loading || !editedTitle.trim() || !editedExcerpt.trim() || !editedContent.trim()}
              className="w-full bg-gradient-to-r from-footy-orange to-orange-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Creating Release..." : "Create Release & Post"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
