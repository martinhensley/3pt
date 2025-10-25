import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    if (slug) {
      // Fetch release by slug directly from Release model
      const release = await prisma.release.findUnique({
        where: { slug },
        include: {
          manufacturer: true,
          images: {
            orderBy: { order: 'asc' }
          },
          sets: {
            include: {
              cards: {
                orderBy: [
                  { cardNumber: 'asc' }
                ]
              },
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
        },
      });

      if (!release) {
        return NextResponse.json(
          { error: "Release not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(release);
    } else if (id) {
      // Fetch release by ID
      const release = await prisma.release.findUnique({
        where: { id },
        include: {
          manufacturer: true,
          images: {
            orderBy: { order: 'asc' }
          },
          sets: {
            include: {
              cards: {
                orderBy: [
                  { cardNumber: 'asc' }
                ]
              },
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
        },
      });

      if (!release) {
        return NextResponse.json(
          { error: "Release not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(release);
    } else {
      // Fetch all releases
      const releases = await prisma.release.findMany({
        include: {
          manufacturer: true,
          images: {
            orderBy: { order: 'asc' }
          },
          sets: {
            include: {
              _count: {
                select: { cards: true }
              }
            }
          },
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json(releases);
    }
  } catch (error) {
    console.error("Failed to fetch release:", error);
    return NextResponse.json(
      { error: "Failed to fetch release" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, year, description, sourceFiles } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Release ID is required" },
        { status: 400 }
      );
    }

    const release = await prisma.release.update({
      where: { id },
      data: {
        name,
        year,
        description: description || null,
        sourceFiles: sourceFiles || null,
      },
      include: {
        manufacturer: true,
        images: {
          orderBy: { order: 'asc' }
        },
        sets: {
          include: {
            cards: {
              orderBy: [
                { cardNumber: 'asc' }
              ]
            },
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
      },
    });

    return NextResponse.json(release);
  } catch (error) {
    console.error("Failed to update release:", error);
    return NextResponse.json(
      { error: "Failed to update release" },
      { status: 500 }
    );
  }
}
