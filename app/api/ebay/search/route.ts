import { NextRequest, NextResponse } from "next/server";
import { searchBasketballCards } from "@/lib/ebay";

export const dynamic = "force-dynamic";

// Simple in-memory cache for eBay search results
// Key: query string, Value: { products, timestamp }
const searchCache = new Map<string, { products: any[]; timestamp: number }>();
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "basketball cards";
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    // Validate inputs
    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { success: false, error: "Limit must be between 1 and 20" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `${query}:${limit}`;
    const cached = searchCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
      console.log(`eBay cache hit for query: ${query}`);
      return NextResponse.json({
        success: true,
        products: cached.products,
        count: cached.products.length,
        cached: true,
      });
    }

    // Fetch from eBay API
    let products = await searchBasketballCards(query, limit);

    // Fallback logic: if specific query returns no results, try broader query
    if (products.length === 0 && query !== "basketball cards") {
      console.log(`No results for "${query}", trying fallback "basketball cards"`);
      products = await searchBasketballCards("basketball cards", limit);
    }

    // Cache the results
    if (products.length > 0) {
      searchCache.set(cacheKey, { products, timestamp: now });

      // Clean old cache entries (keep cache size reasonable)
      if (searchCache.size > 100) {
        const oldestKey = searchCache.keys().next().value;
        searchCache.delete(oldestKey);
      }
    }

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
      cached: false,
    });
  } catch (error) {
    console.error("eBay API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch eBay products",
      },
      { status: 500 }
    );
  }
}
