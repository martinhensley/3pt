"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { generateReleaseSlug } from "@/lib/slugGenerator";

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
  description: string;
}

export default function CreateReleasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [regeneratingDescription, setRegeneratingDescription] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [releaseFiles, setReleaseFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = useState<ReleaseAnalysisResult | null>(null);

  // Editable release fields
  const [editedManufacturer, setEditedManufacturer] = useState("");
  const [editedReleaseName, setEditedReleaseName] = useState("");
  const [editedYear, setEditedYear] = useState("");
  const [editedReleaseDate, setEditedReleaseDate] = useState("");
  const [editedSets, setEditedSets] = useState<SetInfo[]>([]);

  // Editable post fields
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Auto-trigger analysis when files are uploaded
  useEffect(() => {
    if (releaseFiles.length > 0 && !analysisResult && !loading) {
      handleAnalyze();
    }
  }, [releaseFiles]);

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

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setMessage(null);

      // Validate inputs
      if (releaseFiles.length === 0) {
        setMessage({ type: "error", text: "Please provide at least one file" });
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

      const allFiles = uploadedFileData;

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
      // Format title as "Year-Manufacturer-ReleaseName" (e.g., "2024-25 Panini Obsidian Soccer")
      const formattedTitle = analysis.year && analysis.manufacturer
        ? `${analysis.year} ${analysis.manufacturer} ${analysis.releaseName}`
        : analysis.releaseName;
      setEditedTitle(formattedTitle);
      setEditedDescription(analysis.description);

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

  const handleRegenerateDescription = async () => {
    if (!analysisResult) return;

    try {
      setRegeneratingDescription(true);

      // Re-analyze to get a new description
      const response = await fetch("/api/analyze/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: [], // We're regenerating based on existing analysis
          createDatabaseRecords: false,
          regenerateDescription: true,
          analysisData: {
            manufacturer: editedManufacturer,
            releaseName: editedReleaseName,
            year: editedYear,
            sets: editedSets,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate description");
      }

      const result = await response.json();
      setEditedDescription(result.description || result.analysisData?.description || "");

      setMessage({
        type: "success",
        text: "Description regenerated successfully!",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to regenerate description"
      });
      console.error(error);
    } finally {
      setRegeneratingDescription(false);
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

    // Check if first line is a header (contains common header keywords)
    let startIndex = 0;
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('card_number') || firstLine.includes('player') ||
          firstLine.includes('subject') || firstLine.includes('number') ||
          firstLine.includes('name')) {
        startIndex = 1; // Skip header row
      }
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      // Skip lines that don't start with a number or are section headers
      if (!/^\d/.test(line.trim())) {
        continue;
      }

      let cardNumber = '';
      let playerName = '';
      let team = '';

      // Try CSV format first: "1,Player Name,Team"
      if (line.includes(',')) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
          cardNumber = parts[0];
          playerName = parts[1];
          team = parts[2] || '';

          if (cardNumber && playerName) {
            cards.push({
              cardNumber,
              playerName,
              team: team || undefined,
              setName,
            });
            continue;
          }
        }
      }

      // Try space-separated format: "1 Player Name, Team"
      const match = line.match(/^(\d+)\.?\s+([^,]+)(?:,\s*(.+))?/);
      if (match) {
        const [, num, name, tm] = match;
        cards.push({
          cardNumber: num.trim(),
          playerName: name.trim(),
          team: tm?.trim(),
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

      // Generate slug from manufacturer + name + year
      const slug = generateReleaseSlug(editedManufacturer, editedReleaseName, editedYear);

      // Create database records with edited values including excerpt, content, and slug
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
            releaseDate: editedReleaseDate || null,
            sets: editedSets,
            slug,
            description: editedDescription,
          },
        }),
      });

      if (!dbResponse.ok) {
        const errorText = await dbResponse.text();
        console.error("Database creation failed:", errorText);
        throw new Error("Failed to create database records");
      }

      const dbResult = await dbResponse.json();
      console.log("Database result:", dbResult);
      const releaseId = dbResult.createdRecords?.release?.id;

      if (!releaseId) {
        console.error("No release ID in response. Full result:", JSON.stringify(dbResult, null, 2));
        throw new Error(`No release ID returned. Response: ${JSON.stringify(dbResult)}`);
      }

      // Upload images to ReleaseImage (from dedicated image upload field)
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();

          // Create ReleaseImage record
          await fetch("/api/release-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              releaseId,
              url,
              order: i,
              caption: null,
            }),
          });
        }
      }

      setMessage({
        type: "success",
        text: `Release created successfully with ${analysisResult.sets?.length || 0} sets! Slug: ${slug}`,
      });

      // Clear form
      setAnalysisResult(null);
      setReleaseFiles([]);
      setImageFiles([]);
      setEditedManufacturer("");
      setEditedReleaseName("");
      setEditedYear("");
      setEditedReleaseDate("");
      setEditedSets([]);
      setEditedTitle("");
      setEditedDescription("");

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
      <AdminLayout maxWidth="4xl">
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
    <AdminLayout maxWidth="4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="text-footy-green hover:underline mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-footy-green mb-2">
            Create Release & Set(s)
          </h1>
          <p className="text-gray-600">
            Upload documents to analyze and create a new release with sets
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

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Document Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Upload Documents for Analysis (PDFs, CSVs, etc.)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.csv,.html,.htm"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange bg-white text-gray-900"
            />
            {releaseFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-gray-700">
                  Documents to analyze:
                </p>
                {releaseFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Upload Set Images (JPG, PNG, WebP)
            </label>
            <p className="text-xs text-gray-600 mb-2">
              These images will be displayed in the post
            </p>
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
                  Images for post:
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

          {/* Analyze Button */}
          {!analysisResult && (
            <button
              onClick={handleAnalyze}
              disabled={loading || releaseFiles.length === 0}
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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Release Information
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-gray-900 mb-1">
                    Manufacturer:
                  </label>
                  <input
                    type="text"
                    value={editedManufacturer}
                    onChange={(e) => setEditedManufacturer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Panini, Topps, Upper Deck"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-900 mb-1">
                      Year:
                    </label>
                    <input
                      type="text"
                      value={editedYear}
                      onChange={(e) => setEditedYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2024 or 2024-25"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-900 mb-1">
                      Release Name:
                    </label>
                    <input
                      type="text"
                      value={editedReleaseName}
                      onChange={(e) => setEditedReleaseName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Donruss Soccer, Select, Prizm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-gray-900 mb-1">
                    Release Date (Optional):
                  </label>
                  <input
                    type="date"
                    value={editedReleaseDate}
                    onChange={(e) => setEditedReleaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Official release date for display on homepage (leave empty if unknown)
                  </p>
                </div>
                <div className="pt-2 border-t border-blue-300">
                  <p className="text-gray-800">
                    <span className="font-semibold">Full Release:</span> {editedYear} {editedReleaseName}
                  </p>
                </div>
                <p className="text-gray-800">
                  <span className="font-semibold">Sets Detected:</span> {editedSets.length}
                </p>
                <p>
                  <span className="font-semibold">Total Cards Extracted:</span>{" "}
                  {editedSets.reduce((sum, set) => sum + (set.cards?.length || 0), 0)}
                </p>
                <div className="mt-3 pt-3 border-t border-blue-300">
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
                      {editedSets.map((set, idx) => {
                        return (
                        <li key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <input
                              type="text"
                              value={set.name}
                              onChange={(e) => handleUpdateSet(idx, "name", e.target.value)}
                              placeholder="Set Name (e.g., Base Set, Optic)"
                              className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-300 rounded bg-white text-gray-900 focus:ring-1 focus:ring-blue-500"
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
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:ring-1 focus:ring-blue-500 mb-2"
                          />
                          <textarea
                            value={set.description || ""}
                            onChange={(e) => handleUpdateSet(idx, "description", e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:ring-1 focus:ring-blue-500 mb-2"
                          />

                          {/* Checklist Upload/Paste Section */}
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
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
                                  <div className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 cursor-pointer text-center transition-colors">
                                    Upload File (TXT, CSV, PDF)
                                  </div>
                                </label>
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-blue-600 hover:underline">
                                  Or paste checklist text
                                </summary>
                                <textarea
                                  placeholder="Paste checklist here (e.g., &apos;1 Player Name, Team&apos;)"
                                  rows={4}
                                  onChange={(e) => {
                                    if (e.target.value.trim()) {
                                      handleChecklistPaste(idx, e.target.value);
                                      e.target.value = ''; // Clear after processing
                                    }
                                  }}
                                  className="w-full px-2 py-1 mt-2 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:ring-1 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Format: &quot;1 Kylian Mbappe, France&quot; (one per line)
                                </p>
                              </details>
                            </div>
                          </div>

                          {set.cards && set.cards.length > 0 && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs font-semibold text-green-700">
                                    Checklist loaded: {set.cards.length} cards
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleClearChecklist(idx)}
                                  className="px-2 py-0.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                                  title="Clear checklist"
                                >
                                  Clear
                                </button>
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-green-600 hover:underline">
                                  View cards
                                </summary>
                                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                  {set.cards.map((card, cardIdx) => (
                                    <div key={cardIdx} className="text-xs text-gray-700">
                                      #{card.cardNumber} {card.playerName}
                                      {card.team && ` (${card.team})`}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}

                          {/* Parallels/Variations Upload/Paste Section */}
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
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
                                  <div className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 cursor-pointer text-center transition-colors">
                                    Upload File (TXT, CSV)
                                  </div>
                                </label>
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-blue-600 hover:underline">
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
                                  className="w-full px-2 py-1 mt-2 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:ring-1 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Format: &quot;Gold – /10&quot; or &quot;Black – 1/1&quot; (one per line)
                                </p>
                              </details>
                            </div>
                          </div>

                          {set.features && set.features.length > 0 && (
                            <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-purple-700">
                                    Parallels loaded: {set.features.length}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleClearParallels(idx)}
                                  className="px-2 py-0.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                                  title="Clear parallels"
                                >
                                  Clear
                                </button>
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-purple-600 hover:underline">
                                  View parallels
                                </summary>
                                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                  {set.features.map((parallel, parallelIdx) => (
                                    <div key={parallelIdx} className="text-xs text-gray-700">
                                      • {parallel}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                        </li>
                      );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No sets detected. Click &quot;Add Set&quot; to manually add sets.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Editable Release Content */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-footy-green to-green-700 px-8 py-6">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Release Content
                </h3>
                <p className="text-white/90 text-sm mt-2">
                  AI-generated content ready for your review. Edit as needed before publishing.
                </p>
              </div>

              <div className="p-8 space-y-8">
                {/* Title */}
                <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      T
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900">
                        Release Title
                      </label>
                      <p className="text-xs text-gray-500">
                        Format: Year Manufacturer Release Name (e.g., &quot;2024-25 Panini Obsidian Soccer&quot;)
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange focus:border-transparent bg-white text-gray-900 transition-all"
                    placeholder="e.g., 2024-25 Panini Obsidian Soccer"
                  />
                </div>

                {/* Description */}
                <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        D
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900">
                          Description
                        </label>
                        <p className="text-xs text-gray-500">
                          1-5 sentence summary displayed in previews
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRegenerateDescription}
                      disabled={regeneratingDescription || !analysisResult}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {regeneratingDescription ? "Regenerating..." : "AI Regenerate"}
                    </button>
                  </div>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-orange focus:border-transparent bg-white text-gray-900 transition-all"
                    placeholder="A concise summary that captures the essence of this release..."
                  />
                  <div className="mt-2 flex justify-end">
                    <span className="text-xs text-gray-500">
                      {editedDescription?.length || 0} characters
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Create Release Button */}
            <button
              onClick={handleCreateRelease}
              disabled={loading || !editedTitle?.trim() || !editedDescription?.trim()}
              className="w-full bg-gradient-to-r from-footy-orange to-orange-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Creating Release..." : "Create Release"}
            </button>
          </div>
        )}
    </AdminLayout>
  );
}
