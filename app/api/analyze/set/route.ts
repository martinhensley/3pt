import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeSetDocuments } from "@/lib/ai";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { checklistImageUrl, sellSheetImageUrl } = body;

    if (!checklistImageUrl) {
      return NextResponse.json(
        { error: "Checklist image URL is required" },
        { status: 400 }
      );
    }

    // Read images and convert to base64
    const checklistImagePath = path.join(
      process.cwd(),
      "public",
      checklistImageUrl
    );
    const checklistImageBuffer = await readFile(checklistImagePath);
    const checklistImageBase64 = checklistImageBuffer.toString("base64");

    let sellSheetImageBase64: string | undefined;
    if (sellSheetImageUrl) {
      const sellSheetImagePath = path.join(
        process.cwd(),
        "public",
        sellSheetImageUrl
      );
      const sellSheetImageBuffer = await readFile(sellSheetImagePath);
      sellSheetImageBase64 = sellSheetImageBuffer.toString("base64");
    }

    const analysis = await analyzeSetDocuments(
      checklistImageBase64,
      sellSheetImageBase64
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Set analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze set" },
      { status: 500 }
    );
  }
}
