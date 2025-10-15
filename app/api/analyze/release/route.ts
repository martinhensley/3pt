import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import path from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Read image and convert to base64
    const imagePath = path.join(process.cwd(), "public", imageUrl);
    const imageBuffer = await readFile(imagePath);
    const imageBase64 = imageBuffer.toString("base64");

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Analyze this soccer/football card release document (sell sheet, catalog, or promotional material). Extract all visible details and create an engaging blog post about the release.

Return a JSON object with:
{
  "title": "Engaging title for the blog post",
  "excerpt": "Brief 1-2 sentence summary",
  "content": "Detailed 400-600 word blog post with HTML formatting (<p>, <strong>, <h3>, <ul>/<li>). Discuss the release, manufacturer, sets included, notable features, and significance to collectors.",
  "manufacturer": "Card manufacturer/brand name",
  "releaseName": "Name of the release",
  "year": "Year or season",
  "sets": ["Array of set names in this release"],
  "features": ["Notable features like autographs, parallels, inserts, etc."]
}`,
            },
          ],
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in response");
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Release analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze release" },
      { status: 500 }
    );
  }
}
