import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { ParsedDocument } from "./documentParser";
import { formatCSVForAI } from "./documentParser";
import { readFile } from "fs/promises";
import path from "path";

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

export interface CardInfo {
  playerName: string;
  team?: string;
  cardNumber: string;
  variant?: string;
  setName?: string; // Which set within the release this card belongs to
}

export interface SetInfo {
  name: string;
  description?: string;
  totalCards?: string;
  features?: string[];
}

export interface ReleaseAnalysis {
  manufacturer: string;
  releaseName: string;
  year: string;
  sets: SetInfo[];
  features: string[];
  // Optional blog post fields
  title?: string;
  content?: string;
  excerpt?: string;
}

export interface SetAnalysisWithCards extends SetAnalysis {
  cards?: CardInfo[];
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
    model: anthropic("claude-3-5-sonnet-20241022"),
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
    model: anthropic("claude-3-5-sonnet-20241022"),
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

// ===== New enhanced analysis functions =====

const releaseAnalysisSchema = z.object({
  manufacturer: z.string().describe("Card manufacturer/brand name (e.g., Panini, Topps, Upper Deck)"),
  releaseName: z.string().describe("Name of the release/product line"),
  year: z.string().describe("Year or season of the release"),
  sets: z.array(
    z.object({
      name: z.string().describe("Name of the set within this release"),
      description: z.string().optional().describe("Brief description of this set"),
      totalCards: z.string().optional().describe("Total number of cards in this set"),
      features: z.array(z.string()).optional().describe("Notable features like parallels, autographs, etc."),
    })
  ).describe("Array of sets included in this release"),
  features: z.array(z.string()).describe("Notable features of the overall release"),
  title: z.string().optional().describe("Engaging blog post title"),
  content: z.string().optional().describe("Blog post content with HTML formatting"),
  excerpt: z.string().optional().describe("Brief summary for preview"),
});

// Card checklist schema for extracting lists of cards
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cardChecklistSchema = z.array(
  z.object({
    playerName: z.string().describe("Player name on the card"),
    team: z.string().optional().describe("Team name"),
    cardNumber: z.string().describe("Card number or identifier"),
    variant: z.string().optional().describe("Variant info (parallel, refractor, serial #, etc.)"),
    setName: z.string().optional().describe("Which set this card belongs to"),
  })
);

const setAnalysisWithCardsSchema = z.object({
  title: z.string().describe("Engaging blog post title"),
  setName: z.string().describe("Name of the card set"),
  manufacturer: z.string().describe("Card manufacturer/brand"),
  year: z.string().describe("Year or season"),
  totalCards: z.string().optional().describe("Total number of cards in set"),
  subsets: z.array(z.string()).optional().describe("Subsets or insert sets"),
  features: z.array(z.string()).optional().describe("Notable features"),
  notableCards: z.array(z.string()).optional().describe("Notable players or chase cards"),
  content: z.string().describe("Blog post content with HTML formatting"),
  excerpt: z.string().describe("Brief summary"),
  cards: z.array(
    z.object({
      playerName: z.string(),
      team: z.string().optional(),
      cardNumber: z.string(),
      variant: z.string().optional(),
      setName: z.string().optional(),
    })
  ).optional().describe("Array of cards in this set (from checklist)"),
});

/**
 * Analyze multiple documents for release information
 * Can handle PDFs, CSVs, images, and HTML documents
 */
export async function analyzeReleaseDocuments(
  documents: ParsedDocument[]
): Promise<ReleaseAnalysis> {
  // Prepare content for AI analysis
  const contentParts: Array<{ type: string; text?: string; image?: URL }> = [];

  for (const doc of documents) {
    if (doc.type === "image") {
      // Read image and convert to base64
      try {
        // doc.content contains either a temp file path or a relative path
        let imagePath = doc.content as string;

        // If it's a relative path (starts with /), join with public directory
        if (imagePath.startsWith("/")) {
          imagePath = path.join(process.cwd(), "public", imagePath);
        }

        const imageBuffer = await readFile(imagePath);
        const imageBase64 = imageBuffer.toString("base64");
        contentParts.push({
          type: "image",
          image: new URL(`data:image/jpeg;base64,${imageBase64}`),
        });
      } catch (error) {
        console.error("Failed to read image:", error);
      }
    } else if (doc.type === "csv") {
      // Format CSV for readability
      const formatted = formatCSVForAI(doc.content as string[][]);
      contentParts.push({
        type: "text",
        text: `Document: ${doc.metadata?.filename}\n\n${formatted}`,
      });
    } else {
      // PDF, HTML, or text content
      contentParts.push({
        type: "text",
        text: `Document: ${doc.metadata?.filename}\n\n${doc.content}`,
      });
    }
  }

  // Add instruction text
  contentParts.push({
    type: "text",
    text: `Analyze these documents about a soccer/football card release. Extract structured information about the manufacturer, release name, year, sets included, and features. If checklists or card lists are provided, extract the sets they belong to. Generate an optional blog post if sufficient information is available.`,
  });

  const result = await generateObject({
    model: anthropic("claude-3-5-sonnet-20241022"),
    schema: releaseAnalysisSchema,
    messages: [
      {
        role: "user",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: contentParts as any,
      },
    ],
  });

  return result.object;
}

/**
 * Analyze set documents with release context
 * Can extract individual cards from checklists
 */
export async function analyzeSetDocumentsWithCards(
  documents: ParsedDocument[],
  releaseContext?: string
): Promise<SetAnalysisWithCards> {
  const contentParts: Array<{ type: string; text?: string; image?: URL }> = [];

  for (const doc of documents) {
    if (doc.type === "image") {
      try {
        // doc.content contains either a temp file path or a relative path
        let imagePath = doc.content as string;

        // If it's a relative path (starts with /), join with public directory
        if (imagePath.startsWith("/")) {
          imagePath = path.join(process.cwd(), "public", imagePath);
        }

        const imageBuffer = await readFile(imagePath);
        const imageBase64 = imageBuffer.toString("base64");
        contentParts.push({
          type: "image",
          image: new URL(`data:image/jpeg;base64,${imageBase64}`),
        });
      } catch (error) {
        console.error("Failed to read image:", error);
      }
    } else if (doc.type === "csv") {
      const formatted = formatCSVForAI(doc.content as string[][]);
      contentParts.push({
        type: "text",
        text: `Checklist CSV: ${doc.metadata?.filename}\n\n${formatted}`,
      });
    } else {
      contentParts.push({
        type: "text",
        text: `Document: ${doc.metadata?.filename}\n\n${doc.content}`,
      });
    }
  }

  let instruction = `Analyze these documents about a soccer/football card set. Extract the set name, details, and features.`;

  if (releaseContext) {
    instruction += ` This set is part of the following release: ${releaseContext}.`;
  }

  instruction += ` If checklists are provided, extract individual card information including player names, card numbers, teams, and variants. Generate an engaging blog post about the set.`;

  contentParts.push({
    type: "text",
    text: instruction,
  });

  const result = await generateObject({
    model: anthropic("claude-3-5-sonnet-20241022"),
    schema: setAnalysisWithCardsSchema,
    messages: [
      {
        role: "user",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: contentParts as any,
      },
    ],
  });

  return result.object;
}

/**
 * Analyze card images with Set and Release context
 */
export async function analyzeCardWithContext(
  frontImageBase64: string,
  backImageBase64?: string,
  setContext?: string,
  releaseContext?: string
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

  let instruction = `Analyze this soccer/football card${backImageBase64 ? " (front and back images provided)" : ""}. Extract all visible details and create an engaging blog post about the card.`;

  if (setContext || releaseContext) {
    instruction += ` Context:`;
    if (releaseContext) instruction += ` Release: ${releaseContext}.`;
    if (setContext) instruction += ` Set: ${setContext}.`;
  }

  instruction += ` Focus on what makes this card special for collectors and fans.`;

  const result = await generateObject({
    model: anthropic("claude-3-5-sonnet-20241022"),
    schema: cardAnalysisSchema,
    messages: [
      {
        role: "user",
        content: [
          ...images,
          {
            type: "text",
            text: instruction,
          },
        ],
      },
    ],
  });

  return result.object;
}
