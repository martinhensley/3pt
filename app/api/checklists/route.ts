import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all sets with filtering options for public checklists page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Filter parameters
    const search = searchParams.get("search") || "";
    const year = searchParams.get("year") || "";
    const manufacturer = searchParams.get("manufacturer") || "";
    const release = searchParams.get("release") || "";
    const type = searchParams.get("type") || "";
    const parallelFilter = searchParams.get("parallel") || "";

    // Sort parameters
    const sortBy = searchParams.get("sortBy") || "year";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause for filtering
    const where: any = {};

    // Enhanced search across multiple fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { release: { name: { contains: search, mode: 'insensitive' } } },
        { release: { manufacturer: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Year filter
    if (year) {
      where.release = {
        ...where.release,
        year,
      };
    }

    // Filter by set type
    if (type) {
      where.type = type;
    }

    // Parallel filter
    if (parallelFilter === "parallel") {
      where.isParallel = true;
    } else if (parallelFilter === "non-parallel") {
      where.isParallel = false;
    }

    // Filter by release or manufacturer
    if (release) {
      where.release = {
        ...where.release,
        id: release,
      };
    }

    if (manufacturer) {
      where.release = {
        ...where.release,
        manufacturerId: manufacturer,
      };
    }

    // Build orderBy clause
    let orderBy: any = [
      { release: { year: 'desc' } },
      { release: { name: 'asc' } },
      { name: 'asc' },
    ];

    if (sortBy === "name") {
      orderBy = [{ name: sortOrder }];
    } else if (sortBy === "release") {
      orderBy = [
        { release: { name: sortOrder } },
        { name: 'asc' },
      ];
    } else if (sortBy === "cardCount") {
      orderBy = [{ cards: { _count: sortOrder } }];
    } else if (sortBy === "year") {
      orderBy = [
        { release: { year: sortOrder } },
        { release: { name: 'asc' } },
        { name: 'asc' },
      ];
    }

    // Fetch sets with pagination
    const [sets, totalCount] = await Promise.all([
      prisma.set.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
      }),
      prisma.set.count({ where }),
    ]);

    return NextResponse.json({
      sets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get checklists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklists" },
      { status: 500 }
    );
  }
}
