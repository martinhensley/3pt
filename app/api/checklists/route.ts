import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all sets with filtering options for public checklists page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const manufacturer = searchParams.get("manufacturer") || "";
    const release = searchParams.get("release") || "";
    const type = searchParams.get("type") || "";

    // Build where clause for filtering
    const where: any = {
      // Only include parent sets (exclude parallels)
      parentSetId: null,
    };

    // Search by set name
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Filter by set type
    if (type) {
      where.type = type;
    }

    // Filter by release or manufacturer (requires nested query)
    if (release || manufacturer) {
      where.release = {};

      if (release) {
        where.release.id = release;
      }

      if (manufacturer) {
        where.release.manufacturerId = manufacturer;
      }
    }

    // Fetch sets with release and manufacturer data, and card count
    const sets = await prisma.set.findMany({
      where,
      orderBy: [
        { release: { year: 'desc' } },
        { release: { name: 'asc' } },
        { name: 'asc' },
      ],
      include: {
        release: {
          include: {
            manufacturer: true,
          },
        },
        _count: {
          select: { cards: true },
        },
      },
    });

    return NextResponse.json(sets);
  } catch (error) {
    console.error("Get checklists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklists" },
      { status: 500 }
    );
  }
}
