import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CardAnalysis {
  title: string;
  content: string;
  excerpt: string;
  playerName?: string;
  team?: string;
  year?: string;
  manufacturer?: string;
  setName?: string;
  cardNumber?: string;
  variant?: string;
  features?: string[];
}

export interface SetAnalysis {
  title: string;
  content: string;
  excerpt: string;
  setName: string;
  manufacturer: string;
  year: string;
  totalCards?: string;
  subsets?: string[];
  features?: string[];
  notableCards?: string[];
}

const cardAnalysisSchema = z.object({
  title: z.string().describe("An engaging title for the blog post"),
  playerName: z.string().optional().describe("Player name on the card"),
  team: z.string().optional().describe("Team name"),
  year: z.string().optional().describe("Year or season"),
  manufacturer: z.string().optional().describe("Card manufacturer/brand"),
  setName: z.string().optional().describe("Set name"),
  cardNumber: z.string().optional().describe("Card number"),
  variant: z.string().optional().describe("Any variant info (parallel, refractor, etc.)"),
  features: z.array(z.string()).optional().describe("Notable features like autograph, jersey piece, serial numbering, etc."),
  content: z.string().describe("A detailed, engaging blog post (300-500 words) discussing the card, player significance, set details, and collectibility. Use HTML formatting with <p> tags, <strong> for emphasis, and <ul>/<li> for lists."),
  excerpt: z.string().describe("A brief 1-2 sentence summary for the post preview"),
});

const setAnalysisSchema = z.object({
  title: z.string().describe("An engaging title for the blog post about this set"),
  setName: z.string().describe("Name of the card set"),
  manufacturer: z.string().describe("Card manufacturer/brand"),
  year: z.string().describe("Year or season"),
  totalCards: z.string().optional().describe("Total number of cards in the set"),
  subsets: z.array(z.string()).optional().describe("List of subsets or insert sets"),
  features: z.array(z.string()).optional().describe("Notable features like autographs, memorabilia cards, parallels, etc."),
  notableCards: z.array(z.string()).optional().describe("Notable players or chase cards in the set"),
  content: z.string().describe("A comprehensive, engaging blog post (400-600 words) discussing the set, its place in the hobby, key subsets, notable cards, and why collectors should be interested. Use HTML formatting with <p> tags, <strong> for emphasis, <h3> for subset headings, and <ul>/<li> for lists."),
  excerpt: z.string().describe("A brief 1-2 sentence summary for the post preview"),
});

export async function analyzeCardImages(
  frontImageBase64: string,
  backImageBase64?: string
): Promise<CardAnalysis> {
  const images = [
    {
      type: "image" as const,
      image: new URL(`data:image/jpeg;base64,${frontImageBase64}`),
    },
  ];

  if (backImageBase64) {
    images.push({
      type: "image" as const,
      image: new URL(`data:image/jpeg;base64,${backImageBase64}`),
    });
  }

  const result = await generateObject({
    model: anthropic("claude-3-haiku-20240307"),
    schema: cardAnalysisSchema,
    messages: [
      {
        role: "user",
        content: [
          ...images,
          {
            type: "text",
            text: `Analyze this soccer/football card${backImageBase64 ? " (front and back images provided)" : ""}. Extract all visible details and create an engaging blog post about the card. Focus on what makes this card special for collectors and fans.`,
          },
        ],
      },
    ],
  });

  return result.object;
}

export async function analyzeSetDocuments(
  checklistImageBase64: string,
  sellSheetImageBase64?: string
): Promise<SetAnalysis> {
  const images = [
    {
      type: "image" as const,
      image: new URL(`data:image/jpeg;base64,${checklistImageBase64}`),
    },
  ];

  if (sellSheetImageBase64) {
    images.push({
      type: "image" as const,
      image: new URL(`data:image/jpeg;base64,${sellSheetImageBase64}`),
    });
  }

  const result = await generateObject({
    model: anthropic("claude-3-haiku-20240307"),
    schema: setAnalysisSchema,
    messages: [
      {
        role: "user",
        content: [
          ...images,
          {
            type: "text",
            text: `Analyze this soccer/football card set checklist${sellSheetImageBase64 ? " and sell sheet" : ""}. Extract all details about the set and create an engaging blog post. Focus on what makes this set appealing to collectors and its significance in the soccer card market.`,
          },
        ],
      },
    ],
  });

  return result.object;
}
