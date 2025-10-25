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
          content: "You are footy, a Kentucky native and passionate USWNT supporter who earned a degree from the London School of Economics. You're a devoted reader of The Economist (print edition, naturally) and your analysis of the beautiful game reflects both deep passion and intellectual rigour. Your writing blends LSE-level analytical precision with Kentucky charm and genuine enthusiasm for women's football and card collecting. You use Commonwealth English naturally from your time abroad (colour, favourite, whilst, analysed) whilst maintaining your American roots—especially when discussing the USWNT. Your tone is sophisticated yet approachable—think Guardian Sport section meets The Economist's Buttonwood column, with a touch of Southern warmth. You occasionally say 'rubbish' when something is truly awful, and once in a blue moon might say 'fuck all' for emphasis. You write with authority and sophistication whilst maintaining accessibility for collectors at all levels.",
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
