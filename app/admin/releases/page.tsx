"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
import Link from "next/link";

interface Release {
  id: string;
  name: string;
  year: string | null;
  slug: string;
  createdAt: string;
  isApproved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  manufacturer: {
    id: string;
    name: string;
  };
  sets: {
    id: string;
    name: string;
    parentSetId: string | null;
    _count: {
      cards: number;
    };
  }[];
  images: {
    id: string;
    url: string;
  }[];
}

export default function ManageReleasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const fetchReleases = async () => {
    try {
      const response = await fetch("/api/releases");
      if (response.ok) {
        const data = await response.json();
        setReleases(Array.isArray(data) ? data : [data]);
      }
    } catch (error) {
      console.error("Failed to fetch releases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (releaseId: string, releaseName: string) => {
    if (!confirm(`Are you sure you want to delete "${releaseName}"? This will also delete all sets and cards in this release. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/releases?id=${releaseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Release deleted successfully!",
        });
        fetchReleases();
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to delete release");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete release" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleApproval = async (releaseId: string, releaseName: string, currentStatus: boolean) => {
    const action = currentStatus ? "unapprove" : "approve";
    if (!confirm(`Are you sure you want to ${action} "${releaseName}"?`)) {
      return;
    }

    try {
      const response = await fetch("/api/releases/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          releaseId,
          approve: !currentStatus,
        }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Release ${action}d successfully!`,
        });
        fetchReleases();
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(`Failed to ${action} release`);
      }
    } catch {
      setMessage({ type: "error", text: `Failed to ${action} release` });
      setTimeout(() => setMessage(null), 3000);
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

  // Get unique manufacturers
  const manufacturers = Array.from(
    new Set(releases.map((r) => r.manufacturer.name))
  ).sort();

  const filteredReleases = releases.filter((release) => {
    if (manufacturerFilter !== "all" && release.manufacturer.name !== manufacturerFilter) {
      return false;
    }
    return true;
  });

  return (
    <AdminLayout>
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Manage Releases & Sets", href: "/admin/releases" },
            ]}
          />

          {message && (
            <div
              className={`p-4 rounded-lg mb-4 mt-6 ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mt-6">
            <div className="bg-gradient-to-r from-footy-green to-green-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">{filteredReleases.length}</div>
              <div className="text-sm opacity-90">Total Releases</div>
            </div>
            <div className="bg-gradient-to-r from-footy-green to-green-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">
                {filteredReleases.reduce(
                  (sum, r) => sum + r.sets.filter(s => s.parentSetId === null).length,
                  0
                )}
              </div>
              <div className="text-sm opacity-90">Base Sets</div>
            </div>
            <div className="bg-gradient-to-r from-footy-green to-green-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">
                {filteredReleases.reduce(
                  (sum, r) => sum + r.sets.filter(s => s.parentSetId !== null).length,
                  0
                )}
              </div>
              <div className="text-sm opacity-90">Parallel Sets</div>
            </div>
            <div className="bg-gradient-to-r from-footy-green to-green-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">
                {filteredReleases.reduce(
                  (sum, r) => sum + r.sets.reduce((s, set) => s + set._count.cards, 0),
                  0
                )}
              </div>
              <div className="text-sm opacity-90">Total Cards</div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <select
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              <option value="all">All Manufacturers</option>
              {manufacturers.map((manufacturer) => (
                <option key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </option>
              ))}
            </select>
            <Link
              href="/admin/releases/create"
              className="px-4 py-2 bg-footy-green hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Create New Release
            </Link>
          </div>
        </div>

        {/* Releases List */}
        <div className="space-y-4">
          {filteredReleases.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                No releases found. Create your first release to get started!
              </p>
            </div>
          ) : (
            filteredReleases.map((release) => (
              <div
                key={release.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-gray-900">
                          {release.manufacturer.name} {release.name}
                        </h2>
                        {release.year && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                            {release.year}
                          </span>
                        )}
                        {release.isApproved ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approved
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {release.sets.length} sets
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          {release.sets.reduce((sum, set) => sum + set._count.cards, 0)} cards
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {release.images.length} images
                        </span>
                      </div>

                      <div className="text-sm text-gray-500">
                        Slug: <code className="bg-gray-100 px-2 py-1 rounded">{release.slug}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/releases/${release.slug}`}
                        target="_blank"
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        title="View release"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Link>
                      <Link
                        href={`/admin/releases/edit/${release.id}`}
                        className="px-4 py-2 bg-footy-green hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleApproval(release.id, `${release.manufacturer.name} ${release.name}`, release.isApproved)}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          release.isApproved
                            ? "bg-gray-600 hover:bg-gray-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {release.isApproved ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Unapprove
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(release.id, `${release.manufacturer.name} ${release.name}`)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
    </AdminLayout>
  );
}
