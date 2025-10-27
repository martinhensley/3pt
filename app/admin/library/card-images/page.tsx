"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminLayout from "@/components/AdminLayout";

interface CardImage {
  id: string;
  url: string;
  caption: string | null;
  order: number;
  createdAt: string;
  card: {
    id: string;
    displayName: string;
    playerName: string | null;
    cardNumber: string | null;
    variant: string | null;
    set: {
      id: string;
      name: string;
      release: {
        id: string;
        name: string;
        year: string | null;
      };
    };
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CardImagesLibraryPage() {
  const router = useRouter();
  const [images, setImages] = useState<CardImage[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch card images
  const fetchImages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/library/card-images?${params}`);

      // Handle unauthorized - redirect to login
      if (response.status === 401) {
        setLoading(false);
        router.push("/admin");
        return;
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || "Failed to fetch card images");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setImages(data.images);
      setPagination(data.pagination);
      setError("");
    } catch (err) {
      // Only set error if we're not redirecting
      const error = err as Error;
      if (error.message && !error.message.includes("redirect")) {
        setError(error.message || "Failed to load card images");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [pagination.page, sortBy, sortOrder]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchImages();
      } else {
        setPagination({ ...pagination, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Card Images Library</h1>
        <p className="text-gray-600">
          View all card images uploaded to the system
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
              <strong>Note:</strong> Card images are automatically added to this library when uploaded during card creation.
              This library provides a visual gallery of all card images in the system.
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by player name, card number, variant, or caption..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
            >
              <option value="createdAt">Upload Date</option>
              <option value="order">Order</option>
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

        {/* Images Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            <p className="mt-4 text-gray-600">Loading card images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-2">No card images yet</p>
            <p className="text-gray-500 text-sm">
              Card images will appear here automatically when you upload them during card creation.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push(`/admin/cards/${image.card.id}/edit`)}
                >
                  {/* Image */}
                  <div className="aspect-[3/4] bg-gray-100 relative">
                    <Image
                      src={image.url}
                      alt={image.card.displayName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                      {image.card.displayName}
                    </h3>

                    {image.caption && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                        {image.caption}
                      </p>
                    )}

                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="line-clamp-1">
                        <span className="font-semibold">Set:</span> {image.card.set.name}
                      </p>
                      <p className="line-clamp-1">
                        <span className="font-semibold">Release:</span> {image.card.set.release.name}
                        {image.card.set.release.year && ` (${image.card.set.release.year})`}
                      </p>
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(image.createdAt).toLocaleDateString()}
                    </p>
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
