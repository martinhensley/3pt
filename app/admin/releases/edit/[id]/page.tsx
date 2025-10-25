"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";

interface CardInfo {
  id?: string;
  playerName: string;
  team?: string;
  cardNumber: string;
  variant?: string;
  setName?: string;
}

interface SetInfo {
  id?: string;
  name: string;
  description?: string;
  totalCards?: string;
  parallels?: string[];
  cards?: CardInfo[];
  isNew?: boolean;
  isDeleted?: boolean;
}

interface SourceFile {
  url: string;
  filename: string;
  type: string;
}

interface Release {
  id: string;
  name: string;
  year: string;
  description: string | null;
  sourceFiles: SourceFile[] | null;
  manufacturerId: string;
  manufacturer: {
    id: string;
    name: string;
  };
  sets: Array<{
    id: string;
    name: string;
    description: string | null;
    totalCards: string | null;
    parallels: string[] | null;
    cards: Array<{
      id: string;
      playerName: string | null;
      team: string | null;
      cardNumber: string | null;
      variant: string | null;
    }>;
  }>;
}

export default function EditReleasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const releaseId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchingRelease, setFetchingRelease] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [descriptionFile, setDescriptionFile] = useState<File | null>(null);
  const [generatingSetDescription, setGeneratingSetDescription] = useState<number | null>(null);
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Release data
  const [release, setRelease] = useState<Release | null>(null);

  // Editable release fields
  const [editedManufacturer, setEditedManufacturer] = useState("");
  const [editedReleaseName, setEditedReleaseName] = useState("");
  const [editedYear, setEditedYear] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedSets, setEditedSets] = useState<SetInfo[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch release data
  useEffect(() => {
    const fetchRelease = async () => {
      if (!releaseId) return;

      try {
        setFetchingRelease(true);
        const response = await fetch(`/api/releases?id=${releaseId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch release");
        }

        const data: Release = await response.json();
        setRelease(data);

        // Populate editable fields
        setEditedManufacturer(data.manufacturer.name);
        setEditedReleaseName(data.name);
        setEditedYear(data.year);
        setEditedDescription(data.description || "");
        setSourceFiles(data.sourceFiles as SourceFile[] || []);

        // Transform sets data
        const transformedSets: SetInfo[] = data.sets.map((set: { id: string; name: string; description: string | null; totalCards: string | null; parallels: string[] | null; cards: { id: string; playerName: string | null; team: string | null; cardNumber: string | null; variant: string | null }[] }) => ({
          id: set.id,
          name: set.name,
          description: set.description || "",
          totalCards: set.totalCards || "",
          parallels: set.parallels || [],
          cards: set.cards.map((card: { id: string; playerName: string | null; team: string | null; cardNumber: string | null; variant: string | null }) => ({
            id: card.id,
            playerName: card.playerName || "",
            team: card.team || "",
            cardNumber: card.cardNumber || "",
            variant: card.variant || "",
          })),
          isNew: false,
          isDeleted: false,
        }));

        setEditedSets(transformedSets);
      } catch (error) {
        console.error("Failed to fetch release:", error);
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to fetch release"
        });
      } finally {
        setFetchingRelease(false);
      }
    };

    if (status === "authenticated") {
      fetchRelease();
    }
  }, [releaseId, status]);

  // Set management functions
  const handleAddSet = () => {
    const newSet: SetInfo = {
      name: "",
      description: "",
      totalCards: "",
      parallels: [],
      cards: [],
      isNew: true,
      isDeleted: false,
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

  const handleGenerateSetDescription = async (index: number) => {
    const set = editedSets[index];

    // Can only generate for saved sets (not new ones)
    if (!set.id || set.isNew) {
      setMessage({
        type: "error",
        text: "Please save the set first before generating a description"
      });
      return;
    }

    try {
      setGeneratingSetDescription(index);
      setMessage(null);

      const response = await fetch("/api/sets/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId: set.id,
          sellSheetText: "", // Could be populated from a form field if needed
          additionalContext: "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the local state with the generated description
        const updatedSets = [...editedSets];
        updatedSets[index] = { ...updatedSets[index], description: data.description };
        setEditedSets(updatedSets);

        setMessage({
          type: "success",
          text: `Generated description for ${set.name}`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to generate description",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to generate description",
      });
    } finally {
      setGeneratingSetDescription(null);
    }
  };

  const handleRemoveSet = async (index: number) => {
    const setToRemove = editedSets[index];

    // If it's a new set (not yet saved), just remove from array
    if (setToRemove.isNew) {
      const updatedSets = editedSets.filter((_, i) => i !== index);
      setEditedSets(updatedSets);
      return;
    }

    // For existing sets, confirm deletion
    if (!confirm(`Are you sure you want to delete the set "${setToRemove.name}"? This will also delete all associated cards.`)) {
      return;
    }

    try {
      setLoading(true);

      // Call DELETE API
      const response = await fetch(`/api/sets?id=${setToRemove.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete set");
      }

      // Remove from local state
      const updatedSets = editedSets.filter((_, i) => i !== index);
      setEditedSets(updatedSets);

      setMessage({ type: "success", text: `Set "${setToRemove.name}" deleted successfully` });
    } catch (error) {
      console.error("Failed to delete set:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete set"
      });
    } finally {
      setLoading(false);
    }
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
              setName: setName,
            });
            continue;
          }
        }
      }

      // Try space-separated format: "1 Player Name, Team" or "1. Player Name, Team"
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
      setLoading(true);
      let text = "";

      // Handle PDF files differently
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setMessage({ type: "error", text: "PDF parsing for checklists is not yet implemented. Please use TXT or CSV files, or paste the text directly." });
        return;
      }

      // Read TXT and CSV files
      text = await file.text();

      const setName = editedSets[index].name || `Set ${index + 1}`;
      const cards = parseChecklistText(text, setName);

      if (cards.length === 0) {
        setMessage({ type: "error", text: "No cards found in the file. Please check the format (e.g., '1 Player Name, Team')" });
        return;
      }

      const updatedSets = [...editedSets];
      updatedSets[index] = {
        ...updatedSets[index],
        cards: cards,
        totalCards: String(cards.length),
      };
      setEditedSets(updatedSets);

      setMessage({ type: "success", text: `Successfully added ${cards.length} cards to ${setName}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to parse checklist file:", error);
      setMessage({ type: "error", text: "Failed to parse checklist file. Please check the format." });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistPaste = (index: number, text: string) => {
    try {
      const setName = editedSets[index].name || `Set ${index + 1}`;
      const cards = parseChecklistText(text, setName);

      if (cards.length === 0) {
        setMessage({ type: "error", text: "No cards found in the pasted text. Please check the format (e.g., '1 Player Name, Team')" });
        setTimeout(() => setMessage(null), 5000);
        return;
      }

      const updatedSets = [...editedSets];
      updatedSets[index] = {
        ...updatedSets[index],
        cards: cards,
        totalCards: String(cards.length),
      };
      setEditedSets(updatedSets);

      setMessage({ type: "success", text: `Successfully added ${cards.length} cards to ${setName}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to parse pasted checklist:", error);
      setMessage({ type: "error", text: "Failed to parse pasted text. Please check the format." });
      setTimeout(() => setMessage(null), 5000);
    }
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
        parallels: parallels,
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
      parallels: parallels,
    };
    setEditedSets(updatedSets);
  };

  const handleClearParallels = (index: number) => {
    const updatedSets = [...editedSets];
    updatedSets[index] = {
      ...updatedSets[index],
      parallels: [],
    };
    setEditedSets(updatedSets);
  };

  const handleGenerateDescription = async () => {
    if (!descriptionFile) {
      setMessage({ type: "error", text: "Please upload a sell sheet or info document first" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setGeneratingDescription(true);
      setMessage({ type: "success", text: "Generating description from document..." });

      // Upload file to blob storage first
      const formData = new FormData();
      formData.append('file', descriptionFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      await uploadResponse.json();

      // Generate description using AI
      const prompt = `Based on this ${editedYear} ${editedManufacturer} ${editedReleaseName} sell sheet, write a compelling 1-5 sentence description that highlights the key features and appeal of this release for soccer card collectors. Focus on what makes this release special and exciting.`;

      const response = await fetch('/api/generate/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const data = await response.json();
      setEditedDescription(data.excerpt || '');
      setMessage({ type: "success", text: "Description generated successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to generate description:', error);
      setMessage({ type: "error", text: "Failed to generate description. Please try again." });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!release) return;

    try {
      setUploadingFile(true);
      setMessage(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("releaseId", release.id);

      const response = await fetch("/api/uploads/release-files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const fileData = await response.json();

      // Add to sourceFiles array
      setSourceFiles([...sourceFiles, fileData]);

      setMessage({ type: "success", text: `File "${file.name}" uploaded successfully` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to upload file:", error);
      setMessage({ type: "error", text: "Failed to upload file. Please try again." });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileUrl: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/uploads/release-files?url=${encodeURIComponent(fileUrl)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      // Remove from sourceFiles array
      setSourceFiles(sourceFiles.filter(f => f.url !== fileUrl));

      setMessage({ type: "success", text: "File deleted successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to delete file:", error);
      setMessage({ type: "error", text: "Failed to delete file. Please try again." });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!release) return;

    try {
      setLoading(true);
      setMessage(null);

      const errors: string[] = [];

      // Update release metadata (name, year, description)
      try {
        const updateReleaseResponse = await fetch("/api/releases", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: release.id,
            name: editedReleaseName,
            year: editedYear,
            description: editedDescription || null,
            sourceFiles: sourceFiles.length > 0 ? sourceFiles : null,
          }),
        });

        if (!updateReleaseResponse.ok) {
          throw new Error("Failed to update release metadata");
        }
      } catch (error) {
        console.error("Error updating release:", error);
        errors.push(error instanceof Error ? error.message : "Failed to update release metadata");
      }

      // Process each set
      for (const set of editedSets) {
        if (set.isDeleted) continue; // Skip deleted sets

        try {
          if (set.isNew) {
            // Create new set
            const createResponse = await fetch("/api/sets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: set.name,
                totalCards: set.totalCards || null,
                releaseId: release.id,
                parallels: set.parallels || [],
              }),
            });

            if (!createResponse.ok) {
              throw new Error(`Failed to create set "${set.name}"`);
            }

            await createResponse.json();

            // Add cards to the new set if any
            if (set.cards && set.cards.length > 0) {
              const cardsResponse = await fetch("/api/analyze/release", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  files: [],
                  createDatabaseRecords: true,
                  analysisData: {
                    manufacturer: editedManufacturer,
                    releaseName: editedReleaseName,
                    year: editedYear,
                    sets: [{
                      name: set.name,
                      totalCards: set.totalCards,
                      features: set.parallels || [],
                      cards: set.cards.map(card => ({
                        playerName: card.playerName,
                        team: card.team || undefined,
                        cardNumber: card.cardNumber,
                        variant: card.variant || undefined,
                      })),
                    }],
                  },
                }),
              });

              if (!cardsResponse.ok) {
                console.warn(`Failed to add cards to set "${set.name}"`);
              }
            }
          } else {
            // Update existing set
            const updateResponse = await fetch("/api/sets", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: set.id,
                name: set.name,
                totalCards: set.totalCards || null,
                parallels: set.parallels || [],
              }),
            });

            if (!updateResponse.ok) {
              throw new Error(`Failed to update set "${set.name}"`);
            }

            // If cards were modified, delete existing cards and add new ones
            if (set.cards && set.cards.length > 0) {
              // Delete existing cards from the set
              await fetch(`/api/cards?setId=${set.id}`, {
                method: "DELETE",
              });

              // Add new cards to the set
              const cardsResponse = await fetch("/api/cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  setId: set.id,
                  cards: set.cards.map(card => ({
                    playerName: card.playerName,
                    team: card.team || undefined,
                    cardNumber: card.cardNumber,
                    variant: card.variant || undefined,
                  })),
                }),
              });

              if (!cardsResponse.ok) {
                console.warn(`Failed to add cards to set "${set.name}"`);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing set:`, error);
          errors.push(error instanceof Error ? error.message : `Failed to process set "${set.name}"`);
        }
      }

      if (errors.length > 0) {
        setMessage({
          type: "error",
          text: `Some errors occurred: ${errors.join("; ")}`
        });
      } else {
        setMessage({
          type: "success",
          text: "Release updated successfully!"
        });

        // Refresh the release data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save changes"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
      router.push("/admin");
    }
  };

  if (status === "loading" || fetchingRelease) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (!release) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-800 p-4 rounded-lg">
            Release not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="text-footy-green hover:underline mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-footy-green mb-2">
            Edit Release
          </h1>
          <p className="text-gray-600">
            Update release information and manage sets
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

        {/* Release Information */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
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
            <div className="pt-2 border-t border-blue-300">
              <p className="text-gray-800">
                <span className="font-semibold">Full Release:</span> {editedYear} {editedReleaseName}
              </p>
            </div>
            <p className="text-gray-800">
              <span className="font-semibold">Sets:</span> {editedSets.filter(s => !s.isDeleted).length}
            </p>
            <p>
              <span className="font-semibold">Total Cards:</span>{" "}
              {editedSets.reduce((sum, set) => sum + (set.cards?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* Source Files Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Source Files
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload sell sheets, checklists, PDFs, or other documents used for reference when creating content
          </p>

          <div className="space-y-4">
            {/* Upload Section */}
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                      e.target.value = ""; // Reset input
                    }
                  }}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                  disabled={uploadingFile}
                />
              </label>
              {uploadingFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              )}
            </div>

            {/* File List */}
            {sourceFiles.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {sourceFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        {file.type === "pdf" ? (
                          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        ) : file.type.match(/^(png|jpg|jpeg|webp)$/) ? (
                          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* File Info */}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                        <p className="text-xs text-gray-500 uppercase">{file.type}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file.url)}
                        className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sourceFiles.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No files uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Release Content Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Release Content
          </h3>

          <div className="space-y-4">
            {/* GenAI Description Generator */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-footy-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                GenAI: Generate Description from Sell Sheet
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Upload a sell sheet or info document to automatically generate a compelling description
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setDescriptionFile(e.target.files?.[0] || null)}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-footy-green hover:file:bg-green-200"
                />
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={!descriptionFile || generatingDescription}
                  className="px-4 py-2 bg-gradient-to-r from-footy-green to-green-600 hover:from-green-700 hover:to-green-700 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingDescription ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Description
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Manual Description Input */}
            <div>
              <label className="block font-semibold text-gray-900 mb-1">
                Description:
              </label>
              <p className="text-xs text-gray-500 mb-2">
                1-5 sentence summary displayed in previews and on the release page
              </p>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="A brief summary of this release for collectors..."
              />
            </div>
          </div>
        </div>

        {/* Sets Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Manage Sets
            </h3>
            <button
              type="button"
              onClick={handleAddSet}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Set
            </button>
          </div>

          {editedSets.length > 0 ? (
            <div className="space-y-4">
              {editedSets
                .map((set, idx) => ({ set, originalIdx: idx }))
                .filter(({ set }) => !set.isDeleted)
                .map(({ set, originalIdx: idx }) => {
                return (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={set.name}
                          onChange={(e) => handleUpdateSet(idx, "name", e.target.value)}
                          placeholder="Set Name (e.g., Base Set, Optic)"
                          className="w-full px-3 py-2 font-semibold border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(idx)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        title="Remove set"
                        disabled={loading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mb-3">
                      <input
                        type="text"
                        value={set.totalCards || ""}
                        onChange={(e) => handleUpdateSet(idx, "totalCards", e.target.value)}
                        placeholder="Total Cards (optional)"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="mb-3">
                      <div className="flex items-start gap-2">
                        <textarea
                          value={set.description || ""}
                          onChange={(e) => handleUpdateSet(idx, "description", e.target.value)}
                          placeholder="Description (optional) - Click the AI button to generate"
                          rows={2}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleGenerateSetDescription(idx)}
                          disabled={generatingSetDescription === idx || set.isNew || !set.id}
                          className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap text-sm font-medium disabled:cursor-not-allowed"
                          title={set.isNew ? "Save the set first to generate description" : "Generate AI description"}
                        >
                          {generatingSetDescription === idx ? (
                            <>
                              <svg
                                className="animate-spin h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span>AI</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>AI</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        AI generates 1-5 sentence descriptions from a soccer card expert perspective
                      </p>
                    </div>

                    {/* Checklist Upload/Paste Section */}
                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Checklist:
                      </p>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label className="flex-1">
                            <input
                              type="file"
                              accept=".txt,.csv"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleChecklistUpload(idx, file);
                              }}
                              className="hidden"
                            />
                            <div className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg border border-blue-300 cursor-pointer text-center transition-colors font-medium">
                              📄 Upload Checklist (TXT, CSV)
                            </div>
                          </label>
                        </div>
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600 hover:underline">
                            Or paste checklist text
                          </summary>
                          <textarea
                            placeholder="Paste checklist here (supports both formats)"
                            rows={4}
                            onChange={(e) => {
                              if (e.target.value.trim()) {
                                handleChecklistPaste(idx, e.target.value);
                                e.target.value = ''; // Clear after processing
                              }
                            }}
                            className="w-full px-3 py-2 mt-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Supports: &quot;1,Player Name,Team&quot; or &quot;1 Player Name, Team&quot; (one per line, optional header row)
                          </p>
                        </details>
                      </div>
                    </div>

                    {set.cards && set.cards.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-semibold text-green-700">
                              Checklist loaded: {set.cards.length} cards
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleClearChecklist(idx)}
                            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                            title="Clear checklist"
                          >
                            Clear
                          </button>
                        </div>
                        <details className="text-sm">
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
                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Parallels/Variations:
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
                            <div className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 cursor-pointer text-center transition-colors">
                              Upload File (TXT, CSV)
                            </div>
                          </label>
                        </div>
                        <details className="text-sm">
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
                            className="w-full px-3 py-2 mt-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Format: &quot;Gold – /10&quot; or &quot;Black – 1/1&quot; (one per line)
                          </p>
                        </details>
                      </div>
                    </div>

                    {set.parallels && set.parallels.length > 0 && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                            </svg>
                            <span className="text-sm font-semibold text-purple-700">
                              Parallels loaded: {set.parallels.length}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleClearParallels(idx)}
                            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                            title="Clear parallels"
                          >
                            Clear
                          </button>
                        </div>
                        <details className="text-sm">
                          <summary className="cursor-pointer text-purple-600 hover:underline">
                            View parallels
                          </summary>
                          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                            {set.parallels.map((parallel, parallelIdx) => (
                              <div key={parallelIdx} className="text-xs text-gray-700">
                                • {parallel}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic text-center py-8">
              No sets found. Click &quot;Add Set&quot; to create a set.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveChanges}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-footy-green to-green-700 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
