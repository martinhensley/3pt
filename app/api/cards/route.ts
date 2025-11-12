import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch card by slug or all cards for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    // If no slug or id, return paginated cards for admin panel
    if (!slug && !id) {
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "50");
      const skip = (page - 1) * limit;

      const [cards, totalCount] = await Promise.all([
        prisma.card.findMany({
          include: {
            set: {
              include: {
                parentSet: {
                  select: {
                    id: true,
                    type: true,
                  },
                },
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
          orderBy: [
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.card.count(),
      ]);

      return NextResponse.json({
        cards,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    }

    // Fetch card by id
    if (id) {
      const card = await prisma.card.findUnique({
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

// DELETE - Delete a card
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Delete the card
    await prisma.card.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete card error:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 }
    );
  }
}
