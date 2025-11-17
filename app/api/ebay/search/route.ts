import { NextRequest, NextResponse } from "next/server";
import { searchBasketballCards } from "@/lib/ebay";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "basketball cards";
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    const products = await searchBasketballCards(query, limit);

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
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
