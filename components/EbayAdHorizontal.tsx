"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface EbayProduct {
  itemId: string;
  title: string;
  image: string;
  price: string;
  currency: string;
  itemAffiliateWebUrl: string;
}

interface EbayAdHorizontalProps {
  query?: string;
  limit?: number;
  title?: string;
}

export default function EbayAdHorizontal({
  query = "basketball cards",
  limit = 4,
  title = "Featured on eBay"
}: EbayAdHorizontalProps) {
  const [products, setProducts] = useState<EbayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch(`/api/ebay/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        const data = await response.json();

        if (data.success && data.products) {
          setProducts(data.products);
          setError(null);
        } else {
          setError(data.error || "Failed to load products");
        }
      } catch (err) {
        console.error("Error fetching eBay products:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [query, limit]);

  if (loading) {
    return (
      <div className="bg-white border-2 border-3pt-gold rounded-lg shadow-lg p-4 lg:p-6 my-8">
        <p className="text-sm text-3pt-dark-green font-bold mb-6 text-center uppercase tracking-wide">
          {title}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg border-2 border-gray-200 p-3 animate-pulse">
              <div className="w-full h-40 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null; // Don't show anything if there's an error in horizontal layout
  }

  return (
    <div className="bg-white border-2 border-3pt-gold rounded-lg shadow-lg p-4 lg:p-6 my-8">
      <p className="text-sm text-3pt-dark-green font-bold mb-6 text-center uppercase tracking-wide">
        {title}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <a
            key={product.itemId}
            href={product.itemAffiliateWebUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-3pt-gold hover:shadow-md transition-all duration-200 overflow-hidden group"
          >
            <div className="relative w-full h-40 bg-white">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full p-2">
                  <p className="text-xs text-gray-400 text-center">No Image Available</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-white">
              <p className="text-xs text-gray-900 font-semibold line-clamp-2 mb-2 leading-tight min-h-[32px]">
                {product.title}
              </p>
              <p className="text-base font-bold text-3pt-dark-green">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: product.currency,
                }).format(parseFloat(product.price))}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">View on eBay →</p>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-500 text-center font-medium">
          Sponsored Links
        </p>
      </div>
    </div>
  );
}
