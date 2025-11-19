import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { prepareDocumentsForAI, fetchDocumentContent } from "@/lib/documentProcessor";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for document processing

export async function POST(request: NextRequest) {
  console.log('[generate-review] POST request received');
  try {
    console.log('[generate-review] Checking session...');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('[generate-review] Unauthorized - no session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('[generate-review] Session OK');

    console.log('[generate-review] Parsing request body...');
    const body = await request.json();
    const { manufacturer, releaseName, year, sets, releaseId } = body;
    console.log('[generate-review] Body parsed:', { manufacturer, releaseName, year, releaseId, setCount: sets?.length });

    if (!manufacturer || !releaseName || !year) {
      console.log('[generate-review] Missing required fields');
      return NextResponse.json(
        { error: "manufacturer, releaseName, and year are required" },
        { status: 400 }
      );
    }

    // If releaseId provided, prepare source documents for AI
    let documentsForAI: Array<{ type: 'image' | 'file'; source: string | Buffer; mimeType: string }> = [];
    let documentNames: string[] = [];

    if (releaseId) {
      console.log('[generate-review] Fetching release and source documents...');
      const release = await prisma.release.findUnique({
        where: { id: releaseId },
        include: {
          sourceDocuments: {
            select: {
              filename: true,
              displayName: true,
              blobUrl: true,
              mimeType: true,
              documentType: true,
            }
          }
        }
      });
      console.log('[generate-review] Release fetched, source docs count:', release?.sourceDocuments?.length || 0);

      // Prepare source documents if available
      if (release?.sourceDocuments && release.sourceDocuments.length > 0) {
        console.log(`[generate-review] Found ${release.sourceDocuments.length} source documents`);

        // Filter and prepare documents (excludes checklists, keeps only supported formats)
        const preparedDocs = prepareDocumentsForAI(release.sourceDocuments);

        console.log(`[generate-review] Prepared ${preparedDocs.length} documents for AI (excluded checklists and unsupported formats)`);

        // Fetch and prepare each document for Claude
        for (const doc of preparedDocs) {
          try {
            console.log(`[generate-review] Fetching document: ${doc.displayName} (${doc.documentType})`);
            const buffer = await fetchDocumentContent(doc.blobUrl);
            console.log(`[generate-review] Document fetched, size: ${buffer.length} bytes`);
            const base64 = buffer.toString('base64');
            console.log(`[generate-review] Base64 encoded, length: ${base64.length} chars`);

            // Add to list of documents being processed
            documentNames.push(`${doc.displayName} (${doc.documentType})`);

            // Claude SDK supports images and PDFs via base64
            if (doc.mimeType.startsWith('image/')) {
              documentsForAI.push({
                type: 'image',
                source: base64,
                mimeType: doc.mimeType,
              });
              console.log(`[generate-review] Added image document: ${doc.displayName}`);
            } else if (doc.mimeType === 'application/pdf') {
              documentsForAI.push({
                type: 'file',
                source: base64,
                mimeType: 'application/pdf',
              });
              console.log(`[generate-review] Added PDF document: ${doc.displayName}`);
            } else if (doc.mimeType === 'text/plain' || doc.mimeType === 'text/csv') {
              // For text files, we can include them as text content
              const textContent = buffer.toString('utf-8');
              console.log(`[generate-review] Skipping text file: ${doc.displayName}`);
              // We'll add this to the prompt directly instead
            }
          } catch (error) {
            console.error(`[generate-review] Failed to fetch document ${doc.filename}:`, error);
          }
        }

        console.log(`[generate-review] Successfully loaded ${documentsForAI.length} documents for Claude`);
      } else {
        console.log('[generate-review] No source documents found for this release');
      }
    }

    // Build context about the sets
    console.log('[generate-review] Building sets context...');
    const setsContext = sets && sets.length > 0
      ? sets.map((set: { name: string; totalCards?: string; features?: string[] }) => {
          let setDesc = `- ${set.name}`;
          if (set.totalCards) setDesc += ` (${set.totalCards} cards)`;
          if (set.features && set.features.length > 0) {
            setDesc += `: ${set.features.slice(0, 3).join(", ")}`;
          }
          return setDesc;
        }).join("\n")
      : "";
    console.log('[generate-review] Sets context built, length:', setsContext.length);

    // Build the content array for Claude
    console.log('[generate-review] Building content array for Claude...');
    const content: Array<any> = [];

    // Add documents first (PDFs and images)
    for (const doc of documentsForAI) {
      if (doc.type === 'image') {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: doc.mimeType,
            data: doc.source,
          },
        });
      } else if (doc.type === 'file') {
        content.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: doc.source,
          },
        });
      }
    }
    console.log('[generate-review] Added', documentsForAI.length, 'documents to content array');

    // Add the text prompt
    const textPrompt = `You MUST generate a release summary that is EXACTLY 3-11 sentences long. Count each sentence carefully before submitting.

${documentNames.length > 0 ? `I've attached ${documentNames.length} source documents: ${documentNames.join(', ')}. Please review these documents and use their content as the primary foundation for the summary.\n\n` : ''}

Generate a concise, engaging summary for this basketball card release:

Release: ${manufacturer} ${releaseName} ${year}

${setsContext ? `Sets included:\n${setsContext}\n\n` : ""}

CRITICAL REQUIREMENT: Your response MUST contain a MINIMUM of 3 sentences and a MAXIMUM of 11 sentences. This is non-negotiable. Count your sentences before responding.

Write as a relaxed, professional basketball analyst who knows the game inside and out. Think of the tone as a knowledgeable analyst breaking down a game on a podcast - informative but conversational, insightful but approachable.

Requirements (all mandatory):
1. LENGTH: 3-11 sentences (count them! Less than 3 is unacceptable)
2. PARAGRAPHS: Use proper paragraph breaks (separate with double line breaks). Group into 1-3 paragraphs
3. CONTENT: This is a SUMMARY of the release. ${documentNames.length > 0 ? 'Use the attached source documents as the foundation' : 'Use your expert knowledge'}, but add expert context about:
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

Return ONLY the summary text with paragraph breaks (double line breaks between paragraphs). No labels, no formatting, just the text.`;

    content.push({
      type: 'text',
      text: textPrompt,
    });
    console.log('[generate-review] Text prompt added to content array');
    console.log('[generate-review] Total content blocks:', content.length);

    // Use the prompt parameter with experimental_providerMetadata for documents
    console.log('[generate-review] Calling Claude API...');
    const startTime = Date.now();

    // If we have documents, we need to use the Anthropic SDK directly
    // because the AI SDK doesn't support document blocks yet
    let generatedText: string;

    if (documentsForAI.length > 0) {
      console.log('[generate-review] Using Anthropic SDK directly for document support');
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0.25,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      });

      generatedText = message.content[0].type === 'text' ? message.content[0].text : '';
    } else {
      // No documents, use AI SDK's generateText
      console.log('[generate-review] Using AI SDK generateText (no documents)');
      const result = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        prompt: textPrompt,
        temperature: 0.25,
      });
      generatedText = result.text;
    }

    const elapsed = Date.now() - startTime;
    console.log('[generate-review] Claude API call completed in', elapsed, 'ms');
    console.log('[generate-review] Generated text length:', generatedText.length);

    return NextResponse.json({
      excerpt: generatedText.trim(),
    });
  } catch (error) {
    console.error("Review generation error:", error);

    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    console.error("Full error details:", errorDetails);

    return NextResponse.json(
      {
        error: "Failed to generate review",
        details: errorDetails.message,
      },
      { status: 500 }
    );
  }
}
