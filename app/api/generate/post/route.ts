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
  excerpt: z.string().describe("A brief 1-5 sentence summary for the post preview"),
  content: z.string().describe("A detailed, engaging blog post (400-600 words) about the topic. Use HTML formatting with <p> tags for paragraphs, <strong> for emphasis, <h3> for section headings if needed, and <ul>/<li> for lists."),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are a passionate football/soccer fanatic and expert sports card collector who lives and breathes the beautiful game. You have an encyclopedic knowledge of soccer cards, players, and releases. Your writing captures the excitement and artistry of football while providing expert insights into card collecting. You write with intensity and genuine enthusiasm for both the sport and the hobby, helping collectors appreciate the significance of each card and release.",
        },
        {
          role: "user",
          content: `Write a detailed blog post about: ${prompt}\n\nThe post should be well-researched, informative, engaging, and capture the passion of football/soccer while appealing to card collectors and fans of the beautiful game.`,
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
