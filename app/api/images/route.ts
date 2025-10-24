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
    const { releaseId, setId, cardId, postId, url, caption, order } = body;

    // Validate that exactly one foreign key is provided
    const foreignKeys = [releaseId, setId, cardId, postId].filter(Boolean);
    if (foreignKeys.length !== 1) {
      return NextResponse.json(
        { error: "Exactly one of releaseId, setId, cardId, or postId must be provided" },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    const image = await prisma.image.create({
      data: {
        releaseId: releaseId || null,
        setId: setId || null,
        cardId: cardId || null,
        postId: postId || null,
        url,
        caption: caption || null,
        order: order || 0,
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Failed to create image:", error);
    return NextResponse.json(
      { error: "Failed to create image" },
      { status: 500 }
    );
  }
}
