import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const postGenerationSchema = z.object({
  title: z.string().describe("An engaging, SEO-friendly title for the blog post"),
  content: z.string().describe(
    "A comprehensive blog post (400-800 words) written as Footy - a passionate Southern soccer fan who's absolutely obsessed with the beautiful game and collecting cards. " +
    "Write with Southern charm (use 'y'all,' 'reckon,' 'mighty fine,' 'bless your heart'), show genuine excitement about soccer and cards, use soccer metaphors, and be conversational like chatting with a buddy at the card shop. " +
    "Use HTML formatting with <p> tags for paragraphs, <strong> or <em> for emphasis, <h3> for section headings, and <ul>/<li> for lists. " +
    "The content should be informative, engaging, and demonstrate deep knowledge of both soccer and the card collecting hobby."
  ),
  excerpt: z.string().describe("A concise 1-3 sentence summary for the post preview that captures the essence and hooks readers"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    const postType = formData.get("postType") as string || "GENERAL";
    const imageFiles = formData.getAll("images") as File[];

    if (!prompt && imageFiles.length === 0) {
      return NextResponse.json(
        { error: "Please provide either a text prompt or images" },
        { status: 400 }
      );
    }

    // Prepare content for AI
    const contentParts: Array<any> = [];

    // Process images if provided
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        try {
          // Read file buffer
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // For images, convert to base64
          if (file.type.startsWith("image/")) {
            const base64 = buffer.toString("base64");
            const mimeType = file.type || "image/jpeg";
            contentParts.push({
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            });
          } else if (file.type === "application/pdf") {
            // For PDFs, save to temp file and add text description
            const tempDir = os.tmpdir();
            const tempPath = path.join(tempDir, `upload-${Date.now()}-${file.name}`);
            await writeFile(tempPath, buffer);

            contentParts.push({
              type: "text",
              text: `[PDF Document: ${file.name}]\nNote: PDF content analysis is limited. Please provide key details from the PDF in your text prompt for better results.`,
            });
          }
        } catch (error) {
          console.error("Error processing file:", error);
        }
      }
    }

    // Add text prompt
    let instruction = "";
    if (prompt && prompt.trim()) {
      instruction = prompt.trim();
    } else {
      instruction = "Analyze the provided image(s) and create an engaging blog post about soccer/football cards.";
    }

    // Add post type-specific guidance
    const postTypeGuidance: { [key: string]: string } = {
      NEWS: "This is a NEWS post - focus on breaking news, recent announcements, or timely updates about soccer cards. Be informative and current, covering the latest happenings in the hobby.",
      REVIEW: "This is a REVIEW post - provide an in-depth review of a product, set, or card. Discuss quality, design, value, chase cards, and give your honest opinion about whether collectors should pursue it.",
      GUIDE: "This is a GUIDE post - create an educational, how-to style piece that helps collectors learn something new. Be instructional and thorough, walking readers through the topic step-by-step.",
      ANALYSIS: "This is an ANALYSIS post - provide deep insights, data-driven observations, or expert commentary on trends, values, or the market. Be analytical while keeping your Southern charm.",
      GENERAL: "This is a GENERAL post - write in a conversational, blog-style format about anything related to soccer cards and collecting. Be entertaining and engaging.",
    };

    instruction += "\n\n" + (postTypeGuidance[postType] || postTypeGuidance.GENERAL);

    instruction += "\n\nYour task is to create a blog post as Footy - a passionate Southern soccer fan who absolutely loves the beautiful game and collecting cards. " +
      "Footy spent extended time in the British Commonwealth and attended the London School of Economics, which gives him a unique blend of Southern American charm mixed with proper football knowledge and international perspective. " +
      "Write with Southern charm and warmth (use phrases like 'y'all,' 'reckon,' 'mighty fine,' 'I tell you what'), occasionally reference your time abroad or LSE experience when relevant, " +
      "show genuine excitement about soccer and cards, use soccer metaphors, and be conversational like chatting with a buddy at the card shop. " +
      "The post should be 400-800 words and use proper HTML formatting.";

    contentParts.push({
      type: "text",
      text: instruction,
    });

    // Generate content using AI
    const result = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: postGenerationSchema,
      messages: [
        {
          role: "user",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: contentParts as any,
        },
      ],
    });

    return NextResponse.json({
      title: result.object.title,
      content: result.object.content,
      excerpt: result.object.excerpt,
      success: true,
    });
  } catch (error) {
    console.error("Generate content error:", error);

    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    console.error("Full error details:", errorDetails);

    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: errorDetails.message,
        debugInfo: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
