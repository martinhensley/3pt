import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReleaseSets } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const releaseId = searchParams.get("releaseId");

    if (!releaseId) {
      return NextResponse.json(
        { error: "releaseId parameter is required" },
        { status: 400 }
      );
    }

    const sets = await getReleaseSets(releaseId);
    return NextResponse.json(sets);
  } catch (error) {
    console.error("Get sets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sets" },
      { status: 500 }
    );
  }
}
