import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeReleaseDocuments } from "@/lib/ai";
import { parseDocuments } from "@/lib/documentParser";
import {
  getOrCreateManufacturer,
  createReleaseWithSets,
  addCardsToSet,
} from "@/lib/database";

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

    // If analysisData is provided, use it directly (for creating DB records after analysis)
    if (analysisData) {
      analysis = analysisData;
      // Get sell sheet data if it was passed through
      sellSheetText = analysisData.sellSheetText;
      sourceFiles = analysisData.sourceFiles;
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

      // Analyze with AI
      analysis = await analyzeReleaseDocuments(parsedDocuments);

      // Attach sell sheet data to analysis for potential later use
      analysis.sellSheetText = sellSheetText;
      analysis.sourceFiles = sourceFiles;
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
            description: analysis.description,
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

        createdRecords = {
          manufacturer,
          release,
          cardsCreated,
          totalCards: Object.values(cardsCreated).reduce((sum, count) => sum + count, 0),
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
