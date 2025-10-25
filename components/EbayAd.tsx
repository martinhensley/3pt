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

interface EbayAdProps {
  query?: string;
  limit?: number;
  title?: string;
}

export default function EbayAd({
  query = "soccer cards",
  limit = 3,
  title = "Soccer Cards on eBay"
}: EbayAdProps) {
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
      <div className="bg-white border-2 border-footy-gold rounded-lg shadow-lg p-5 sticky top-4">
        <p className="text-sm text-footy-dark-green font-bold mb-4 text-center uppercase tracking-wide">
          {title}
        </p>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className="bg-white border-2 border-footy-gold rounded-lg shadow-lg p-5 sticky top-4">
        <p className="text-sm text-footy-dark-green font-bold mb-4 text-center uppercase tracking-wide">
          {title}
        </p>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-600">
            {error || "No products available"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-footy-gold rounded-lg shadow-lg p-5 sticky top-4">
      <p className="text-sm text-footy-dark-green font-bold mb-4 text-center uppercase tracking-wide">
        {title}
      </p>

      <div className="space-y-4">
        {products.map((product) => (
          <a
            key={product.itemId}
            href={product.itemAffiliateWebUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-footy-gold hover:shadow-md transition-all duration-200 overflow-hidden group"
          >
            <div className="relative w-full h-48 bg-white">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain p-3 group-hover:scale-105 transition-transform duration-200"
                  sizes="288px"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full p-3">
                  <p className="text-xs text-gray-400 text-center">No Image Available</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-white">
              <p className="text-sm text-gray-900 font-semibold line-clamp-2 mb-2 leading-tight">
                {product.title}
              </p>
              <p className="text-lg font-bold text-footy-dark-green">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: product.currency,
                }).format(parseFloat(product.price))}
              </p>
              <p className="text-xs text-gray-500 mt-1">View on eBay →</p>
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
