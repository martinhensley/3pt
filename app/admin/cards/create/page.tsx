"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
import Image from "next/image";

interface Release {
  id: string;
  name: string;
  year: string | null;
  manufacturer: {
    name: string;
  };
  sets: {
    id: string;
    name: string;
    type: string;
  }[];
}

export default function CreateCardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [filteredSets, setFilteredSets] = useState<Release['sets']>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [releaseId, setReleaseId] = useState("");
  const [setId, setSetId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [team, setTeam] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [variant, setVariant] = useState("");
  const [parallelType, setParallelType] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [isNumbered, setIsNumbered] = useState(false);
  const [printRun, setPrintRun] = useState("");
  const [numbered, setNumbered] = useState("");
  const [rarity, setRarity] = useState("");
  const [finish, setFinish] = useState("");
  const [hasAutograph, setHasAutograph] = useState(false);
  const [hasMemorabilia, setHasMemorabilia] = useState(false);
  const [colorVariant, setColorVariant] = useState("");
  const [footyNotes, setFootyNotes] = useState("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchReleases();
    }
  }, [session]);

  // Update filtered sets when release changes
  useEffect(() => {
    if (releaseId) {
      const selectedRelease = releases.find((r) => r.id === releaseId);
      if (selectedRelease) {
        setFilteredSets(selectedRelease.sets);
      }
    } else {
      setFilteredSets([]);
    }
    setSetId(""); // Reset set selection when release changes
  }, [releaseId, releases]);

  const fetchReleases = async () => {
    try {
      // Fetch all releases with their sets
      const response = await fetch("/api/releases");
      if (response.ok) {
        const allReleases = await response.json();

        // For each release, fetch its sets
        const releasesWithSets = await Promise.all(
          (Array.isArray(allReleases) ? allReleases : []).map(async (release: Release) => {
            try {
              const setsResponse = await fetch(`/api/sets?releaseId=${release.id}`);
              if (setsResponse.ok) {
                const sets = await setsResponse.json();
                return { ...release, sets: Array.isArray(sets) ? sets : [] };
              }
            } catch (error) {
              console.error(`Failed to fetch sets for release ${release.id}:`, error);
            }
            return { ...release, sets: [] };
          })
        );

        setReleases(releasesWithSets);
      }
    } catch (error) {
      console.error("Failed to fetch releases:", error);
    } finally {
      setLoading(false);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFrontImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(file);
      const preview = await convertImageToBase64(file);
      setFrontImagePreview(preview);
    }
  };

  const handleBackImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackImage(file);
      const preview = await convertImageToBase64(file);
      setBackImagePreview(preview);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Validation
    if (!setId) {
      setMessage({
        type: "error",
        text: "Please select a release and set",
      });
      setSaving(false);
      return;
    }

    try {
      const cardData: Record<string, unknown> = {
        setId,
        playerName,
        team,
        cardNumber,
        variant,
        parallelType,
        serialNumber,
        isNumbered,
        printRun: printRun ? parseInt(printRun) : null,
        numbered,
        rarity: rarity || null,
        finish: finish || null,
        hasAutograph,
        hasMemorabilia,
        colorVariant: colorVariant || null,
        footyNotes,
      };

      // Handle front image
      if (frontImage) {
        const base64Front = await convertImageToBase64(frontImage);
        cardData.imageFront = base64Front;
      }

      // Handle back image
      if (backImage) {
        const base64Back = await convertImageToBase64(backImage);
        cardData.imageBack = base64Back;
      }

      const response = await fetch("/api/admin/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({
          type: "success",
          text: `Card created successfully! Slug: ${result.card.slug}`,
        });

        // Redirect to cards list after 2 seconds
        setTimeout(() => {
          router.push("/admin/cards");
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create card");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create card",
      });
      setSaving(false);
    }
  };

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
      <div className="max-w-4xl">
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Manage Cards", href: "/admin/cards" },
            { label: "Create Card", href: "/admin/cards/create" },
          ]}
        />

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 mt-6 ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8 mt-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create New Card</h1>
            <p className="text-gray-600 mt-2">
              Add a new card to a set
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Release and Set Selection */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Set Selection</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Release <span className="text-orange-600">*</span>
                  </label>
                  <select
                    value={releaseId}
                    onChange={(e) => setReleaseId(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  >
                    <option value="">Select a release</option>
                    {releases.map((release) => (
                      <option key={release.id} value={release.id}>
                        {release.year} {release.manufacturer.name} {release.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Set <span className="text-orange-600">*</span>
                  </label>
                  <select
                    value={setId}
                    onChange={(e) => setSetId(e.target.value)}
                    required
                    disabled={!releaseId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                  >
                    <option value="">Select a set</option>
                    {filteredSets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name} ({set.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Player Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Player Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Team
                  </label>
                  <input
                    type="text"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Variant Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Variant Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Variant
                  </label>
                  <input
                    type="text"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    placeholder="e.g., Prizm, Optic, Chrome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Parallel Type
                  </label>
                  <input
                    type="text"
                    value={parallelType}
                    onChange={(e) => setParallelType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    placeholder="e.g., Gold, Silver, Red"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Color Variant
                  </label>
                  <input
                    type="text"
                    value={colorVariant}
                    onChange={(e) => setColorVariant(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Finish
                  </label>
                  <select
                    value={finish}
                    onChange={(e) => setFinish(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  >
                    <option value="">Select Finish</option>
                    <option value="refractor">Refractor</option>
                    <option value="chrome">Chrome</option>
                    <option value="matte">Matte</option>
                    <option value="glossy">Glossy</option>
                    <option value="holographic">Holographic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Rarity
                  </label>
                  <select
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  >
                    <option value="">Select Rarity</option>
                    <option value="base">Base</option>
                    <option value="rare">Rare</option>
                    <option value="super_rare">Super Rare</option>
                    <option value="ultra_rare">Ultra Rare</option>
                    <option value="one_of_one">1 of 1</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Numbering Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Numbering Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isNumbered}
                      onChange={(e) => setIsNumbered(e.target.checked)}
                      className="w-4 h-4 text-3pt-green border-gray-300 rounded focus:ring-3pt-green"
                    />
                    <span className="text-sm font-semibold text-gray-900">Is Numbered</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    placeholder="e.g., 123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Print Run
                  </label>
                  <input
                    type="number"
                    value={printRun}
                    onChange={(e) => setPrintRun(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    placeholder="e.g., 299"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Numbered Display
                  </label>
                  <input
                    type="text"
                    value={numbered}
                    onChange={(e) => setNumbered(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    placeholder='e.g., "123/299", "1 of 1", "/99"'
                  />
                </div>
              </div>
            </div>

            {/* Card Features */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Card Features</h2>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasAutograph}
                    onChange={(e) => setHasAutograph(e.target.checked)}
                    className="w-4 h-4 text-3pt-green border-gray-300 rounded focus:ring-3pt-green"
                  />
                  <span className="text-sm font-semibold text-gray-900">Has Autograph</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasMemorabilia}
                    onChange={(e) => setHasMemorabilia(e.target.checked)}
                    className="w-4 h-4 text-3pt-green border-gray-300 rounded focus:ring-3pt-green"
                  />
                  <span className="text-sm font-semibold text-gray-900">Has Memorabilia</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Internal Notes
              </label>
              <textarea
                value={footyNotes}
                onChange={(e) => setFootyNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                placeholder="Add any internal notes about this card..."
              />
            </div>

            {/* Card Images */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Card Images</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Front Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {frontImagePreview ? (
                      <div className="relative">
                        <Image
                          src={frontImagePreview}
                          alt="Card Front Preview"
                          width={300}
                          height={420}
                          className="w-full h-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFrontImage(null);
                            setFrontImagePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-400 mb-2">Front</div>
                            <div className="text-sm text-gray-400">No image selected</div>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFrontImageChange}
                          className="hidden"
                          id="front-image-upload"
                        />
                        <label
                          htmlFor="front-image-upload"
                          className="cursor-pointer inline-block px-4 py-2 bg-3pt-green text-white rounded-lg hover:bg-green-700"
                        >
                          Upload Front Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Back Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {backImagePreview ? (
                      <div className="relative">
                        <Image
                          src={backImagePreview}
                          alt="Card Back Preview"
                          width={300}
                          height={420}
                          className="w-full h-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setBackImage(null);
                            setBackImagePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-400 mb-2">Back</div>
                            <div className="text-sm text-gray-400">No image selected</div>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBackImageChange}
                          className="hidden"
                          id="back-image-upload"
                        />
                        <label
                          htmlFor="back-image-upload"
                          className="cursor-pointer inline-block px-4 py-2 bg-3pt-green text-white rounded-lg hover:bg-green-700"
                        >
                          Upload Back Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-3pt-green hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Creating..." : "Create Card"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/cards")}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
