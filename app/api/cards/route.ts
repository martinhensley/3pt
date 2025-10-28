import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addCardsToSet } from "@/lib/database";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch card by ID or slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (!id && !slug) {
      return NextResponse.json(
        { error: "Card ID or slug is required" },
        { status: 400 }
      );
    }

    let card;

    if (id) {
      // Fetch by ID
      card = await prisma.card.findUnique({
        where: { id },
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
            orderBy: { order: 'asc' }
          },
        },
      });
    } else if (slug) {
      // Fetch by slug - now that cards have slugs in the database
      card = await prisma.card.findUnique({
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
            orderBy: { order: 'asc' }
          },
        },
      });
    }

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

// POST - Add cards to a set
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { setId, cards } = body;

    if (!setId || !cards || !Array.isArray(cards)) {
      return NextResponse.json(
        { error: "setId and cards array are required" },
        { status: 400 }
      );
    }

    // Add cards to the set
    const result = await addCardsToSet(setId, cards);

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully added ${result.count} cards to the set`
    });
  } catch (error) {
    console.error("Add cards error:", error);
    return NextResponse.json(
      { error: "Failed to add cards" },
      { status: 500 }
    );
  }
}

// DELETE - Delete all cards from a set
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const setId = searchParams.get("setId");

    if (!setId) {
      return NextResponse.json(
        { error: "setId is required" },
        { status: 400 }
      );
    }

    // Delete all cards in the set
    const result = await prisma.card.deleteMany({
      where: { setId },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Deleted ${result.count} cards from the set`
    });
  } catch (error) {
    console.error("Delete cards error:", error);
    return NextResponse.json(
      { error: "Failed to delete cards" },
      { status: 500 }
    );
  }
}
