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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const type = searchParams.get("type");
    const sortBy = searchParams.get("sort") || "date";
    const sortOrder = (searchParams.get("order") || "desc") as "asc" | "desc";

    const skip = (page - 1) * pageSize;

    // Build activity items from different sources
    const activities: any[] = [];

    // Fetch Releases
    if (!type || type === "RELEASE") {
      const releases = await prisma.release.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
        orderBy: { createdAt: sortOrder },
      });

      activities.push(
        ...releases.map((r) => ({
          id: `release-${r.id}`,
          type: "RELEASE",
          title: r.name,
          date: r.createdAt.toISOString(),
          link: `/release/${r.slug}`,
        }))
      );
    }

    // Fetch Sets
    if (!type || type === "SET") {
      const sets = await prisma.set.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          release: {
            select: {
              slug: true,
            },
          },
        },
        orderBy: { createdAt: sortOrder },
      });

      activities.push(
        ...sets.map((s) => ({
          id: `set-${s.id}`,
          type: "SET",
          title: s.name,
          date: s.createdAt.toISOString(),
          link: `/release/${s.release.slug}`,
        }))
      );
    }

    // Fetch Cards
    if (!type || type === "CARD") {
      const cards = await prisma.card.findMany({
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
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: sortOrder },
      });

      activities.push(
        ...cards.map((c) => ({
          id: `card-${c.id}`,
          type: "CARD",
          title: `${c.playerName || "Unknown"} #${c.cardNumber || "?"} - ${c.set.name}`,
          date: c.createdAt.toISOString(),
          link: `/release/${c.set.release.slug}`,
        }))
      );
    }

    // Fetch Posts
    if (!type || type === "POST") {
      const posts = await prisma.post.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
        },
        orderBy: { createdAt: sortOrder },
      });

      activities.push(
        ...posts.map((p) => ({
          id: `post-${p.id}`,
          type: "POST",
          title: p.title,
          date: p.createdAt.toISOString(),
          link: `/post/${p.slug}`,
        }))
      );
    }

    // Sort all activities
    if (sortBy === "date") {
      activities.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === "type") {
      activities.sort((a, b) => {
        const comparison = a.type.localeCompare(b.type);
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    // Paginate
    const total = activities.length;
    const paginatedActivities = activities.slice(skip, skip + pageSize);

    return NextResponse.json({
      activities: paginatedActivities,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
