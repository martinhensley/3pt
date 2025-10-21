import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, type, imageUrls, published } = body;

    if (!title || !content || !type) {
      return NextResponse.json(
        { error: "Title, content, and type are required" },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);

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
    return NextResponse.json(
      { error: "Failed to create post" },
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
      const imagesToDelete = await prisma.postImage.findMany({
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
      await prisma.postImage.deleteMany({
        where: {
          id: { in: removeImageIds },
          postId: id,
        },
      });
    }

    // Get current max order for new images
    let maxOrder = 0;
    if (newImageUrls && newImageUrls.length > 0) {
      const existingImages = await prisma.postImage.findMany({
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

    // Fetch images to delete their blobs
    const imagesToDelete = await prisma.postImage.findMany({
      where: { postId: id },
    });

    // Delete blobs from Vercel Blob storage
    for (const image of imagesToDelete) {
      try {
        await del(image.url);
      } catch (error) {
        console.error(`Failed to delete blob for image ${image.id}:`, error);
        // Continue with deletion even if blob deletion fails
      }
    }

    // Delete associated images from database
    await prisma.postImage.deleteMany({
      where: { postId: id },
    });

    // Delete the post
    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
