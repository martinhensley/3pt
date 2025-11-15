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
        },
      });

      if (!matchedSet) {
        return NextResponse.json({ error: "Set not found" }, { status: 404 });
      }

      // Cards belong directly to the current set
      // Each parallel set has its own cards
      const cardWhere: any = {
        setId: matchedSet.id,
      };

      // Fetch cards
      const cards = await prisma.card.findMany({
        where: cardWhere,
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

      // If this is a base set, fetch all parallel sets that reference it
      let parallelSets: any[] = [];
      if (!matchedSet.isParallel) {
        parallelSets = await prisma.set.findMany({
          where: {
            baseSetSlug: matchedSet.slug,
            isParallel: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            printRun: true,
            _count: {
              select: { cards: true }
            }
          },
          orderBy: [
            { printRun: 'desc' }, // Highest print run first
            { name: 'asc' }
          ]
        });
      }

      // Return the set with cards and parallels
      return NextResponse.json({
        ...matchedSet,
        cards: cards,
        parallelSets: parallelSets,
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
    const { name, type, totalCards, releaseId, printRun, description, isParallel, variant } = body;

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

    // Determine set type
    const setType = type || 'Base';

    // Strip year from release name if it exists (to prevent duplicate year in slug)
    // E.g., "2024-25 Panini Obsidian Soccer" -> "Panini Obsidian Soccer"
    const cleanReleaseName = release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

    // Generate slug based on whether this is a parallel set
    const slug = isParallel && variant
      ? generateSetSlug(
          release.year || '',
          cleanReleaseName,
          name, // Base set name (e.g., "Optic")
          setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
          variant, // Parallel variant (e.g., "Cubic")
          printRun // Print run if exists
        )
      : generateSetSlug(
          release.year || '',
          cleanReleaseName,
          name,
          setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other'
        );

    // Determine base set slug if this is a parallel
    const baseSetSlug = isParallel
      ? generateSetSlug(
          release.year || '',
          cleanReleaseName,
          name,
          setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other'
        )
      : null;

    const set = await prisma.set.create({
      data: {
        name: isParallel && variant ? `${name} ${variant}` : name, // Include variant in name for parallels
        slug,
        type: setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
        totalCards: totalCards || null,
        printRun: printRun || null,
        description: description || null,
        releaseId,
        isParallel: isParallel || false,
        baseSetSlug: baseSetSlug,
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
    const { id, name, type, totalCards, printRun, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Set ID is required" },
        { status: 400 }
      );
    }

    // Fetch the existing set with release info
    const existingSet = await prisma.set.findUnique({
      where: { id },
      include: {
        release: true,
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
    };

    if (name) {
      updateFields.name = name;
    }

    if (type !== undefined) {
      updateFields.type = type;
    }

    if (printRun !== undefined) {
      updateFields.printRun = printRun;
    }

    if (description !== undefined) {
      updateFields.description = description;
    }

    // Regenerate slug if name or type changed
    if (name || type) {
      const { generateSetSlug } = await import("@/lib/slugGenerator");
      const { isParallelSet, getParallelVariant } = await import("@/lib/setUtils");

      const setType = type || existingSet.type;
      const setName = name || existingSet.name;

      // Strip year from release name if it exists (to prevent duplicate year in slug)
      const cleanReleaseName = existingSet.release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

      // Check if this is a parallel based on existing slug
      const isParallel = isParallelSet(existingSet.slug);

      if (isParallel) {
        // Extract variant from existing slug or name
        const variant = getParallelVariant(existingSet.slug);

        updateFields.slug = generateSetSlug(
          existingSet.release.year || '',
          cleanReleaseName,
          setName,
          setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
          variant || '',
          existingSet.printRun
        );
      } else {
        // Regular set (non-parallel)
        updateFields.slug = generateSetSlug(
          existingSet.release.year || '',
          cleanReleaseName,
          setName,
          setType as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other'
        );
      }
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
