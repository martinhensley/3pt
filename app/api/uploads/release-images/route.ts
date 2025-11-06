import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// POST - Upload an image for a release and create Image record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const releaseId = formData.get("releaseId") as string;

    if (!file || !releaseId) {
      return NextResponse.json(
        { error: "File and releaseId are required" },
        { status: 400 }
      );
    }

    // Validate that it's an image file
    const ext = path.extname(file.name).toLowerCase();
    const validImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!validImageExts.includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "releases", releaseId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const basename = path.basename(file.name, ext);
    const sanitizedBasename = basename.replace(/[^a-z0-9-_]/gi, '_');
    const filename = `${sanitizedBasename}_${timestamp}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/releases/${releaseId}/${filename}`;

    // Get the current max order for this release's images
    const maxOrderResult = await prisma.image.aggregate({
      where: { releaseId },
      _max: { order: true }
    });
    const nextOrder = (maxOrderResult._max.order ?? -1) + 1;

    // Create Image record in database
    const imageRecord = await prisma.image.create({
      data: {
        releaseId,
        url: imageUrl,
        order: nextOrder,
        caption: null,
      }
    });

    // Return file metadata
    return NextResponse.json({
      id: imageRecord.id,
      url: imageUrl,
      filename: file.name,
      type: ext.replace('.', ''),
      order: nextOrder,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an image and its database record
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    // Get image record
    const imageRecord = await prisma.image.findUnique({
      where: { id: imageId }
    });

    if (!imageRecord) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Convert URL to filesystem path
    const filepath = path.join(process.cwd(), "public", imageRecord.url);

    // Delete file if it exists
    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    // Delete database record
    await prisma.image.delete({
      where: { id: imageId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
