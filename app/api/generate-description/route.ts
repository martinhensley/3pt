import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    const { manufacturer, releaseName, year, sets } = body;

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

    const prompt = `Generate a concise, engaging 1-5 sentence description for this soccer card release:

Release: ${manufacturer} ${releaseName} ${year}

${setsContext ? `Sets included:\n${setsContext}\n` : ""}

Write a brief summary (1-5 sentences) that:
- Captures the essence and appeal of this release for collectors
- Highlights key features or notable aspects
- Uses an enthusiastic but professional tone
- Does NOT use Southern dialect or "Footy" personality (this is for the description field, not the full content)
- Focuses on what makes this release special or collectible

Return ONLY the description text, no additional formatting or labels.`;

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
