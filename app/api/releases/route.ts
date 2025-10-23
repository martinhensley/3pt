import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    if (slug) {
      // Fetch release by post slug
      const post = await prisma.post.findUnique({
        where: { slug },
        include: {
          release: {
            include: {
              manufacturer: true,
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
          },
        },
      });

      if (!post?.release) {
        return NextResponse.json(
          { error: "Release not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(post.release);
    } else if (id) {
      // Fetch release by ID
      const release = await prisma.release.findUnique({
        where: { id },
        include: {
          manufacturer: true,
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
