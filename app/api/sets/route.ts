import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch sets by releaseId, slug, or id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const releaseId = searchParams.get("releaseId");
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");
    const parallelSlug = searchParams.get("parallel");

    // If id is provided, fetch set by ID (for admin card count refresh)
    if (id) {
      const set = await prisma.set.findUnique({
        where: { id },
        include: {
          cards: true,
          release: true,
        },
      });

      if (!set) {
        return NextResponse.json({ error: "Set not found" }, { status: 404 });
      }

      return NextResponse.json(set);
    }

    // If slug is provided, this is a public request for a set page
    if (slug) {
      // Look up the set directly by slug with parent-child relationships
      const matchedSet = await prisma.set.findUnique({
        where: { slug },
        include: {
          release: {
            include: {
              manufacturer: true,
            },
          },
          parentSet: true, // Include parent if this is a parallel set
          parallelSets: {  // Include child parallels if this is a parent set
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!matchedSet) {
        return NextResponse.json({ error: "Set not found" }, { status: 404 });
      }

      // Determine which set's cards to fetch
      // If this is a parallel set (has parentSetId), fetch parent's cards
      // If this is a parent set, fetch its own cards
      const setIdForCards = matchedSet.parentSetId || matchedSet.id;

      // Fetch cards
      const cards = await prisma.card.findMany({
        where: {
          setId: setIdForCards,
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

      // Return the set with cards
      return NextResponse.json({
        ...matchedSet,
        cards: cards,
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
    const { name, isBaseSet, type, totalCards, releaseId, parallels, parentSetId, printRun, description } = body;

    if (!name || !releaseId) {
      return NextResponse.json(
        { error: "name and releaseId are required" },
        { status: 400 }
      );
    }

    // Fetch release info to generate slug
    const release = await prisma.release.findUnique({
      where: { id: releaseId },
    });

    if (!release) {
      return NextResponse.json(
        { error: "Release not found" },
        { status: 404 }
      );
    }

    // Import generateSetSlug dynamically
    const { generateSetSlug } = await import("@/lib/slugGenerator");

    // Determine set type (use 'type' field if provided, otherwise infer from isBaseSet)
    const setType = type || (isBaseSet ? 'Base' : 'Other');

    // Strip year from release name if it exists (to prevent duplicate year in slug)
    // E.g., "2024-25 Panini Obsidian Soccer" -> "Panini Obsidian Soccer"
    const cleanReleaseName = release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

    // For parallel sets, we need to include the parent set name and the parallel name with print run
    let slug: string;

    if (parentSetId) {
      // Fetch parent set to get its name
      const parentSet = await prisma.set.findUnique({
        where: { id: parentSetId },
      });

      if (!parentSet) {
        return NextResponse.json(
          { error: "Parent set not found" },
          { status: 404 }
        );
      }

      // Build parallel name with print run: "Electric Etch Green /5" -> "electric-etch-green-5"
      const parallelNameWithPrintRun = printRun ? `${name} /${printRun}` : name;

      // Generate slug with parent set name as base and parallel name
      slug = generateSetSlug(
        release.year || '',
        cleanReleaseName,
        parentSet.name, // Parent set name (e.g., "Obsidian Base")
        setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
        parallelNameWithPrintRun // Parallel name with print run
      );
    } else {
      // Regular set (non-parallel)
      slug = generateSetSlug(
        release.year || '',
        cleanReleaseName,
        name,
        setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other'
      );
    }

    const set = await prisma.set.create({
      data: {
        name,
        slug,
        type: setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
        isBaseSet: isBaseSet || false,
        totalCards: totalCards || null,
        printRun: printRun || null,
        description: description || null,
        releaseId,
        parallels: parallels && parallels.length > 0 ? parallels : null,
        parentSetId: parentSetId || null, // Accept parentSetId for child parallel sets
      },
    });

    return NextResponse.json(set);
  } catch (error) {
    console.error("Create set error:", error);

    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && 'code' in error
      ? ` (Code: ${(error as { code: string }).code})`
      : '';

    return NextResponse.json(
      { error: `Failed to create set: ${errorMessage}${errorDetails}` },
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
    const { id, name, isBaseSet, type, totalCards, parallels } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Set ID is required" },
        { status: 400 }
      );
    }

    // Fetch the existing set with release info and parent set
    const existingSet = await prisma.set.findUnique({
      where: { id },
      include: {
        release: true,
        parentSet: true,
      },
    });

    if (!existingSet) {
      return NextResponse.json(
        { error: "Set not found" },
        { status: 404 }
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

    if (type !== undefined) {
      updateFields.type = type;
    }

    // Regenerate slug if name or type changed
    if (name || type) {
      const { generateSetSlug } = await import("@/lib/slugGenerator");
      const setType = type || existingSet.type;
      const setName = name || existingSet.name;

      // Strip year from release name if it exists (to prevent duplicate year in slug)
      const cleanReleaseName = existingSet.release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

      let slug: string;

      if (existingSet.parentSetId && existingSet.parentSet) {
        // For parallel sets, include parent set name and parallel name with print run
        const parallelNameWithPrintRun = existingSet.printRun
          ? `${setName} /${existingSet.printRun}`
          : setName;

        slug = generateSetSlug(
          existingSet.release.year || '',
          cleanReleaseName,
          existingSet.parentSet.name,
          setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
          parallelNameWithPrintRun
        );
      } else {
        // Regular set (non-parallel)
        slug = generateSetSlug(
          existingSet.release.year || '',
          cleanReleaseName,
          setName,
          setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other'
        );
      }

      updateFields.slug = slug;
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
