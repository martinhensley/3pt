"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

interface Checklist {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  set: {
    id: string;
    name: string;
    release: {
      id: string;
      name: string;
      year: string | null;
    };
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ChecklistsLibraryPage() {
  const router = useRouter();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch checklists
  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/library/checklists?${params}`);

      // Handle unauthorized - redirect to login
      if (response.status === 401) {
        setLoading(false);
        router.push("/admin");
        return;
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || "Failed to fetch checklists");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setChecklists(data.checklists);
      setPagination(data.pagination);
      setError("");
    } catch (err) {
      // Only set error if we're not redirecting
      const error = err as Error;
      if (error.message && !error.message.includes("redirect")) {
        setError(error.message || "Failed to load checklists");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, [pagination.page, sortBy, sortOrder]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchChecklists();
      } else {
        setPagination({ ...pagination, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Get icon for file type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("csv")) return "📊";
    return "📋";
  };

  return (
    <AdminLayout maxWidth="1600px">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin")}
          className="text-footy-green hover:text-green-700 mb-4 inline-block"
        >
          ← Back to Admin
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checklists Library</h1>
        <p className="text-gray-600">
          View and manage all set checklists uploaded during release creation
        </p>
      </div>

        {error && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Note:</strong> Checklists are automatically added to this library when uploaded during release or set creation.
              Each checklist is associated with a specific set.
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search checklists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
            >
              <option value="uploadedAt">Upload Date</option>
              <option value="name">Name</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Checklists Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            <p className="mt-4 text-gray-600">Loading checklists...</p>
          </div>
        ) : checklists.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-2">No checklists yet</p>
            <p className="text-gray-500 text-sm">
              Checklists will appear here automatically when you upload them during release or set creation.
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {checklists.map((checklist) => (
                <div
                  key={checklist.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{getFileIcon(checklist.mimeType)}</div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                      Checklist
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {checklist.name}
                  </h3>

                  <div className="mb-4 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Release:</span> {checklist.set.release.name}
                      {checklist.set.release.year && ` (${checklist.set.release.year})`}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Set:</span> {checklist.set.name}
                    </p>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">{formatFileSize(checklist.fileSize)}</p>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{new Date(checklist.uploadedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={checklist.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center bg-footy-green text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => router.push(`/admin/releases/edit/${checklist.set.release.id}`)}
                      className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      View Release
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <span className="text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
    </AdminLayout>
  );
}
