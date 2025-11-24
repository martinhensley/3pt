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
  expectedCardCount?: number;
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
  expectedCardCount?: number;
  features?: string[];
  cards?: CardInfo[]; // Optional: extracted card checklist
}

export interface ReleaseAnalysis {
  manufacturer: string;
  releaseName: string;
  year: string;
  sets: SetInfo[];
  features: string[];
  // Blog post fields
  title: string;
  content?: string; // Optional
  excerpt: string;
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
  content: z.string().describe("A detailed, informative blog post (300-500 words) about this basketball card. Cover the player's significance, card details, set information, and collectibility. Write in a professional but accessible tone. Use HTML formatting with <p> tags, <strong> for emphasis, and <ul>/<li> for lists."),
  excerpt: z.string().describe("A brief 1-5 sentence summary for the post preview"),
});

const setAnalysisSchema = z.object({
  title: z.string().describe("An engaging title for the blog post about this set"),
  setName: z.string().describe("Name of the card set"),
  manufacturer: z.string().describe("Card manufacturer/brand"),
  year: z.string().describe("Year or season"),
  expectedCardCount: z.number().optional().describe("Total number of cards in the set"),
  subsets: z.array(z.string()).optional().describe("List of subsets or insert sets"),
  features: z.array(z.string()).optional().describe("Notable features like autographs, memorabilia cards, parallels, etc."),
  notableCards: z.array(z.string()).optional().describe("Notable players or chase cards in the set"),
  content: z.string().describe("A comprehensive, informative blog post (400-600 words) about this basketball card set. Cover the set's place in the hobby, key subsets, notable cards, parallels, and why collectors should be interested. Write in a professional but accessible tone. Use HTML formatting with <p> tags, <strong> for emphasis, <h3> for subset headings, and <ul>/<li> for lists."),
  excerpt: z.string().describe("A brief 1-5 sentence summary for the post preview"),
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
            text: `Analyze this basketball card${backImageBase64 ? " (front and back images provided)" : ""}. Extract all visible details and create an engaging blog post about the card. Focus on what makes this card special for collectors and fans.`,
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
            text: `Analyze this basketball card set checklist${sellSheetImageBase64 ? " and sell sheet" : ""}. Extract all details about the set and create an engaging blog post. Focus on what makes this set appealing to collectors and its significance in the basketball card market.`,
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
  slug: z.string().describe("URL-friendly slug in format: year-manufacturer-release (lowercase, hyphenated)"),
  sets: z.array(
    z.object({
      name: z.string().describe("Name of the set within this release"),
      description: z.string().optional().describe("Brief description of this set"),
      expectedCardCount: z.preprocess(
        (val) => (val === null || val === undefined ? undefined : String(val)),
        z.string().optional()
      ).describe("Total number of cards in this set"),
      features: z.array(z.string()).optional().describe("Notable features like parallels, autographs, etc."),
      cards: z.array(
        z.object({
          playerName: z.string().describe("Player name on the card"),
          team: z.string().optional().describe("Team name"),
          cardNumber: z.string().describe("Card number or identifier"),
          variant: z.string().optional().describe("Variant info (parallel, refractor, serial #, etc.)"),
          setName: z.string().optional().describe("Which set this card belongs to (usually same as parent set)"),
        })
      ).optional().describe("Optional: Individual cards in this set if checklist is provided"),
    })
  ).describe("Array of sets included in this release"),
  features: z.array(z.string()).describe("Notable features of the overall release"),
  title: z.string().describe("Blog post title in format: {Manufacturer} {ReleaseName} {Year}"),
  content: z.string().optional().describe("Optional HTML blog post content"),
  excerpt: z.string().describe("Concise 1-5 sentence summary for preview"),
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
  expectedCardCount: z.number().optional().describe("Total number of cards in set"),
  subsets: z.array(z.string()).optional().describe("Subsets or insert sets"),
  features: z.array(z.string()).optional().describe("Notable features"),
  notableCards: z.array(z.string()).optional().describe("Notable players or chase cards"),
  content: z.string().describe("Blog post content with HTML formatting. Write in a professional but accessible tone, covering the set details, notable cards, and collectibility factors."),
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
    text: `Analyze these documents about a basketball card release. Extract structured information about the manufacturer, release name, year, sets included, and features.

CRITICAL - MANUFACTURER IDENTIFICATION:
- The MANUFACTURER is the parent company that produces the cards (e.g., Panini, Topps, Upper Deck, Leaf)
- Product lines like "Donruss", "Select", "Prizm", "Chrome" are NOT manufacturers - they are PRODUCT LINES
- Examples:
  * "Donruss Basketball" → Manufacturer: "Panini", Release: "Donruss Basketball"
  * "Topps Chrome" → Manufacturer: "Topps", Release: "Chrome"
  * "Upper Deck SP Authentic" → Manufacturer: "Upper Deck", Release: "SP Authentic"
  * "Leaf Metal" → Manufacturer: "Leaf", Release: "Metal"
- If uncertain, common basketball card manufacturers are: Panini, Topps, Upper Deck, Leaf

IMPORTANT - YEAR FORMAT:
- Use YYYY-YY format (e.g., "2024-25") for seasons spanning two calendar years
- Use YYYY format (e.g., "2024") for single calendar year releases
- The year represents the SEASON, not necessarily when the product was released
- Examples: "2024-25" for the 2024-2025 season, "2024" for releases covering only 2024

IMPORTANT - CARD EXTRACTION:
- For EACH set where a checklist or card list is provided in the documents, extract the individual cards
- Include player names, card numbers, teams, and variant information
- If a set has no checklist in the documents, just provide the set info (name, totalCards if known)
- This works for both vintage releases (1 base set with checklist) and modern releases (multiple sets, some with checklists)

You MUST also generate blog post content with the following requirements:
- **Title**: Use the exact format "{Manufacturer} {ReleaseName} {Year}" (e.g., "Panini Select Basketball 2024-25")
- **Description**: Write a concise 1-5 sentence summary that captures the essence of this release for collectors
- **Content**: Write in a professional but accessible tone. Your content should:
  * Be 600-1000 words (comprehensive and detailed)
  * Use proper HTML formatting with <p> tags for paragraphs
  * Use <strong> or <em> for emphasis on key features
  * Use <h3> for section headings for EACH set included in the release
  * Use <ul> and <li> for listing features, parallels, or notable cards

  **CRITICAL - SET INFORMATION REQUIREMENTS**:
  * You MUST include a dedicated section for EVERY set in the release
  * For each set, include:
    - Set name as an <h3> heading
    - Description of the set's theme, design, or focus
    - Total cards in the set (if known)
    - List of parallels/variations using <ul> and <li> tags
    - Notable features or chase cards
    - Rarity information (print runs, numbered cards, etc.)
  * Present set data in clear, informative ways:
    - Use comparisons ("twice as rare as last year's Gold parallel")
    - Add context ("only 99 copies exist worldwide")
    - Highlight scarcity ("limited to just 10 copies")
    - Compare across sets ("the Base set anchors the release with 200 cards, while the Kaboom! insert offers just 20")
  * Include statistics and numbers that collectors care about:
    - Card counts per set
    - Parallel print runs
    - Number of autograph variations
    - Insert odds or rarity levels

  **STRUCTURE YOUR CONTENT**:
  * Opening paragraph: Overview of the release and why it matters
  * Set-by-set breakdown: Dedicated section for each set with full details
  * Closing paragraph: Overall significance and collectability

  * Explain why this release matters to collectors
  * Reference player significance or historical context when relevant

Extract the data in this structure:
- manufacturer: The parent company (e.g., Panini, Topps, Upper Deck, Leaf) - NOT the product line
- releaseName: Name of the release/product line (e.g., "Donruss Basketball", "Select", "Prizm")
- year: Year or season in YYYY or YYYY-YY format (e.g., "2024" or "2024-25")
- slug: URL-friendly slug in format: year-manufacturer-release (lowercase, hyphenated, e.g., "2024-25-panini-donruss-basketball")
- sets: Array of sets, each with:
  - name: Set name
  - description: Optional description
  - expectedCardCount: Optional total (as string)
  - features: Optional array of features
  - cards: Optional array of cards (ONLY if checklist provided), each with:
    - playerName: Player name
    - team: Optional team
    - cardNumber: Card number
    - variant: Optional variant (parallel, etc.)
    - setName: Optional - which set this belongs to
- features: Array of notable features for the overall release
- title: REQUIRED - Use exact format: {Manufacturer} {ReleaseName} {Year}
- content: OPTIONAL - Quality HTML blog post content if needed
- excerpt: REQUIRED - Concise 1-5 sentence summary`,
  });

  const result = await generateObject({
    model: anthropic("claude-3-haiku-20240307"),
    schema: releaseAnalysisSchema,
    mode: 'json',
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

  let instruction = `Analyze these documents about a basketball card set. Extract the set name, details, and features.`;

  if (releaseContext) {
    instruction += ` This set is part of the following release: ${releaseContext}.`;
  }

  instruction += ` If checklists are provided, extract individual card information including player names, card numbers, teams, and variants. Generate an engaging blog post about the set.`;

  contentParts.push({
    type: "text",
    text: instruction,
  });

  const result = await generateObject({
    model: anthropic("claude-3-haiku-20240307"),
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

  let instruction = `Analyze this basketball card${backImageBase64 ? " (front and back images provided)" : ""}. Extract all visible details and create an engaging blog post about the card.`;

  if (setContext || releaseContext) {
    instruction += ` Context:`;
    if (releaseContext) instruction += ` Release: ${releaseContext}.`;
    if (setContext) instruction += ` Set: ${setContext}.`;
  }

  instruction += ` Focus on what makes this card special for collectors and fans.`;

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
            text: instruction,
          },
        ],
      },
    ],
  });

  return result.object;
}
