"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
import Link from "next/link";

interface Set {
  id: string;
  name: string;
  slug: string;
  type: "Base" | "Autograph" | "Memorabilia" | "Insert";
  totalCards: string | null;
  printRun: number | null;
  description: string | null;
  isParallel: boolean;
  baseSetSlug: string | null;
  release: {
    id: string;
    name: string;
    year: string | null;
    manufacturer: {
      name: string;
    };
  };
  _count: {
    cards: number;
  };
}

export default function EditSetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const setId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [set, setSet] = useState<Set | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"Base" | "Autograph" | "Memorabilia" | "Insert">("Base");
  const [totalCards, setTotalCards] = useState("");
  const [printRun, setPrintRun] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && setId) {
      fetchSet();
    }
  }, [session, setId]);

  const fetchSet = async () => {
    try {
      const response = await fetch(`/api/sets?id=${setId}`);
      if (response.ok) {
        const data = await response.json();
        setSet(data);
        setName(data.name || "");
        setType(data.type || "Base");
        setTotalCards(data.totalCards || "");
        setPrintRun(data.printRun ? data.printRun.toString() : "");
        setDescription(data.description || "");
      } else {
        setMessage({ type: "error", text: "Set not found" });
      }
    } catch (error) {
      console.error("Failed to fetch set:", error);
      setMessage({ type: "error", text: "Failed to load set" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updateData: Record<string, unknown> = {
        id: setId,
        name,
        type,
        totalCards: totalCards || null,
        printRun: printRun ? parseInt(printRun) : null,
        description: description || null,
      };

      const response = await fetch("/api/sets", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedSet = await response.json();
        setMessage({
          type: "success",
          text: `Set updated successfully! ${updatedSet.slug !== set?.slug ? `New slug: ${updatedSet.slug}` : ''}`,
        });
        fetchSet();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update set");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update set",
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

  if (!session?.user || !set) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Set not found</p>
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
            { label: "Manage Sets", href: "/admin/sets" },
            { label: "Edit Set", href: `/admin/sets/edit/${setId}` },
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Set</h1>
            <p className="text-gray-600 mt-2">
              {set.release.year} {set.release.manufacturer.name} {set.release.name}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <div>
                <span className="font-semibold">Cards:</span> {set._count.cards}
              </div>
              <div>
                <span className="font-semibold">Slug:</span>{" "}
                <span className="font-mono text-footy-green">{set.slug}</span>
              </div>
              {set.isParallel && (
                <div>
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                    PARALLEL
                  </span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-1">
                Changing the name will regenerate the slug
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

            {/* Parallel Info (read-only) */}
            {set.isParallel && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Parallel Information</h3>
                <p className="text-sm text-gray-600">
                  This is a parallel set.{" "}
                  {set.baseSetSlug && (
                    <>
                      Base set slug: <span className="font-mono text-footy-green">{set.baseSetSlug}</span>
                    </>
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Parallel settings (isParallel, baseSetSlug) cannot be changed after creation.
                </p>
              </div>
            )}

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
                onClick={() => router.push("/admin/sets")}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg"
              >
                Cancel
              </button>
              {set.slug && (
                <Link
                  href={`/sets/${set.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  View Set
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
