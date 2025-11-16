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

    // If no slug or id, return paginated cards with search/filter support
    if (!slug && !id) {
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "50");
      const skip = (page - 1) * limit;

      // Get filter parameters
      const search = searchParams.get("search") || "";
      const year = searchParams.get("year") || "";
      const manufacturer = searchParams.get("manufacturer") || "";
      const setType = searchParams.get("setType") || "";
      const specialFeatures = searchParams.get("specialFeatures") || "";
      const sortBy = searchParams.get("sortBy") || "year";
      const sortOrder = searchParams.get("sortOrder") || "desc";

      // Build where clause
      const where: any = {};

      // Text search across multiple fields
      if (search) {
        where.OR = [
          { playerName: { contains: search, mode: 'insensitive' } },
          { team: { contains: search, mode: 'insensitive' } },
          { cardNumber: { contains: search, mode: 'insensitive' } },
          { set: { name: { contains: search, mode: 'insensitive' } } },
          { set: { release: { name: { contains: search, mode: 'insensitive' } } } },
        ];
      }

      // Year filter
      if (year) {
        where.set = {
          ...where.set,
          release: {
            ...where.set?.release,
            year,
          },
        };
      }

      // Manufacturer filter
      if (manufacturer) {
        where.set = {
          ...where.set,
          release: {
            ...where.set?.release,
            manufacturer: {
              name: manufacturer,
            },
          },
        };
      }

      // Set type filter
      if (setType) {
        where.set = {
          ...where.set,
          type: setType,
        };
      }

      // Special features filter
      if (specialFeatures === "autograph") {
        where.hasAutograph = true;
      } else if (specialFeatures === "memorabilia") {
        where.hasMemorabilia = true;
      } else if (specialFeatures === "numbered") {
        where.isNumbered = true;
      }

      // Build orderBy clause
      let orderBy: any = [{ createdAt: 'desc' }];

      if (sortBy === "player") {
        orderBy = [{ playerName: sortOrder }];
      } else if (sortBy === "team") {
        orderBy = [{ team: sortOrder }];
      } else if (sortBy === "cardNumber") {
        orderBy = [{ cardNumber: sortOrder }];
      } else if (sortBy === "year") {
        orderBy = [
          { set: { release: { year: sortOrder } } },
          { createdAt: 'desc' },
        ];
      }

      const [cards, totalCount] = await Promise.all([
        prisma.card.findMany({
          where,
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
          orderBy,
          skip,
          take: limit,
        }),
        prisma.card.count({ where }),
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
