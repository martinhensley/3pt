"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
import { generateSetSlug } from "@/lib/slugGenerator";

interface Release {
  id: string;
  name: string;
  year: string | null;
  manufacturer: {
    name: string;
  };
}

export default function CreateSetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [releaseId, setReleaseId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"Base" | "Autograph" | "Memorabilia" | "Insert">("Base");
  const [totalCards, setTotalCards] = useState("");
  const [printRun, setPrintRun] = useState("");
  const [description, setDescription] = useState("");
  const [isParallel, setIsParallel] = useState(false);
  const [variant, setVariant] = useState("");
  const [baseSetSlug, setBaseSetSlug] = useState("");
  const [slugPreview, setSlugPreview] = useState("");

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

  // Update slug preview whenever relevant fields change
  useEffect(() => {
    if (releaseId && name) {
      const selectedRelease = releases.find((r) => r.id === releaseId);
      if (selectedRelease) {
        // Strip year from release name if it exists
        const cleanReleaseName = selectedRelease.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

        const preview = isParallel && variant
          ? generateSetSlug(
              selectedRelease.year || '',
              cleanReleaseName,
              name,
              type,
              variant,
              printRun ? parseInt(printRun) : null
            )
          : generateSetSlug(
              selectedRelease.year || '',
              cleanReleaseName,
              name,
              type
            );
        setSlugPreview(preview);

        // Also generate base set slug if parallel
        if (isParallel) {
          const baseSlug = generateSetSlug(
            selectedRelease.year || '',
            cleanReleaseName,
            name,
            type
          );
          setBaseSetSlug(baseSlug);
        }
      }
    }
  }, [releaseId, name, type, variant, printRun, isParallel, releases]);

  const fetchReleases = async () => {
    try {
      const response = await fetch("/api/releases");
      if (response.ok) {
        const data = await response.json();
        setReleases(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch releases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Validation
    if (!releaseId || !name) {
      setMessage({
        type: "error",
        text: "Please fill in all required fields (Release and Set Name)",
      });
      setSaving(false);
      return;
    }

    if (isParallel && !variant) {
      setMessage({
        type: "error",
        text: "Please provide a variant name for parallel sets",
      });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          releaseId,
          name,
          type,
          totalCards: totalCards || null,
          printRun: printRun ? parseInt(printRun) : null,
          description: description || null,
          isParallel,
          variant: isParallel ? variant : null,
        }),
      });

      if (response.ok) {
        const createdSet = await response.json();
        setMessage({
          type: "success",
          text: `Set created successfully! Slug: ${createdSet.slug}`,
        });

        // Redirect to sets list after 2 seconds
        setTimeout(() => {
          router.push("/admin/sets");
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create set");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create set",
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
            { label: "Manage Sets", href: "/admin/sets" },
            { label: "Create Set", href: "/admin/sets/create" },
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
            <h1 className="text-3xl font-bold text-gray-900">Create New Set</h1>
            <p className="text-gray-600 mt-2">
              Add a new set to a release
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Release Selection */}
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

            {/* Set Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Set Name <span className="text-orange-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Base, Optic, Craftsmen, Signature Series"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-1">
                For base sets, use "Base" or "Optic". For inserts/autos, use the full set name.
              </p>
            </div>

            {/* Set Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Set Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="Base">Base</option>
                <option value="Insert">Insert</option>
                <option value="Autograph">Autograph</option>
                <option value="Memorabilia">Memorabilia</option>
              </select>
            </div>

            {/* Parallel Checkbox */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isParallel}
                  onChange={(e) => setIsParallel(e.target.checked)}
                  className="w-4 h-4 text-footy-green border-gray-300 rounded focus:ring-footy-green"
                />
                <span className="text-sm font-semibold text-gray-900">
                  This is a parallel set
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-6">
                Check this if this set is a parallel variant (e.g., Cubic, Red /299, Gold /10)
              </p>
            </div>

            {/* Variant Name (shown if parallel) */}
            {isParallel && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Variant Name <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  required={isParallel}
                  placeholder="e.g., Cubic, Red, Gold Power"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  The parallel variant name (e.g., "Cubic", "Red", "Gold Power")
                </p>
              </div>
            )}

            {/* Total Cards and Print Run */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Total Cards
                </label>
                <input
                  type="text"
                  value={totalCards}
                  onChange={(e) => setTotalCards(e.target.value)}
                  placeholder="e.g., 200"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Number of cards in this set
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Print Run
                </label>
                <input
                  type="number"
                  value={printRun}
                  onChange={(e) => setPrintRun(e.target.value)}
                  placeholder="e.g., 99"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  For numbered parallels (e.g., 99 for /99, 1 for 1/1)
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional description or notes about this set..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
            </div>

            {/* Slug Preview */}
            {slugPreview && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Slug Preview</h3>
                <p className="text-sm font-mono text-footy-green">
                  {slugPreview}
                </p>
                {isParallel && baseSetSlug && (
                  <p className="text-sm text-gray-500 mt-2">
                    Base Set Slug: <span className="font-mono">{baseSetSlug}</span>
                  </p>
                )}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-footy-green hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Creating..." : "Create Set"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/sets")}
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
