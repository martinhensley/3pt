import { genkit, z } from 'genkit';
import { anthropic, claude4Sonnet } from 'genkitx-anthropic';

// Configure Genkit with Anthropic Claude
export const ai = genkit({
  plugins: [
    anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    }),
  ],
});

// Define schema for release extraction
export const ReleaseInfoSchema = z.object({
  manufacturer: z.string().describe('The manufacturer name (e.g., Panini, Topps)'),
  releaseName: z.string().describe('The release name without manufacturer or year'),
  year: z.string().describe('The release year in format YYYY or YYYY-YY (e.g., 2024, 2024-25)'),
  fullReleaseName: z.string().describe('Complete release name in format: Year Manufacturer ReleaseName (e.g., 2024-25 Panini Donruss Soccer)'),
  slug: z.string().describe('URL-friendly slug for the release'),
  releaseDate: z.string().nullable().describe('Official release date if mentioned in the document'),
});

export type ReleaseInfo = z.infer<typeof ReleaseInfoSchema>;

// Genkit flow for analyzing release documents (text-based)
export const analyzeReleaseFlow = ai.defineFlow(
  {
    name: 'analyzeRelease',
    inputSchema: z.object({
      documentText: z.string().describe('Extracted text from the uploaded document'),
    }),
    outputSchema: ReleaseInfoSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: claude4Sonnet,
      output: {
        schema: ReleaseInfoSchema,
      },
      prompt: `You are analyzing a soccer card release document (sell sheet, catalog, etc.).

Extract the following information from this document:

Document Text:
${input.documentText}

CRITICAL REQUIREMENTS:

1. Full Release Name Format: MUST be "Year Manufacturer ReleaseName"
   Examples:
   - "2024-25 Panini Donruss Soccer"
   - "2024-25 Topps Chrome UEFA Club Competitions"
   - "2023-24 Panini Obsidian Soccer"

2. Release date: Extract if explicitly mentioned (format: YYYY-MM-DD)

3. Slug: Create a URL-friendly version of the full release name

NOTE: Do NOT extract set information. Sets will be added later through the manage releases workflow.

Return the extracted information in the specified schema format.`,
    });

    if (!output) {
      throw new Error('Failed to generate release analysis');
    }

    return output;
  }
);

// Define schema for description generation
export const DescriptionSchema = z.object({
  description: z.string().describe('7-21 sentence description of the release'),
});

// Genkit flow for generating release descriptions
export const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescription',
    inputSchema: z.object({
      release: ReleaseInfoSchema,
      sourceText: z.string().describe('Original document text for reference'),
    }),
    outputSchema: DescriptionSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: claude4Sonnet,
      output: {
        schema: DescriptionSchema,
      },
      prompt: `You MUST generate a description that is EXACTLY 7-21 sentences long. Count each sentence carefully before submitting.

Generate a comprehensive, engaging description for this soccer card release based ONLY on the provided source document information.

Release: ${input.release.fullReleaseName}

Source Document Information:
${input.sourceText}

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

To meet the minimum 7 sentences, you should discuss:
- The overall release design philosophy and aesthetic
- Notable features or innovations in this release
- Parallel variations and their print runs (if mentioned)
- Special insert sets or chase cards (if mentioned)
- The player selection and key subjects (if mentioned)
- The appeal to collectors
- Any unique features or selling points
- The overall value proposition

Return ONLY the description text with paragraph breaks (double line breaks between paragraphs). No labels, no formatting, just the text.`,
    });

    if (!output) {
      throw new Error('Failed to generate description');
    }

    return output;
  }
);

