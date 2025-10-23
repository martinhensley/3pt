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

    // If analysisData is provided, use it directly (for creating DB records after analysis)
    if (analysisData) {
      analysis = analysisData;
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

      // Analyze with AI
      analysis = await analyzeReleaseDocuments(parsedDocuments);
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
          },
          analysis.sets.map((set) => ({
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
              setInfo.cards.map((card) => ({
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
