import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { enhancedCardAnalysis } from "@/lib/enhancedCardAnalysis";
import { readFile } from "fs/promises";
import path from "path";
import { createCard, getSet } from "@/lib/database";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { frontImageUrl, backImageUrl, setId, createDatabaseRecords = true } =
      body;

    if (!frontImageUrl) {
      return NextResponse.json(
        { error: "Front image URL is required" },
        { status: 400 }
      );
    }

    // Get set and release context if setId provided
    let setContext: string | undefined;
    let releaseContext: string | undefined;
    if (setId) {
      const set = await getSet(setId);
      if (!set) {
        return NextResponse.json({ error: "Set not found" }, { status: 404 });
      }
      setContext = set.name;
      releaseContext = `${set.release.manufacturer.name} ${set.release.name} (${set.release.year})`;
    }

    // Perform enhanced card analysis with parallel detection
    const analysis = await enhancedCardAnalysis({
      frontImageUrl,
      backImageUrl,
      setContext,
      releaseContext,
    });

    // Create database record if requested
    let createdRecords = null;
    if (createDatabaseRecords && setId) {
      try {
        const { parallelDetection, features } = analysis;

        const card = await prisma.card.create({
          data: {
            setId,
            // Basic card info
            playerName: analysis.playerName,
            team: analysis.team,
            cardNumber: analysis.cardNumber,

            // Parallel/variation fields
            variant: parallelDetection.parallelType || undefined,
            parallelType: parallelDetection.parallelType || undefined,
            serialNumber: parallelDetection.serialNumber || undefined,
            isNumbered: parallelDetection.isNumbered,
            printRun: parallelDetection.printRun || undefined,
            rarity: parallelDetection.rarity,
            finish: parallelDetection.finish || undefined,
            colorVariant: parallelDetection.colorVariant || undefined,

            // Special features
            hasAutograph: features.hasAutograph,
            hasMemorabilia: features.hasMemorabilia,
            specialFeatures: features.specialFeatures,

            // Detection metadata
            detectionConfidence: parallelDetection.confidence,
            detectionMethods: parallelDetection.detectionMethods,
            detectedText: parallelDetection.detectedText.join('; ') || undefined,

            // Images
            imageFront: frontImageUrl,
            imageBack: backImageUrl || undefined,
          },
          include: {
            set: {
              include: {
                release: {
                  include: {
                    manufacturer: true,
                  },
                },
              },
            },
          },
        });

        createdRecords = {
          card,
        };
      } catch (dbError) {
        console.error("Database creation error:", dbError);
        return NextResponse.json({
          ...analysis,
          databaseError: "Failed to create database record",
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
    console.error("Card analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze card",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
