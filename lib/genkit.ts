/**
 * AI Analysis Functions using Anthropic SDK
 *
 * This module provides AI-powered analysis functions for releases and descriptions.
 * All functions use the Anthropic SDK directly for serverless compatibility.
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

// Define schema for description generation
export const DescriptionSchema = z.object({
  description: z.string().describe('7-21 sentence description of the release'),
});

/**
 * Analyze a release document and extract release information
 */
export async function analyzeRelease(input: {
  documentText?: string;
  documentUrl?: string;
  mimeType?: string;
}): Promise<ReleaseInfo> {
  // If we have a document URL, download and analyze it
  if (input.documentUrl && input.mimeType) {
    console.log('📄 Processing document:', {
      url: input.documentUrl,
      mimeType: input.mimeType
    });

    // Download the document
    const response = await fetch(input.documentUrl);
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Build message content
    const messageContent: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    // For PDFs, use document type
    if (input.mimeType === 'application/pdf') {
      console.log('📝 Analyzing PDF document...');
      messageContent.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64Data,
        },
      });
    } else {
      // For images, normalize MIME type
      let normalizedMimeType = input.mimeType;
      if (normalizedMimeType === 'image/jpg') {
        normalizedMimeType = 'image/jpeg';
      }

      console.log('🖼️  Analyzing image document...');
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: normalizedMimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: base64Data,
        },
      });
    }

    // Add the analysis prompt
    messageContent.push({
      type: 'text',
      text: `You are analyzing a soccer card release document (sell sheet, catalog, etc.).

Extract the following information from this document and return it as a JSON object:

CRITICAL REQUIREMENTS:

1. Full Release Name Format: MUST be "Year Manufacturer ReleaseName"
   Examples:
   - "2024-25 Panini Donruss Soccer"
   - "2024-25 Topps Chrome UEFA Club Competitions"
   - "2023-24 Panini Obsidian Soccer"

2. Release date: Extract if explicitly mentioned (format: YYYY-MM-DD)

3. Slug: Create a URL-friendly version of the full release name

NOTE: Do NOT extract set information. Sets will be added later through the manage releases workflow.

Return ONLY a JSON object with this structure:
{
  "manufacturer": "string",
  "releaseName": "string (without year/manufacturer)",
  "year": "string (YYYY or YYYY-YY)",
  "fullReleaseName": "string (Year Manufacturer ReleaseName)",
  "slug": "string (url-friendly)",
  "releaseDate": "string | null (YYYY-MM-DD format if found)"
}`,
    });

    // Call Anthropic API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
    });

    // Extract JSON from response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Anthropic response');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Anthropic response');
    }

    const output = JSON.parse(jsonMatch[0]);
    console.log('✅ Successfully analyzed document');
    return ReleaseInfoSchema.parse(output);
  }

  // Otherwise use text-based analysis
  if (!input.documentText) {
    throw new Error('Either documentText or documentUrl must be provided');
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are analyzing a soccer card release document (sell sheet, catalog, etc.).

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

Return ONLY a JSON object with this structure:
{
  "manufacturer": "string",
  "releaseName": "string (without year/manufacturer)",
  "year": "string (YYYY or YYYY-YY)",
  "fullReleaseName": "string (Year Manufacturer ReleaseName)",
  "slug": "string (url-friendly)",
  "releaseDate": "string | null (YYYY-MM-DD format if found)"
}`,
      },
    ],
  });

  // Extract JSON from response
  const textContent = message.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Anthropic response');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from Anthropic response');
  }

  const output = JSON.parse(jsonMatch[0]);
  console.log('✅ Successfully analyzed text');
  return ReleaseInfoSchema.parse(output);
}

/**
 * Generate a description for a release
 */
export async function generateDescription(input: {
  release: ReleaseInfo;
  sourceText: string;
}): Promise<{ description: string }> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You MUST generate a description that is EXACTLY 7-21 sentences long. Count each sentence carefully before submitting.

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
      },
    ],
  });

  // Extract text from response
  const textContent = message.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Anthropic response');
  }

  const description = textContent.text.trim();
  console.log('✅ Successfully generated description');

  return DescriptionSchema.parse({ description });
}

// Export legacy flow names for backward compatibility
export const analyzeReleaseFlow = analyzeRelease;
export const generateDescriptionFlow = generateDescription;
