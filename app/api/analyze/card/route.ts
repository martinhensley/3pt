import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeCardImages } from "@/lib/ai";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { frontImageUrl, backImageUrl } = body;

    if (!frontImageUrl) {
      return NextResponse.json(
        { error: "Front image URL is required" },
        { status: 400 }
      );
    }

    // Read images and convert to base64
    const frontImagePath = path.join(process.cwd(), "public", frontImageUrl);
    const frontImageBuffer = await readFile(frontImagePath);
    const frontImageBase64 = frontImageBuffer.toString("base64");

    let backImageBase64: string | undefined;
    if (backImageUrl) {
      const backImagePath = path.join(process.cwd(), "public", backImageUrl);
      const backImageBuffer = await readFile(backImagePath);
      backImageBase64 = backImageBuffer.toString("base64");
    }

    const analysis = await analyzeCardImages(frontImageBase64, backImageBase64);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Card analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze card" },
      { status: 500 }
    );
  }
}
