import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

function generateSlug(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, type, imageUrls, published, releaseId, setId, cardId } = body;

    if (!title || !content || !type) {
      return NextResponse.json(
        { error: "Title, content, and type are required" },
        { status: 400 }
      );
    }

    // Generate hierarchical slug based on type and relationships
    let slug = "";

    if (type === "RELEASE" && releaseId) {
      // For releases: just use the release name
      const release = await prisma.release.findUnique({
        where: { id: releaseId },
        include: { manufacturer: true },
      });
      if (release) {
        slug = generateSlug(`${release.manufacturer.name} ${release.name} ${release.year || ''}`).trim().replace(/-+$/, '');
      } else {
        slug = generateSlug(title);
      }
    } else if (type === "SET" && setId) {
      // For sets: Release-Name-Set-Name
      const set = await prisma.set.findUnique({
        where: { id: setId },
        include: {
          release: {
            include: { manufacturer: true },
          },
        },
      });
      if (set?.release) {
        const releaseName = `${set.release.manufacturer.name} ${set.release.name} ${set.release.year || ''}`.trim();
        slug = generateSlug(`${releaseName} ${set.name}`);
      } else {
        slug = generateSlug(title);
      }
    } else if (type === "CARD" && cardId) {
      // For cards: Release-Name-Set-Name-Card-Name
      const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: {
          set: {
            include: {
              release: {
                include: { manufacturer: true },
              },
            },
          },
        },
      });
      if (card?.set?.release) {
        const releaseName = `${card.set.release.manufacturer.name} ${card.set.release.name} ${card.set.release.year || ''}`.trim();
        const cardName = `${card.playerName || ''} ${card.team || ''} ${card.cardNumber || ''} ${card.variant || ''}`.trim();
        slug = generateSlug(`${releaseName} ${card.set.name} ${cardName}`);
      } else {
        slug = generateSlug(title);
      }
    } else {
      // Fallback to title-based slug
      slug = generateSlug(title);
    }

    // Check if slug already exists
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.post.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug: finalSlug,
        content,
        excerpt: excerpt || "",
        type,
        published: published || false,
        authorId: session.user.id,
        releaseId: releaseId || null,
        setId: setId || null,
        cardId: cardId || null,
        images: {
          create:
            imageUrls?.map((url: string, index: number) => ({
              url,
              order: index,
            })) || [],
        },
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Create post error:", error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to create post",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");

    const posts = await prisma.post.findMany({
      where: published === "true" ? { published: true } : undefined,
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
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
    const { id, title, content, excerpt, published, newImageUrls, removeImageIds } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Handle image removals
    if (removeImageIds && removeImageIds.length > 0) {
      // First, fetch the images to get their URLs for blob deletion
      const imagesToDelete = await prisma.image.findMany({
        where: {
          id: { in: removeImageIds },
          postId: id,
        },
      });

      // Delete from Vercel Blob storage
      for (const image of imagesToDelete) {
        try {
          await del(image.url);
        } catch (error) {
          console.error(`Failed to delete blob for image ${image.id}:`, error);
          // Continue with database deletion even if blob deletion fails
        }
      }

      // Delete from database
      await prisma.image.deleteMany({
        where: {
          id: { in: removeImageIds },
          postId: id,
        },
      });
    }

    // Get current max order for new images
    let maxOrder = 0;
    if (newImageUrls && newImageUrls.length > 0) {
      const existingImages = await prisma.image.findMany({
        where: { postId: id },
        orderBy: { order: "desc" },
        take: 1,
      });
      maxOrder = existingImages.length > 0 ? existingImages[0].order + 1 : 0;
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        excerpt,
        published,
        images: newImageUrls && newImageUrls.length > 0 ? {
          create: newImageUrls.map((url: string, index: number) => ({
            url,
            order: maxOrder + index,
          })),
        } : undefined,
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

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
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Fetch the post to determine type and relationships
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Delete blobs from Vercel Blob storage
    for (const image of post.images) {
      try {
        await del(image.url);
      } catch (error) {
        console.error(`Failed to delete blob for image ${image.id}:`, error);
        // Continue with deletion even if blob deletion fails
      }
    }

    // Delete associated images from database
    await prisma.image.deleteMany({
      where: { postId: id },
    });

    // Delete the post
    await prisma.post.delete({
      where: { id },
    });

    // If this post has a releaseId, check if we should delete the associated Release and its Sets
    if (post.releaseId) {
      // Check if there are any other posts referencing this release
      const otherReleasePosts = await prisma.post.count({
        where: {
          releaseId: post.releaseId,
          id: { not: id },
        },
      });

      // Only delete the release if no other posts reference it
      if (otherReleasePosts === 0) {
        // First delete all cards in sets belonging to this release
        const sets = await prisma.set.findMany({
          where: { releaseId: post.releaseId },
          select: { id: true },
        });

        for (const set of sets) {
          await prisma.card.deleteMany({
            where: { setId: set.id },
          });
        }

        // Then delete all sets
        await prisma.set.deleteMany({
          where: { releaseId: post.releaseId },
        });

        // Finally delete the release
        await prisma.release.delete({
          where: { id: post.releaseId },
        });
      }
    }

    // If this post has a setId, check if we should delete the associated Set
    if (post.setId) {
      // Check if there are any other posts referencing this set
      const otherSetPosts = await prisma.post.count({
        where: {
          setId: post.setId,
          id: { not: id },
        },
      });

      // Only delete the set if no other posts reference it
      if (otherSetPosts === 0) {
        // First delete all cards in this set
        await prisma.card.deleteMany({
          where: { setId: post.setId },
        });

        // Then delete the set
        await prisma.set.delete({
          where: { id: post.setId },
        });
      }
    }

    // If this post has a cardId, check if we should delete the associated Card
    if (post.cardId) {
      // Check if there are any other posts referencing this card
      const otherCardPosts = await prisma.post.count({
        where: {
          cardId: post.cardId,
          id: { not: id },
        },
      });

      // Only delete the card if no other posts reference it
      if (otherCardPosts === 0) {
        await prisma.card.delete({
          where: { id: post.cardId },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
