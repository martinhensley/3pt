import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
      cardsWithImages,
      totalPosts,
      publishedPosts,
      parallelSetsWithoutImages,
      setsWithTotalCards,
      releasesWithPosts,
      recentPosts,
      recentReleases,
    ] = await Promise.all([
      prisma.release.count(),
      prisma.set.count(),
      prisma.card.count(),
      prisma.card.count({
        where: {
          OR: [
            { imageFront: { not: null } },
            { imageBack: { not: null } },
          ],
        },
      }),
      prisma.post.count(),
      prisma.post.count({ where: { published: true } }),

      // Count parallel set variations without images
      // This counts distinct (setId, parallelType) combinations where no cards have images
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count
        FROM (
          SELECT
            c."setId" as set_id,
            COALESCE(c."parallelType", 'Base') as parallel_type,
            COUNT(*) FILTER (WHERE c."imageFront" IS NOT NULL OR c."imageBack" IS NOT NULL) as cards_with_images
          FROM "Card" c
          GROUP BY c."setId", COALESCE(c."parallelType", 'Base')
          HAVING COUNT(*) FILTER (WHERE c."imageFront" IS NOT NULL OR c."imageBack" IS NOT NULL) = 0
        ) subquery
      `.then(result => result[0]?.count ? Number(result[0].count) : 0),

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

      // Recent posts for activity feed (last 5)
      prisma.post.findMany({
        take: 5,
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          type: true,
          title: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Recent releases (last 5)
      prisma.release.findMany({
        take: 5,
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          name: true,
          year: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
          manufacturer: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const setsWithoutChecklists = totalSets - setsWithTotalCards.length;
    const releasesWithoutPosts = totalReleases - releasesWithPosts.length;

    // Combine all recent activity from posts and releases (excluding cards to avoid clutter)
    const allActivities = [
      ...recentPosts.map((post) => ({
        type: "POST" as const,
        title: post.title,
        id: post.id,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isNew: post.createdAt.getTime() === post.updatedAt.getTime(),
      })),
      ...recentReleases.map((release) => ({
        type: "RELEASE" as const,
        title: `${release.manufacturer.name} ${release.name}${release.year ? ` (${release.year})` : ""}`,
        id: release.id,
        createdAt: release.createdAt,
        updatedAt: release.updatedAt,
        isNew: release.createdAt.getTime() === release.updatedAt.getTime(),
      })),
    ];

    // Sort by updatedAt and take top 5
    const recentActivity = allActivities
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
      .map((activity) => ({
        type: activity.type,
        title: activity.title,
        id: activity.id,
        date: activity.updatedAt.toISOString(),
        action: activity.isNew ? "created" : "edited",
      }));

    return NextResponse.json({
      totalReleases,
      totalSets,
      totalCards,
      cardsWithImages,
      totalPosts,
      publishedPosts,
      parallelSetsWithoutImages,
      setsWithoutChecklists,
      releasesWithoutPosts,
      recentActivity,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
