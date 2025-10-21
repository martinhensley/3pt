import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeReleaseDocuments } from "@/lib/ai";
import { parseDocuments } from "@/lib/documentParser";
import {
  getOrCreateManufacturer,
  createReleaseWithSets,
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
    const { files, createDatabaseRecords = true } = body;
    // files: Array<{ url: string, type?: 'image' | 'pdf' | 'csv' | 'html' }>
    // createDatabaseRecords: boolean (default true) - whether to create Manufacturer/Release/Set records

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "At least one file is required" },
        { status: 400 }
      );
    }

    // Parse all documents
    const parsedDocuments = await parseDocuments(files);

    // Analyze with AI
    const analysis = await analyzeReleaseDocuments(parsedDocuments);

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
          }))
        );

        createdRecords = {
          manufacturer,
          release,
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
    return NextResponse.json(
      {
        error: "Failed to analyze release",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
