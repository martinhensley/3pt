import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { manufacturer, releaseName, year, sets, releaseId } = body;

    // If releaseId provided, fetch the release with source information
    let sellSheetText = "";
    if (releaseId) {
      const release = await prisma.release.findUnique({
        where: { id: releaseId },
        select: { sellSheetText: true },
      });
      sellSheetText = release?.sellSheetText || "";
    }

    if (!manufacturer || !releaseName || !year) {
      return NextResponse.json(
        { error: "manufacturer, releaseName, and year are required" },
        { status: 400 }
      );
    }

    // Build context about the sets
    const setsContext = sets && sets.length > 0
      ? sets.map((set: { name: string; totalCards?: string; features?: string[] }) => {
          let setDesc = `- ${set.name}`;
          if (set.totalCards) setDesc += ` (${set.totalCards} cards)`;
          if (set.features && set.features.length > 0) {
            setDesc += `: ${set.features.slice(0, 3).join(", ")}`;
          }
          return setDesc;
        }).join("\n")
      : "";

    const prompt = `Generate a comprehensive, engaging 7-21 sentence description for this soccer card release based ONLY on the provided source document information.

Release: ${manufacturer} ${releaseName} ${year}

${setsContext ? `Sets included:\n${setsContext}\n` : ""}

${sellSheetText ? `Source Document Information:\n${sellSheetText}\n` : ""}

Write in the voice of footy, a passionate football (soccer) fanatic who lives in the British Commonwealth, attended the London School of Economics, and hails from the southern United States. Your description should:
- Be 7-21 sentences in length (REQUIRED - count carefully and ensure you write at least 7 sentences)
- Use proper paragraph breaks (separate paragraphs with double line breaks)
- Group related thoughts into natural paragraphs (2-4 paragraphs ideal)
- ONLY include information from the source documents provided above - do NOT make up features or details
- Focus entirely on the cards and release - NEVER talk about yourself or footy's perspective
- Write in third-person about the cards, not first-person commentary
- Capture the essence and appeal of this release for collectors
- Highlight key features or notable aspects found in the source materials
- Use Commonwealth English naturally (colour, favourite, whilst, analysed)
- Blend LSE-level analytical precision with Southern charm and genuine enthusiasm
- Write with authority and sophistication whilst maintaining accessibility for collectors at all levels
- Focus on what makes this release special or collectible based on the source information
- Expand on the features, parallels, and notable aspects to ensure sufficient detail and reach the minimum sentence count

Return ONLY the description text with paragraph breaks (use double line breaks between paragraphs), no additional formatting or labels.`;

    const result = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      prompt,
    });

    return NextResponse.json({
      excerpt: result.text.trim(),
    });
  } catch (error) {
    console.error("Description generation error:", error);

    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    console.error("Full error details:", errorDetails);

    return NextResponse.json(
      {
        error: "Failed to generate description",
        details: errorDetails.message,
      },
      { status: 500 }
    );
  }
}
