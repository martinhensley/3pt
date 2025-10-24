import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all stats in parallel
    const [
      totalReleases,
      totalSets,
      totalCards,
      totalPosts,
      publishedPosts,
      setsWithCards,
      setsWithTotalCards,
      releasesWithPosts,
      cardsWithPosts,
      recentPosts,
      recentReleases,
      recentCards,
    ] = await Promise.all([
      prisma.release.count(),
      prisma.set.count(),
      prisma.card.count(),
      prisma.post.count(),
      prisma.post.count({ where: { published: true } }),

      // Sets that have at least one card
      prisma.set.findMany({
        where: {
          cards: {
            some: {},
          },
        },
        select: { id: true },
      }),

      // Sets that have totalCards defined
      prisma.set.findMany({
        where: {
          totalCards: {
            not: null,
          },
        },
        select: { id: true },
      }),

      // Releases that have posts
      prisma.release.findMany({
        where: {
          posts: {
            some: {},
          },
        },
        select: { id: true },
      }),

      // Cards that have posts
      prisma.card.findMany({
        where: {
          posts: {
            some: {},
          },
        },
        select: { id: true },
      }),

      // Recent posts for activity feed
      prisma.post.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          type: true,
          title: true,
          slug: true,
          createdAt: true,
        },
      }),

      // Recent releases
      prisma.release.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          year: true,
          slug: true,
          createdAt: true,
          manufacturer: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Recent cards
      prisma.card.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          playerName: true,
          cardNumber: true,
          createdAt: true,
          set: {
            select: {
              name: true,
              release: {
                select: {
                  name: true,
                  manufacturer: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const setsWithoutCards = totalSets - setsWithCards.length;
    const setsWithoutChecklists = totalSets - setsWithTotalCards.length;
    const releasesWithoutPosts = totalReleases - releasesWithPosts.length;
    const cardsWithoutPosts = totalCards - cardsWithPosts.length;

    const recentActivity = recentPosts.map((post) => ({
      type: post.type,
      title: post.title,
      date: post.createdAt.toISOString(),
    }));

    return NextResponse.json({
      totalReleases,
      totalSets,
      totalCards,
      totalPosts,
      publishedPosts,
      setsWithoutCards,
      setsWithoutChecklists,
      releasesWithoutPosts,
      cardsWithoutPosts,
      recentActivity,
      recentPosts: recentPosts.map((post) => ({
        id: post.id,
        type: post.type,
        title: post.title,
        slug: post.slug,
        createdAt: post.createdAt.toISOString(),
      })),
      recentReleases: recentReleases.map((release) => ({
        id: release.id,
        name: release.name,
        year: release.year,
        slug: release.slug,
        manufacturer: release.manufacturer.name,
        createdAt: release.createdAt.toISOString(),
      })),
      recentCards: recentCards.map((card) => ({
        id: card.id,
        playerName: card.playerName,
        cardNumber: card.cardNumber,
        setName: card.set.name,
        releaseName: card.set.release.name,
        manufacturer: card.set.release.manufacturer.name,
        createdAt: card.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
