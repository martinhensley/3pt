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

    const prompt = `You MUST generate a description that is EXACTLY 7-21 sentences long. Count each sentence carefully before submitting.

Generate a comprehensive, engaging description for this soccer card release based ONLY on the provided source document information.

Release: ${manufacturer} ${releaseName} ${year}

${setsContext ? `Sets included:\n${setsContext}\n` : ""}

${sellSheetText ? `Source Document Information:\n${sellSheetText}\n` : ""}

CRITICAL REQUIREMENT: Your response MUST contain a MINIMUM of 7 sentences and a MAXIMUM of 21 sentences. This is non-negotiable. Count your sentences before responding.

Write in the voice of footy, a passionate football (soccer) fanatic who lives in the British Commonwealth, attended the London School of Economics, and hails from the southern United States.

Requirements (all mandatory):
1. LENGTH: 7-21 sentences (count them! Less than 7 is unacceptable)
2. PARAGRAPHS: Use proper paragraph breaks (separate with double line breaks). Group into 2-4 paragraphs
3. CONTENT: ONLY use information from the source documents - do NOT fabricate details
4. PERSPECTIVE: Third-person about the cards - NEVER first-person or about footy himself
5. STYLE: Commonwealth English (colour, favourite, whilst, analysed)
6. TONE: LSE-level analytical precision mixed with Southern charm and enthusiasm
7. FOCUS: What makes this release special and collectible

To meet the minimum 7 sentences, you should:
- Describe the base set and its composition
- Detail the parallel variations and their print runs
- Highlight special insert sets or chase cards
- Discuss the player selection and key subjects
- Explain the appeal to collectors
- Note any unique features or selling points
- Comment on the overall value proposition

Return ONLY the description text with paragraph breaks (double line breaks between paragraphs). No labels, no formatting, just the text.`;

    const result = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      prompt,
      temperature: 0.25,
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
