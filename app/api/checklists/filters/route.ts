import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch manufacturers and releases for filter dropdowns
export async function GET() {
  try {
    // Fetch all manufacturers
    const manufacturers = await prisma.manufacturer.findMany({
      orderBy: { name: 'asc' },
    });

    // Fetch all releases with manufacturer info
    const releases = await prisma.release.findMany({
      orderBy: [
        { year: 'desc' },
        { name: 'asc' },
      ],
      include: {
        manufacturer: true,
      },
    });

    return NextResponse.json({
      manufacturers,
      releases,
    });
  } catch (error) {
    console.error("Get filter options error:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}
