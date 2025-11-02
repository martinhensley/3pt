import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeReleaseDocuments, type ReleaseAnalysis } from "@/lib/ai";
import { parseDocuments } from "@/lib/documentParser";
import {
  getOrCreateManufacturer,
  createReleaseWithSets,
  addCardsToSet,
} from "@/lib/database";
import { renderPDFPagesToImages } from "@/lib/pdfImageExtractor";
import { put } from "@vercel/blob";
import path from "path";
import { tmpdir } from "os";
import { writeFile, mkdir } from "fs/promises";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { files, createDatabaseRecords = false, analysisData } = body;
    // files: Array<{ url: string, type?: 'image' | 'pdf' | 'csv' | 'html' }>
    // createDatabaseRecords: boolean (default false) - whether to create Manufacturer/Release/Set records
    // analysisData: optional pre-analyzed data (if provided, skip AI analysis)

    let analysis;

    // Store original files and parsed content for database storage
    let sellSheetText: string | undefined;
    let sourceFiles: Array<{ url: string; type: string; filename?: string }> | undefined;
    let extractedImageUrls: string[] = [];

    // If analysisData is provided, use it directly (for creating DB records after analysis)
    if (analysisData) {
      analysis = analysisData;
      // Get sell sheet data if it was passed through
      sellSheetText = analysisData.sellSheetText;
      sourceFiles = analysisData.sourceFiles;
      extractedImageUrls = analysisData.extractedImageUrls || [];
    } else {
      // Otherwise, perform analysis
      if (!files || !Array.isArray(files) || files.length === 0) {
        return NextResponse.json(
          { error: "At least one file is required" },
          { status: 400 }
        );
      }

      // Parse all documents
      const parsedDocuments = await parseDocuments(files);

      // Combine all parsed text for sell sheet storage
      sellSheetText = parsedDocuments
        .map(doc => {
          if (typeof doc.content === 'string') {
            return doc.content;
          } else if (Array.isArray(doc.content)) {
            // For CSV/table data, convert to readable text
            return doc.content.map(row => row.join(' | ')).join('\n');
          }
          return '';
        })
        .join('\n\n---\n\n');

      // Store source file references
      sourceFiles = files.map((file: { url: string; type?: string }, index: number) => ({
        url: file.url,
        type: file.type || parsedDocuments[index]?.type || 'unknown',
        filename: parsedDocuments[index]?.metadata?.filename,
      }));

      // Extract images from PDF files and upload to Vercel Blob
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const parsedDoc = parsedDocuments[i];

        if (file.type === 'pdf' || parsedDoc?.type === 'pdf') {
          try {
            console.log(`Extracting images from PDF: ${file.url}`);

            // Download PDF to temp location
            const tempDir = path.join(tmpdir(), 'footy-pdf-extraction');
            await mkdir(tempDir, { recursive: true });

            const response = await fetch(file.url);
            if (!response.ok) {
              console.warn(`Failed to download PDF: ${response.statusText}`);
              continue;
            }

            const pdfBuffer = Buffer.from(await response.arrayBuffer());
            const tempPdfPath = path.join(tempDir, `temp-${Date.now()}.pdf`);
            await writeFile(tempPdfPath, pdfBuffer);

            // Render PDF pages as high-quality images
            const renderedPages = await renderPDFPagesToImages(tempPdfPath, {
              scale: 3.0, // High quality rendering (3x resolution)
            });
            console.log(`Rendered ${renderedPages.length} PDF pages as images`);

            // Upload each rendered page to Vercel Blob
            for (let imgIndex = 0; imgIndex < renderedPages.length; imgIndex++) {
              const image = renderedPages[imgIndex];
              const filename = `release-page-${image.pageNumber}.${image.format}`;

              try {
                const blob = await put(filename, image.buffer, {
                  access: 'public',
                  contentType: `image/${image.format}`,
                });

                extractedImageUrls.push(blob.url);
                console.log(`Uploaded image: ${blob.url}`);
              } catch (uploadError) {
                console.warn(`Failed to upload image ${filename}:`, uploadError);
              }
            }
          } catch (extractError) {
            console.warn(`Failed to extract images from PDF ${file.url}:`, extractError);
            // Continue with other files
          }
        }
      }

      console.log(`Total extracted images: ${extractedImageUrls.length}`);

      // Analyze with AI
      analysis = await analyzeReleaseDocuments(parsedDocuments);

      // Attach sell sheet data and extracted images to analysis for potential later use
      (analysis as ReleaseAnalysis & {
        sellSheetText?: string;
        sourceFiles?: Array<{ url: string; type: string; filename?: string }>;
        extractedImageUrls?: string[];
      }).sellSheetText = sellSheetText;
      (analysis as ReleaseAnalysis & {
        sellSheetText?: string;
        sourceFiles?: Array<{ url: string; type: string; filename?: string }>;
        extractedImageUrls?: string[];
      }).sourceFiles = sourceFiles;
      (analysis as ReleaseAnalysis & {
        sellSheetText?: string;
        sourceFiles?: Array<{ url: string; type: string; filename?: string }>;
        extractedImageUrls?: string[];
      }).extractedImageUrls = extractedImageUrls;
    }

    // Create database records if requested
    let createdRecords = null;
    if (createDatabaseRecords) {
      try {
        // Get or create manufacturer
        const manufacturer = await getOrCreateManufacturer(
          analysis.manufacturer
        );

        // Create release with sets
        const release = await createReleaseWithSets(
          manufacturer.id,
          {
            name: analysis.releaseName,
            year: analysis.year,
            slug: analysis.slug,
            description: analysis.excerpt,
            releaseDate: analysis.releaseDate ? new Date(analysis.releaseDate) : null,
            sellSheetText,
            sourceFiles,
          },
          analysis.sets.map((set: { name: string; totalCards?: string; features?: string[] }) => ({
            name: set.name,
            totalCards: set.totalCards,
            parallels: set.features || [],
          }))
        );

        // Create cards for each set if cards were extracted
        const cardsCreated: { [setName: string]: number } = {};
        for (let i = 0; i < analysis.sets.length; i++) {
          const setInfo = analysis.sets[i];
          const createdSet = release.sets[i]; // Sets are created in same order

          if (setInfo.cards && setInfo.cards.length > 0) {
            const result = await addCardsToSet(
              createdSet.id,
              setInfo.cards.map((card: { playerName?: string; team?: string; cardNumber?: string; variant?: string }) => ({
                playerName: card.playerName,
                team: card.team,
                cardNumber: card.cardNumber,
                variant: card.variant,
              }))
            );
            cardsCreated[setInfo.name] = result.count;
          }
        }

        // Create Image records for extracted PDF images
        // These will be used in the release image carousel
        const imagesCreated: string[] = [];
        if (extractedImageUrls.length > 0) {
          const { prisma } = await import('@/lib/prisma');

          for (let i = 0; i < extractedImageUrls.length; i++) {
            const imageUrl = extractedImageUrls[i];

            try {
              await prisma.image.create({
                data: {
                  releaseId: release.id,
                  url: imageUrl,
                  order: i,
                  caption: null,
                },
              });
              imagesCreated.push(imageUrl);
            } catch (imageError) {
              console.warn(`Failed to create image record for ${imageUrl}:`, imageError);
            }
          }

          console.log(`Created ${imagesCreated.length} image records for release`);
        }

        createdRecords = {
          manufacturer,
          release,
          cardsCreated,
          totalCards: Object.values(cardsCreated).reduce((sum, count) => sum + count, 0),
          imagesCreated,
        };
      } catch (dbError) {
        console.error("Database creation error:", dbError);
        // Return analysis even if database creation fails
        return NextResponse.json({
          ...analysis,
          databaseError: "Failed to create database records",
          databaseErrorDetails:
            dbError instanceof Error ? dbError.message : String(dbError),
        });
      }
    }

    return NextResponse.json({
      ...analysis,
      createdRecords,
    });
  } catch (error) {
    console.error("Release analysis error:", error);

    // Provide detailed error information for debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    };

    console.error("Full error details:", errorDetails);

    return NextResponse.json(
      {
        error: "Failed to analyze release",
        details: errorDetails.message,
        debugInfo: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
