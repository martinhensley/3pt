import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch sets by releaseId
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const releaseId = searchParams.get("releaseId");

    if (!releaseId) {
      return NextResponse.json(
        { error: "releaseId is required" },
        { status: 400 }
      );
    }

    const sets = await prisma.set.findMany({
      where: { releaseId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sets);
  } catch (error) {
    console.error("Get sets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sets" },
      { status: 500 }
    );
  }
}

// POST - Create new set
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, totalCards, releaseId, parallels } = body;

    if (!name || !releaseId) {
      return NextResponse.json(
        { error: "name and releaseId are required" },
        { status: 400 }
      );
    }

    const set = await prisma.set.create({
      data: {
        name,
        totalCards: totalCards || null,
        releaseId,
        parallels: parallels && parallels.length > 0 ? parallels : null,
      },
    });

    return NextResponse.json(set);
  } catch (error) {
    console.error("Create set error:", error);
    return NextResponse.json(
      { error: "Failed to create set" },
      { status: 500 }
    );
  }
}

// PUT - Update existing set
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, totalCards, parallels } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Set ID is required" },
        { status: 400 }
      );
    }

    const set = await prisma.set.update({
      where: { id },
      data: {
        name,
        totalCards: totalCards || null,
        parallels: parallels && parallels.length > 0 ? parallels : null,
      },
    });

    return NextResponse.json(set);
  } catch (error) {
    console.error("Update set error:", error);
    return NextResponse.json(
      { error: "Failed to update set" },
      { status: 500 }
    );
  }
}

// DELETE - Delete set
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Set ID is required" },
        { status: 400 }
      );
    }

    // Delete associated cards first
    await prisma.card.deleteMany({
      where: { setId: id },
    });

    // Delete the set
    await prisma.set.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete set error:", error);
    return NextResponse.json(
      { error: "Failed to delete set" },
      { status: 500 }
    );
  }
}
