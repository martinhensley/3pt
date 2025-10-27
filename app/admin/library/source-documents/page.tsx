"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DocumentType } from "@prisma/client";
import AdminLayout from "@/components/AdminLayout";

interface SourceDocument {
  id: string;
  filename: string;
  displayName: string;
  blobUrl: string;
  mimeType: string;
  fileSize: number;
  documentType: DocumentType;
  tags: string[];
  uploadedAt: string;
  usageCount: number;
  lastUsedAt: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SourceDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
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
  const [documentType, setDocumentType] = useState<DocumentType | "">("");
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");


  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append("search", search);
      if (documentType) params.append("documentType", documentType);

      const response = await fetch(`/api/admin/library/source-documents?${params}`);

      // Handle unauthorized - redirect to login
      if (response.status === 401) {
        setLoading(false);
        router.push("/admin");
        return;
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || "Failed to fetch documents");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
      setError("");
    } catch (err) {
      // Only set error if we're not redirecting
      const error = err as Error;
      if (error.message && !error.message.includes("redirect")) {
        setError(error.message || "Failed to load documents");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [pagination.page, documentType, sortBy, sortOrder]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchDocuments();
      } else {
        setPagination({ ...pagination, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/admin/library/source-documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      fetchDocuments();
    } catch (err) {
      setError("Failed to delete document");
      console.error(err);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Get icon for file type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return "📊";
    return "📎";
  };

  // Get color for document type
  const getDocTypeColor = (type: DocumentType) => {
    const colors = {
      SELL_SHEET: "bg-blue-100 text-blue-800",
      CHECKLIST: "bg-green-100 text-green-800",
      PRESS_RELEASE: "bg-purple-100 text-purple-800",
      PRICE_GUIDE: "bg-yellow-100 text-yellow-800",
      IMAGE: "bg-pink-100 text-pink-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.OTHER;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Source Documents Library</h1>
        <p className="text-gray-600">
          Manage all source files used for content creation (sell sheets, checklists, etc.)
        </p>
      </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Documents are automatically added to this library when uploaded during release or post creation.
              This library is for viewing and managing your source documents.
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
            />

            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType | "")}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
            >
              <option value="">All Types</option>
              <option value="SELL_SHEET">Sell Sheets</option>
              <option value="CHECKLIST">Checklists</option>
              <option value="PRESS_RELEASE">Press Releases</option>
              <option value="PRICE_GUIDE">Price Guides</option>
              <option value="IMAGE">Images</option>
              <option value="OTHER">Other</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
            >
              <option value="uploadedAt">Upload Date</option>
              <option value="displayName">Name</option>
              <option value="usageCount">Usage Count</option>
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

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-2">No source documents yet</p>
            <p className="text-gray-500 text-sm">
              Source documents will appear here automatically when you upload files during release or post creation.
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push(`/admin/library/source-documents/${doc.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{getFileIcon(doc.mimeType)}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDocTypeColor(doc.documentType)}`}>
                      {doc.documentType.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {doc.displayName}
                  </h3>

                  <p className="text-sm text-gray-500 mb-4">{formatFileSize(doc.fileSize)}</p>

                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{doc.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{doc.usageCount} uses</span>
                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={doc.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Download
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      Delete
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
