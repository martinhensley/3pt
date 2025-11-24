"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DocumentType } from "@prisma/client";
import Image from "next/image";
import AdminLayout from "@/components/AdminLayout";

interface UsedInRelease {
  id: string;
  name: string;
  linkedAt: string;
  usageContext: string | null;
}

interface UsedInPost {
  id: string;
  title: string;
  linkedAt: string;
  usageContext: string | null;
}

interface SourceDocument {
  id: string;
  filename: string;
  displayName: string;
  blobUrl: string;
  mimeType: string;
  fileSize: number;
  documentType: DocumentType;
  tags: string[];
  extractedText: string | null;
  description: string | null;
  uploadedById: string;
  uploadedAt: string;
  lastUsedAt: string | null;
  usageCount: number;
  usedIn: {
    releases: UsedInRelease[];
    posts: UsedInPost[];
  };
}

export default function SourceDocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [document, setDocument] = useState<SourceDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editDocType, setEditDocType] = useState<DocumentType>("SELL_SHEET");
  const [saving, setSaving] = useState(false);

  // Fetch document details
  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/library/source-documents/${id}`);

      if (response.status === 401) {
        router.push("/admin");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to fetch document");
      }

      const data = await response.json();
      setDocument(data);
      setEditDisplayName(data.displayName);
      setEditDescription(data.description || "");
      setEditTags(data.tags.join(", "));
      setEditDocType(data.documentType);
      setError("");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to load document");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);

      const tagsArray = editTags.split(",").map((t) => t.trim()).filter(Boolean);

      const response = await fetch(`/api/admin/library/source-documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editDisplayName,
          description: editDescription || null,
          tags: tagsArray,
          documentType: editDocType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update document");
      }

      setEditing(false);
      fetchDocument();
    } catch (err) {
      setError("Failed to save changes");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/admin/library/source-documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      router.push("/admin/library/source-documents");
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

  // Get color for document type
  const getDocTypeColor = (type: DocumentType) => {
    const colors = {
      SELL_SHEET: "bg-green-100 text-green-800",
      CHECKLIST: "bg-green-100 text-green-800",
      PRESS_RELEASE: "bg-green-100 text-green-800",
      PRICE_GUIDE: "bg-yellow-100 text-yellow-800",
      IMAGE: "bg-pink-100 text-pink-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.OTHER;
  };

  if (loading) {
    return (
      <AdminLayout maxWidth="1600px">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-3pt-green"></div>
            <p className="mt-4 text-gray-600">Loading document...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!document) {
    return (
      <AdminLayout maxWidth="1600px">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-xl text-gray-600">Document not found</p>
            <button
              onClick={() => router.push("/admin/library/source-documents")}
              className="mt-4 text-3pt-green hover:text-green-700"
            >
              ← Back to Library
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout maxWidth="1600px">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin/library/source-documents")}
          className="text-3pt-green hover:text-green-700 mb-4 inline-block"
        >
          ← Back to Library
        </button>
      </div>

        {error && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              {/* Title and Type */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  {editing ? (
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      className="text-2xl font-bold text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-3pt-green"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{document.displayName}</h1>
                  )}
                  <p className="text-gray-600 mt-1">{document.filename}</p>
                </div>
                <div>
                  {editing ? (
                    <select
                      value={editDocType}
                      onChange={(e) => setEditDocType(e.target.value as DocumentType)}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-3pt-green"
                    >
                      <option value="SELL_SHEET">Sell Sheet</option>
                      <option value="CHECKLIST">Checklist</option>
                      <option value="PRESS_RELEASE">Press Release</option>
                      <option value="PRICE_GUIDE">Price Guide</option>
                      <option value="IMAGE">Image</option>
                      <option value="OTHER">Other</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDocTypeColor(document.documentType)}`}>
                      {document.documentType.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <a
                  href={document.blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-3pt-green text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download File
                </a>
                {editing ? (
                  <>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                {editing ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    placeholder="Add a description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-3pt-green"
                  />
                ) : (
                  <p className="text-gray-700">
                    {document.description || <span className="text-gray-400 italic">No description</span>}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Tags</h2>
                {editing ? (
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="2024, Topps, Chrome (comma-separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-3pt-green"
                  />
                ) : document.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No tags</p>
                )}
              </div>

              {/* Preview (for images) */}
              {document.mimeType.includes("image") && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Preview</h2>
                  <div className="relative w-full max-w-4xl">
                    <Image
                      src={document.blobUrl}
                      alt={document.displayName}
                      width={1200}
                      height={800}
                      className="rounded-lg shadow-lg w-full h-auto"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                </div>
              )}

              {/* Extracted Text (if available) */}
              {document.extractedText && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Extracted Text</h2>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {document.extractedText}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Metadata */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-600">File Size</dt>
                  <dd className="font-semibold text-gray-900">{formatFileSize(document.fileSize)}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">File Type</dt>
                  <dd className="font-semibold text-gray-900">{document.mimeType}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Uploaded</dt>
                  <dd className="font-semibold text-gray-900">
                    {new Date(document.uploadedAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">Uploaded By</dt>
                  <dd className="font-semibold text-gray-900">{document.uploadedById}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Usage Count</dt>
                  <dd className="font-semibold text-gray-900">{document.usageCount} times</dd>
                </div>
                {document.lastUsedAt && (
                  <div>
                    <dt className="text-gray-600">Last Used</dt>
                    <dd className="font-semibold text-gray-900">
                      {new Date(document.lastUsedAt).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Used In */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Used In</h2>

              {document.usedIn.releases.length === 0 && document.usedIn.posts.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Not used in any content yet</p>
              ) : (
                <div className="space-y-4">
                  {document.usedIn.releases.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Releases ({document.usedIn.releases.length})</h3>
                      <ul className="space-y-2">
                        {document.usedIn.releases.map((release) => (
                          <li key={release.id}>
                            <button
                              onClick={() => router.push(`/admin/edit-release/${release.id}`)}
                              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <p className="font-medium text-gray-900 text-sm">{release.name}</p>
                              {release.usageContext && (
                                <p className="text-xs text-gray-600 mt-1">{release.usageContext}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Linked {new Date(release.linkedAt).toLocaleDateString()}
                              </p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {document.usedIn.posts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Posts ({document.usedIn.posts.length})</h3>
                      <ul className="space-y-2">
                        {document.usedIn.posts.map((post) => (
                          <li key={post.id}>
                            <button
                              onClick={() => router.push(`/admin/edit-post/${post.id}`)}
                              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <p className="font-medium text-gray-900 text-sm">{post.title}</p>
                              {post.usageContext && (
                                <p className="text-xs text-gray-600 mt-1">{post.usageContext}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Linked {new Date(post.linkedAt).toLocaleDateString()}
                              </p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}
