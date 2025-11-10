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

// Define schema for Excel checklist analysis
export const ExcelCardSchema = z.object({
  cardNumber: z.string(),
  setName: z.string(),
  playerName: z.string(),
  team: z.string(),
  position: z.string(),
  printRun: z.number(),
});

export const BaseSetSchema = z.object({
  name: z.string().describe('The base set name (without parallel indicators like "Electric Etch")'),
  type: z.enum(['Base', 'Insert', 'Autograph', 'Memorabilia']).describe('The set type classification'),
  description: z.string().describe('Brief description of what this set contains'),
  parallels: z.array(z.string()).describe('List of all parallel variations for this base set'),
});

export const ReleaseDetectionSchema = z.object({
  year: z.string().describe('Release year in YYYY or YYYY-YY format (e.g., "2024-25")'),
  manufacturer: z.string().describe('Manufacturer name (e.g., "Panini", "Topps")'),
  releaseName: z.string().describe('Release name without year/manufacturer (e.g., "Obsidian Soccer")'),
  sport: z.string().describe('Sport (e.g., "Soccer", "Basketball")'),
});

export const ExcelAnalysisSchema = z.object({
  release: ReleaseDetectionSchema.describe('Detected release information'),
  baseSets: z.array(BaseSetSchema).describe('All identified base sets (not parallels)'),
});

export type ExcelCard = z.infer<typeof ExcelCardSchema>;
export type BaseSet = z.infer<typeof BaseSetSchema>;
export type ReleaseDetection = z.infer<typeof ReleaseDetectionSchema>;
export type ExcelAnalysis = z.infer<typeof ExcelAnalysisSchema>;

// Genkit flow for analyzing Excel checklist data
export const analyzeExcelChecklistFlow = ai.defineFlow(
  {
    name: 'analyzeExcelChecklist',
    inputSchema: z.object({
      setNames: z.array(z.string()).describe('Unique set names found in the Excel file'),
      sampleCards: z.array(ExcelCardSchema).describe('Sample cards to help understand the data structure'),
    }),
    outputSchema: ExcelAnalysisSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: claude4Sonnet,
      output: {
        schema: ExcelAnalysisSchema,
      },
      prompt: `Analyze this card checklist and extract BOTH the release information AND the base sets with their parallels.

Set Names (${input.setNames.length} total):
${input.setNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

Sample Cards (for context):
${input.sampleCards.slice(0, 10).map(card => `${card.cardNumber} ${card.playerName} - ${card.setName} (${card.team}) /${card.printRun}`).join('\n')}

Your tasks:

**TASK 1: Detect Release Information**
From the set names and card data, determine:
- Year: Look for patterns like "2024-25" or "2024"
- Manufacturer: Common manufacturers are Panini, Topps, Upper Deck
- Release Name: The product name (e.g., "Obsidian Soccer", "Prizm", "Select")
- Sport: Soccer, Basketball, Football, Baseball, etc.

**TASK 2: Identify BASE sets (not parallels) and classify them**

Rules for Classification:

1. **Parallel Detection**:
   - Sets with "Electric Etch" + color/variant are PARALLELS of a base set
   - Example: "Obsidian Base Electric Etch Red Pulsar" is a parallel of "Obsidian Base"
   - Example: "Dual Jersey Ink Electric Etch Blue" is a parallel of "Dual Jersey Ink"
   - Base set name is what remains after removing "Electric Etch [variant]"

2. **Set Type Rules**:
   - "Base" type: Standard base sets (usually largest set, no special features in name)
   - "Autograph" type: Contains "Auto", "Autograph", "Ink", "Signature" in the name
   - "Memorabilia" type: Contains "Jersey", "Patch", "Material", "Relic", "Memorabilia" in the name
   - "Insert" type: Special insert sets (e.g., "Equinox", "Celestial", special themes)

3. **Hybrid Sets** (Autograph + Memorabilia):
   - "Dual Jersey Ink", "Jersey Autograph", etc. should be classified as "Autograph"
   - Autographs are rarer/more valuable, so prioritize that classification

4. **Grouping Parallels**:
   - For each base set, list ALL its parallel variations
   - Include the full parallel name (e.g., "Electric Etch Red Pulsar", "Electric Etch Orange")

5. **Return ONLY Base Sets**:
   - Do NOT include individual parallels as separate sets
   - Each base set entry should have its parallels listed in the "parallels" array

Examples:

Input set names:
- "Obsidian Base"
- "Obsidian Base Electric Etch Red Pulsar"
- "Obsidian Base Electric Etch Orange"
- "Dual Jersey Ink"
- "Dual Jersey Ink Electric Etch Blue"

Output:
{
  "baseSets": [
    {
      "name": "Obsidian Base",
      "type": "Base",
      "description": "The primary base set featuring standard player cards",
      "parallels": ["Obsidian Base Electric Etch Red Pulsar", "Obsidian Base Electric Etch Orange"]
    },
    {
      "name": "Dual Jersey Ink",
      "type": "Autograph",
      "description": "Autographed cards with dual jersey swatches",
      "parallels": ["Dual Jersey Ink Electric Etch Blue"]
    }
  ]
}

Now analyze the provided set names and return the base sets with their parallels.`,
    });

    if (!output) {
      throw new Error('Failed to generate Excel analysis');
    }

    return output;
  }
);
