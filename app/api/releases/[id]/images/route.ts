import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: releaseId } = await params;
    const body = await request.json();
    const { imageUrls } = body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Image URLs are required' },
        { status: 400 }
      );
    }

    // Verify release exists
    const release = await prisma.release.findUnique({
      where: { id: releaseId },
    });

    if (!release) {
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      );
    }

    // Get the current max order for images in this release
    const existingImages = await prisma.image.findMany({
      where: { releaseId },
      orderBy: { order: 'desc' },
      take: 1,
    });

    const startOrder = existingImages.length > 0 ? existingImages[0].order + 1 : 0;

    // Create image records
    const images = await Promise.all(
      imageUrls.map((url: string, index: number) =>
        prisma.image.create({
          data: {
            url,
            releaseId,
            order: startOrder + index,
          },
        })
      )
    );

    return NextResponse.json({ images }, { status: 201 });
  } catch (error) {
    console.error('Error adding images to release:', error);
    return NextResponse.json(
      { error: 'Failed to add images' },
      { status: 500 }
    );
  }
}
