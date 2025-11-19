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
  documentUrls?: string[];
  mimeType?: string;
}): Promise<ReleaseInfo> {
  // Support both single URL and multiple URLs
  const urlsToProcess = input.documentUrls || (input.documentUrl ? [input.documentUrl] : []);

  // If we have document URLs, download and analyze them
  if (urlsToProcess.length > 0 && input.mimeType) {
    console.log(`📄 Processing ${urlsToProcess.length} document(s)`);

    // Build message content
    const messageContent: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    // Download and add each document to the message content
    for (const [index, url] of urlsToProcess.entries()) {
      console.log(`📥 Downloading document ${index + 1}/${urlsToProcess.length}:`, url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download document ${index + 1}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');

      // Determine mime type from the URL or use the provided one
      let docMimeType = input.mimeType;

      // For PDFs, use document type
      if (docMimeType === 'application/pdf') {
        console.log(`📝 Adding PDF document ${index + 1} to analysis...`);
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
        let normalizedMimeType = docMimeType;
        if (normalizedMimeType === 'image/jpg') {
          normalizedMimeType = 'image/jpeg';
        }

        console.log(`🖼️  Adding image document ${index + 1} to analysis...`);
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: normalizedMimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64Data,
          },
        });
      }
    }

    // Add the analysis prompt
    messageContent.push({
      type: 'text',
      text: `You are analyzing ${urlsToProcess.length > 1 ? `${urlsToProcess.length} basketball card release documents` : 'a basketball card release document'} (sell sheet, catalog, etc.).${urlsToProcess.length > 1 ? ' These documents are part of the same release and may be spread across multiple pages or images.' : ''}

Extract the following information from this document and return it as a JSON object:

CRITICAL REQUIREMENTS:

1. Full Release Name Format: MUST be "Year Manufacturer ReleaseName"
   Examples:
   - "2024-25 Panini Prizm Basketball"
   - "2024-25 Topps Chrome NBA"
   - "2023-24 Panini Obsidian Basketball"

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
        content: `You are analyzing a basketball card release document (sell sheet, catalog, etc.).

Extract the following information from this document:

Document Text:
${input.documentText}

CRITICAL REQUIREMENTS:

1. Full Release Name Format: MUST be "Year Manufacturer ReleaseName"
   Examples:
   - "2024-25 Panini Prizm Basketball"
   - "2024-25 Topps Chrome NBA"
   - "2023-24 Panini Obsidian Basketball"

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
 * Generate a summary for a release
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
        content: `You MUST generate a release summary that is EXACTLY 3-11 sentences long. Count each sentence carefully before submitting.

Generate a concise, engaging summary for this basketball card release. Use the source document information as your foundation, but leverage your expert knowledge of basketball cards to provide holistic context.

Release: ${input.release.fullReleaseName}

Source Document Information:
${input.sourceText}

CRITICAL REQUIREMENT: Your response MUST contain a MINIMUM of 3 sentences and a MAXIMUM of 11 sentences. This is non-negotiable. Count your sentences before responding.

Write as a relaxed, professional basketball analyst who knows the game inside and out. Think of the tone as a knowledgeable analyst breaking down a game on a podcast - informative but conversational, insightful but approachable.

Requirements (all mandatory):
1. LENGTH: 3-11 sentences (count them! Less than 3 is unacceptable)
2. PARAGRAPHS: Use proper paragraph breaks (separate with double line breaks). Group into 1-3 paragraphs
3. CONTENT: This is a SUMMARY of the release. Use source materials as the foundation, but add expert context about:
   - How this release compares to previous years
   - Notable changes or innovations in the product line
   - Industry trends this release reflects or responds to
   - What makes this release significant for collectors
4. PERSPECTIVE: Third-person summary with expert insights
5. STYLE: Relaxed professional - basketball terminology, accessible language, conversational but knowledgeable
6. TONE: Informative and engaging, like a veteran analyst explaining a product to fellow collectors
7. FOCUS: What's in this release and why it matters in the broader context

Provide a concise summary covering:
- The core offering and what makes it notable
- Key sets, parallels, or chase elements worth mentioning
- How this fits into the product line's evolution or the year's releases
- Why collectors should care (brief context)

Return ONLY the summary text with paragraph breaks (double line breaks between paragraphs). No labels, no formatting, just the text.`,
      },
    ],
  });

  // Extract text from response
  const textContent = message.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Anthropic response');
  }

  const description = textContent.text.trim();
  console.log('✅ Successfully generated summary');

  return DescriptionSchema.parse({ description });
}

// Export legacy flow names for backward compatibility
export const analyzeReleaseFlow = analyzeRelease;
export const generateDescriptionFlow = generateDescription;
