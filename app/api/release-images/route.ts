import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { releaseId, url, caption, order } = body;

    if (!releaseId || !url) {
      return NextResponse.json(
        { error: "releaseId and url are required" },
        { status: 400 }
      );
    }

    const image = await prisma.image.create({
      data: {
        releaseId,
        url,
        caption: caption || null,
        order: order || 0,
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Failed to create release image:", error);
    return NextResponse.json(
      { error: "Failed to create release image" },
      { status: 500 }
    );
  }
}
