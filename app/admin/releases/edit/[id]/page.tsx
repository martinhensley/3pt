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

interface Release {
  id: string;
  name: string;
  year: string;
  manufacturerId: string;
  manufacturer: {
    id: string;
    name: string;
  };
  sets: Array<{
    id: string;
    name: string;
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

  // Release data
  const [release, setRelease] = useState<Release | null>(null);

  // Editable release fields
  const [editedManufacturer, setEditedManufacturer] = useState("");
  const [editedReleaseName, setEditedReleaseName] = useState("");
  const [editedYear, setEditedYear] = useState("");
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

        // Transform sets data
        const transformedSets: SetInfo[] = data.sets.map(set => ({
          id: set.id,
          name: set.name,
          totalCards: set.totalCards || "",
          parallels: set.parallels || [],
          cards: set.cards.map(card => ({
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

  const handleSaveChanges = async () => {
    if (!release) return;

    try {
      setLoading(true);
      setMessage(null);

      const errors: string[] = [];

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

            const createdSet = await createResponse.json();

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

            // If cards were modified, we need to delete existing cards and recreate them
            // This is a simplified approach - for production you might want more granular updates
            if (set.cards && set.cards.length > 0) {
              // Delete existing cards
              await fetch(`/api/sets?id=${set.id}`, {
                method: "DELETE",
              });

              // Recreate the set with new cards
              const recreateResponse = await fetch("/api/sets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: set.name,
                  totalCards: set.totalCards || null,
                  releaseId: release.id,
                  parallels: set.parallels || [],
                }),
              });

              if (recreateResponse.ok) {
                const recreatedSet = await recreateResponse.json();

                // Add cards
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

  if (!release) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
            Release not found
          </div>
        </div>
      </div>
    );
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
            Edit Release
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update release information and manage sets
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

        {/* Release Information */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
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
              <span className="font-semibold">Sets:</span> {editedSets.filter(s => !s.isDeleted).length}
            </p>
            <p>
              <span className="font-semibold">Total Cards:</span>{" "}
              {editedSets.reduce((sum, set) => sum + (set.cards?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* Sets Management */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
              {editedSets.map((set, idx) => (
                !set.isDeleted && (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={set.name}
                          onChange={(e) => handleUpdateSet(idx, "name", e.target.value)}
                          placeholder="Set Name (e.g., Base Set, Optic)"
                          className="w-full px-3 py-2 font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="mb-3">
                      <textarea
                        value={set.description || ""}
                        onChange={(e) => handleUpdateSet(idx, "description", e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Checklist Upload/Paste Section */}
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-3">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                            <div className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 text-blue-700 dark:text-blue-100 rounded-lg border border-blue-300 dark:border-blue-600 cursor-pointer text-center transition-colors font-medium">
                              📄 Upload Checklist (TXT, CSV)
                            </div>
                          </label>
                        </div>
                        <details className="text-sm">
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
                            className="w-full px-3 py-2 mt-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Format: &quot;1 Kylian Mbappe, France&quot; (one per line)
                          </p>
                        </details>
                      </div>
                    </div>

                    {set.cards && set.cards.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                              Checklist loaded: {set.cards.length} cards
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleClearChecklist(idx)}
                            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded transition-colors"
                            title="Clear checklist"
                          >
                            Clear
                          </button>
                        </div>
                        <details className="text-sm">
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
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-3">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                            <div className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer text-center transition-colors">
                              Upload File (TXT, CSV)
                            </div>
                          </label>
                        </div>
                        <details className="text-sm">
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
                            className="w-full px-3 py-2 mt-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Format: &quot;Gold – /10&quot; or &quot;Black – 1/1&quot; (one per line)
                          </p>
                        </details>
                      </div>
                    </div>

                    {set.parallels && set.parallels.length > 0 && (
                      <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                            </svg>
                            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                              Parallels loaded: {set.parallels.length}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleClearParallels(idx)}
                            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded transition-colors"
                            title="Clear parallels"
                          >
                            Clear
                          </button>
                        </div>
                        <details className="text-sm">
                          <summary className="cursor-pointer text-purple-600 dark:text-purple-400 hover:underline">
                            View parallels
                          </summary>
                          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                            {set.parallels.map((parallel, parallelIdx) => (
                              <div key={parallelIdx} className="text-xs text-gray-700 dark:text-gray-300">
                                • {parallel}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
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
