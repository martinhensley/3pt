import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllReleases, getManufacturerReleases } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const manufacturerId = searchParams.get("manufacturerId");

    const releases = manufacturerId
      ? await getManufacturerReleases(manufacturerId)
      : await getAllReleases();

    return NextResponse.json(releases);
  } catch (error) {
    console.error("Get releases error:", error);
    return NextResponse.json(
      { error: "Failed to fetch releases" },
      { status: 500 }
    );
  }
}
