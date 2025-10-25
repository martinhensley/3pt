import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all cards
export async function GET() {
  try {
    const cards = await prisma.card.findMany({
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
      orderBy: [
        { set: { release: { year: 'desc' } } },
        { cardNumber: 'asc' },
      ],
    });

    // The set.parallels field is automatically included in the response
    // since we're including the full set relation

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Get all cards error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}
