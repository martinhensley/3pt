import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const postSchema = z.object({
  title: z.string().describe("An engaging, SEO-friendly title for the blog post"),
  excerpt: z.string().describe("A brief 1-2 sentence summary for the post preview"),
  content: z.string().describe("A detailed, engaging blog post (400-600 words) about the topic. Use HTML formatting with <p> tags for paragraphs, <strong> for emphasis, <h3> for section headings if needed, and <ul>/<li> for lists."),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await generateObject({
      model: anthropic("claude-3-haiku-20240307"),
      schema: postSchema,
      messages: [
        {
          role: "system",
          content: "You are an expert soccer/football card collector and blogger. Generate engaging, informative blog posts about soccer cards, card sets, and football card collecting that appeal to collectors and fans.",
        },
        {
          role: "user",
          content: `Write a detailed blog post about: ${prompt}\n\nThe post should be well-researched, informative, engaging, and appeal to soccer card collectors and fans.`,
        },
      ],
    });

    return NextResponse.json({
      title: result.object.title,
      excerpt: result.object.excerpt,
      content: result.object.content,
    });
  } catch (error) {
    console.error("Post generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate post" },
      { status: 500 }
    );
  }
}
