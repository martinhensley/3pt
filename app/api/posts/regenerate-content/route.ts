import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeReleaseDocuments } from "@/lib/ai";
import type { ParsedDocument } from "@/lib/documentParser";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Fetch the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        release: {
          include: {
            manufacturer: true,
            sets: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Only allow regeneration for RELEASE posts
    if (post.type !== "RELEASE") {
      return NextResponse.json(
        { error: "Content regeneration is only available for RELEASE posts" },
        { status: 400 }
      );
    }

    if (!post.release) {
      return NextResponse.json(
        { error: "No release data found for this post" },
        { status: 404 }
      );
    }

    // Prepare the release data for AI analysis
    // We'll create a ParsedDocument from the existing database data
    const releaseData = post.release;
    const documentContent = `
Release Information:
- Manufacturer: ${releaseData.manufacturer.name}
- Release Name: ${releaseData.name}
- Year: ${releaseData.year || 'Unknown'}

Sets in this Release:
${releaseData.sets.map((set, index) => `
${index + 1}. ${set.name}
   - Total Cards: ${set.totalCards || 'Unknown'}
   - Parallels/Features: ${set.parallels ? JSON.stringify(set.parallels) : 'None listed'}
`).join('\n')}
    `.trim();

    const parsedDocuments: ParsedDocument[] = [
      {
        type: 'text',
        content: documentContent,
        metadata: {
          filename: `${releaseData.manufacturer.name} ${releaseData.name} ${releaseData.year}.txt`,
        },
      },
    ];

    // Call AI to regenerate content
    const analysis = await analyzeReleaseDocuments(parsedDocuments);

    // Return the regenerated content
    return NextResponse.json({
      title: analysis.title,
      content: analysis.content,
      excerpt: analysis.excerpt,
      success: true,
    });
  } catch (error) {
    console.error("Regenerate content error:", error);

    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    console.error("Full error details:", errorDetails);

    return NextResponse.json(
      {
        error: "Failed to regenerate content",
        details: errorDetails.message,
        debugInfo: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
