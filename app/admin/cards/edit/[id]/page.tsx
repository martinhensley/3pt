"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
import Image from "next/image";

interface Card {
  id: string;
  slug: string | null;
  playerName: string | null;
  team: string | null;
  cardNumber: string | null;
  variant: string | null;
  parallelType: string | null;
  serialNumber: string | null;
  isNumbered: boolean;
  printRun: number | null;
  numbered: string | null;
  rarity: string | null;
  finish: string | null;
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  specialFeatures: string[];
  colorVariant: string | null;
  footyNotes: string | null;
  imageFront: string | null;
  imageBack: string | null;
  set: {
    id: string;
    name: string;
    release: {
      id: string;
      name: string;
      year: string | null;
      manufacturer: {
        name: string;
      };
    };
  };
  images: {
    id: string;
    url: string;
  }[];
}

export default function EditCardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
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
  const [newFrontImage, setNewFrontImage] = useState<File | null>(null);
  const [newBackImage, setNewBackImage] = useState<File | null>(null);
  const [removeFrontImage, setRemoveFrontImage] = useState(false);
  const [removeBackImage, setRemoveBackImage] = useState(false);
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && cardId) {
      fetchCard();
    }
  }, [session, cardId]);

  const fetchCard = async () => {
    try {
      const response = await fetch(`/api/cards?id=${cardId}`);
      if (response.ok) {
        const data = await response.json();
        setCard(data);
        setPlayerName(data.playerName || "");
        setTeam(data.team || "");
        setCardNumber(data.cardNumber || "");
        setVariant(data.variant || "");
        setParallelType(data.parallelType || "");
        setSerialNumber(data.serialNumber || "");
        setIsNumbered(data.isNumbered || false);
        setPrintRun(data.printRun ? data.printRun.toString() : "");
        setNumbered(data.numbered || "");
        setRarity(data.rarity || "");
        setFinish(data.finish || "");
        setHasAutograph(data.hasAutograph || false);
        setHasMemorabilia(data.hasMemorabilia || false);
        setColorVariant(data.colorVariant || "");
        setFootyNotes(data.footyNotes || "");
      } else {
        setMessage({ type: "error", text: "Card not found" });
      }
    } catch (error) {
      console.error("Failed to fetch card:", error);
      setMessage({ type: "error", text: "Failed to load card" });
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
      setNewFrontImage(file);
      const preview = await convertImageToBase64(file);
      setFrontImagePreview(preview);
      setRemoveFrontImage(false);
    }
  };

  const handleBackImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewBackImage(file);
      const preview = await convertImageToBase64(file);
      setBackImagePreview(preview);
      setRemoveBackImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updateData: Record<string, unknown> = {
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
      if (newFrontImage) {
        const base64Front = await convertImageToBase64(newFrontImage);
        updateData.imageFront = base64Front;
      } else if (removeFrontImage) {
        updateData.imageFront = null;
      }

      // Handle back image
      if (newBackImage) {
        const base64Back = await convertImageToBase64(newBackImage);
        updateData.imageBack = base64Back;
      } else if (removeBackImage) {
        updateData.imageBack = null;
      }

      const response = await fetch(`/api/admin/cards/${cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Card updated successfully!",
        });
        setNewFrontImage(null);
        setNewBackImage(null);
        setFrontImagePreview(null);
        setBackImagePreview(null);
        setRemoveFrontImage(false);
        setRemoveBackImage(false);
        fetchCard();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update card");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update card",
      });
    } finally {
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

  if (!session?.user || !card) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Card not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Manage Cards", href: "/admin/cards" },
            { label: "Edit Card", href: `/admin/cards/edit/${cardId}` },
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Card</h1>
            <p className="text-gray-600 mt-2">
              {card.set.release.year} {card.set.release.manufacturer.name}{" "}
              {card.set.release.name} - {card.set.name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-4 h-4 text-footy-green border-gray-300 rounded focus:ring-footy-green"
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
                    className="w-4 h-4 text-footy-green border-gray-300 rounded focus:ring-footy-green"
                  />
                  <span className="text-sm font-semibold text-gray-900">Has Autograph</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasMemorabilia}
                    onChange={(e) => setHasMemorabilia(e.target.checked)}
                    className="w-4 h-4 text-footy-green border-gray-300 rounded focus:ring-footy-green"
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
                    {frontImagePreview || (card.imageFront && !removeFrontImage) ? (
                      <div className="relative">
                        <Image
                          src={frontImagePreview || card.imageFront || ""}
                          alt="Card Front"
                          width={300}
                          height={420}
                          className="w-full h-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (frontImagePreview) {
                              setNewFrontImage(null);
                              setFrontImagePreview(null);
                            } else {
                              setRemoveFrontImage(true);
                            }
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
                            <div className="text-sm text-gray-400">Image coming soon</div>
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
                          className="cursor-pointer inline-block px-4 py-2 bg-footy-green text-white rounded-lg hover:bg-green-700"
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
                    {backImagePreview || (card.imageBack && !removeBackImage) ? (
                      <div className="relative">
                        <Image
                          src={backImagePreview || card.imageBack || ""}
                          alt="Card Back"
                          width={300}
                          height={420}
                          className="w-full h-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (backImagePreview) {
                              setNewBackImage(null);
                              setBackImagePreview(null);
                            } else {
                              setRemoveBackImage(true);
                            }
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
                            <div className="text-sm text-gray-400">Image coming soon</div>
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
                          className="cursor-pointer inline-block px-4 py-2 bg-footy-green text-white rounded-lg hover:bg-green-700"
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
                className="px-6 py-2 bg-footy-green hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/cards")}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg"
              >
                Cancel
              </button>
              {card.slug && (
                <a
                  href={`/cards/${card.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  View Card
                </a>
              )}
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
