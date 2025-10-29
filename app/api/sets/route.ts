import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch sets by releaseId or slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const releaseId = searchParams.get("releaseId");
    const slug = searchParams.get("slug");
    const parallelSlug = searchParams.get("parallel");

    // If slug is provided, this is a public request for a set page
    if (slug) {
      // Parse slug: year-manufacturer-release-setname
      // Example: 2024-25-panini-donruss-soccer-base-optic
      const parts = slug.split('-');

      // Need at least 4 parts (year parts might be split like 2024-25)
      if (parts.length < 4) {
        return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
      }

      // Find all releases and sets to match against the slug
      const sets = await prisma.set.findMany({
        include: {
          release: {
            include: {
              manufacturer: true,
            },
          },
        },
      });

      // Find the set that matches this slug
      const matchedSet = sets.find(set => {
        // Clean set name: remove "Base" from Optic sets, keep it for others
        const cleanSetName = set.name
          .replace(/\boptic\s+base\s+set\b/gi, 'Optic') // Optic Base Set -> Optic
          .replace(/\boptic\s+base\b/gi, 'Optic') // Optic Base -> Optic
          .replace(/\bbase\s+optic\b/gi, 'Optic') // Base Optic -> Optic
          .replace(/\bbase\s+set\b/gi, 'Base') // Base Set -> Base (keep "Base")
          .replace(/\bsets?\b/gi, '') // Remove remaining "set/sets"
          .trim();

        const setSlug = `${set.release.year || ''}-${set.release.name}-${cleanSetName}`
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        return setSlug === slug;
      });

      if (!matchedSet) {
        return NextResponse.json({ error: "Set not found" }, { status: 404 });
      }

      // Determine which parallel to fetch
      let parallelType: string;

      if (parallelSlug) {
        // Find the matching parallel from the set's parallels array
        // Convert URL slug to match database format
        // e.g., "ice" -> "Ice", "red-299" -> "Red – /299"
        const parallels = Array.isArray(matchedSet.parallels) ? matchedSet.parallels.filter((p): p is string => p !== null) : [];

        // Try to find exact match first (case-insensitive, slug format)
        const matchedParallel = parallels.find(p => {
          const pSlug = p
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .replace(/1-of-1/g, '1of1'); // Convert "1-of-1" to "1of1"
          return pSlug === parallelSlug;
        });

        if (!matchedParallel) {
          return NextResponse.json({ error: "Parallel not found" }, { status: 404 });
        }

        parallelType = matchedParallel;
      } else {
        // No parallel specified, use base parallel
        const isOpticSet = matchedSet.name.toLowerCase().includes('optic');
        parallelType = isOpticSet ? 'Optic' : 'Base';
      }

      // Fetch cards for the specified parallel
      const allCards = await prisma.card.findMany({
        where: {
          setId: matchedSet.id,
          parallelType: parallelType,
        },
        orderBy: [{ cardNumber: 'asc' }],
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

      // If no cards found with specific parallel type, check if cards have null parallelType
      // If so, return only unique card numbers (one card per player) as a fallback
      let cards = allCards;
      if (cards.length === 0) {
        const allCardsInSet = await prisma.card.findMany({
          where: {
            setId: matchedSet.id,
            parallelType: null,
          },
          orderBy: [{ cardNumber: 'asc' }],
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

        // Group by cardNumber and take first occurrence of each
        const uniqueCards = new Map();
        allCardsInSet.forEach(card => {
          if (!uniqueCards.has(card.cardNumber)) {
            uniqueCards.set(card.cardNumber, card);
          }
        });
        cards = Array.from(uniqueCards.values());
      }

      // Return the set with cards for the specified parallel
      return NextResponse.json({
        ...matchedSet,
        cards: cards,
        currentParallel: parallelType, // Include which parallel is being shown
      });
    }

    // Otherwise, this is an authenticated request for sets by releaseId
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!releaseId) {
      return NextResponse.json(
        { error: "releaseId is required" },
        { status: 400 }
      );
    }

    const sets = await prisma.set.findMany({
      where: { releaseId },
      orderBy: { createdAt: "desc" },
      include: {
        cards: true,
      },
    });

    return NextResponse.json(sets);
  } catch (error) {
    console.error("Get sets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sets" },
      { status: 500 }
    );
  }
}

// POST - Create new set
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, isBaseSet, totalCards, releaseId, parallels } = body;

    if (!name || !releaseId) {
      return NextResponse.json(
        { error: "name and releaseId are required" },
        { status: 400 }
      );
    }

    const set = await prisma.set.create({
      data: {
        name,
        isBaseSet: isBaseSet || false,
        totalCards: totalCards || null,
        releaseId,
        parallels: parallels && parallels.length > 0 ? parallels : null,
      },
    });

    return NextResponse.json(set);
  } catch (error) {
    console.error("Create set error:", error);
    return NextResponse.json(
      { error: "Failed to create set" },
      { status: 500 }
    );
  }
}

// PUT - Update existing set
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, isBaseSet, totalCards, parallels } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Set ID is required" },
        { status: 400 }
      );
    }

    // Build update data object
    const updateFields: Record<string, unknown> = {
      totalCards: totalCards || null,
      parallels: parallels && parallels.length > 0 ? parallels : null,
    };

    if (name) {
      updateFields.name = name;
    }

    if (isBaseSet !== undefined) {
      updateFields.isBaseSet = isBaseSet;
    }

    const set = await prisma.set.update({
      where: { id },
      data: updateFields,
    });

    return NextResponse.json(set);
  } catch (error) {
    console.error("Update set error:", error);
    return NextResponse.json(
      { error: "Failed to update set" },
      { status: 500 }
    );
  }
}

// DELETE - Delete set
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Set ID is required" },
        { status: 400 }
      );
    }

    // Delete associated cards first
    await prisma.card.deleteMany({
      where: { setId: id },
    });

    // Delete the set
    await prisma.set.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete set error:", error);
    return NextResponse.json(
      { error: "Failed to delete set" },
      { status: 500 }
    );
  }
}
