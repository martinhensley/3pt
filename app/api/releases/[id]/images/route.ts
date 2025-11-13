import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

// PUT - Update image order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: releaseId } = await params;
    const body = await request.json();
    const { imageOrders } = body;

    if (!imageOrders || !Array.isArray(imageOrders)) {
      return NextResponse.json(
        { error: 'Image orders are required' },
        { status: 400 }
      );
    }

    // Update order for each image
    await Promise.all(
      imageOrders.map(({ id, order }: { id: string; order: number }) =>
        prisma.image.update({
          where: { id },
          data: { order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating image order:', error);
    return NextResponse.json(
      { error: 'Failed to update image order' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Delete the image
    await prisma.image.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
