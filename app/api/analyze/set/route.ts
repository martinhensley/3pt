/**
 * @deprecated This endpoint is deprecated. Use /api/analyze/release instead.
 *
 * The unified Create Release workflow now handles both:
 * - Vintage releases (single base set with or without checklist)
 * - Modern releases (multiple sets with optional checklists)
 *
 * This endpoint remains for backward compatibility but may be removed in future versions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeSetDocumentsWithCards } from "@/lib/ai";
import { parseDocuments } from "@/lib/documentParser";
import { addSetToRelease, addCardsToSet, getRelease } from "@/lib/database";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { files, releaseId, createDatabaseRecords = true } = body;
    // files: Array<{ url: string, type?: 'image' | 'pdf' | 'csv' | 'html' }>
    // releaseId: string (optional) - if provided, associate set with this release
    // createDatabaseRecords: boolean (default true) - whether to create Set/Card records

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "At least one file is required" },
        { status: 400 }
      );
    }

    // Get release context if releaseId provided
    let releaseContext: string | undefined;
    if (releaseId) {
      const release = await getRelease(releaseId);
      if (!release) {
        return NextResponse.json(
          { error: "Release not found" },
          { status: 404 }
        );
      }
      releaseContext = `${release.manufacturer.name} ${release.name} (${release.year})`;
    }

    // Parse all documents
    const parsedDocuments = await parseDocuments(files);

    // Analyze with AI
    const analysis = await analyzeSetDocumentsWithCards(
      parsedDocuments,
      releaseContext
    );

    // Create database records if requested
    let createdRecords = null;
    if (createDatabaseRecords && releaseId) {
      try {
        // Create set
        const set = await addSetToRelease(releaseId, {
          name: analysis.setName,
          totalCards: analysis.totalCards,
        });

        // Create cards if available
        let cardsCreated = 0;
        if (analysis.cards && analysis.cards.length > 0) {
          const result = await addCardsToSet(set.id, analysis.cards);
          cardsCreated = result.count;
        }

        createdRecords = {
          set,
          cardsCreated,
        };
      } catch (dbError) {
        console.error("Database creation error:", dbError);
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
    console.error("Set analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze set",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
