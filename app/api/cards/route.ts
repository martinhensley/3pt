import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch card by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 }
      );
    }

    // Fetch card by slug
    const card = await prisma.card.findUnique({
      where: { slug },
      include: {
        set: {
          include: {
            release: {
              include: {
                manufacturer: true,
              },
            },
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Get card error:", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}
