import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';

export const runtime = 'nodejs';

// GET - Get single document with full details and usage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.sourceDocument.findUnique({
      where: { id },
      include: {
        releases: {
          include: {
            release: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        posts: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      ...document,
      usedIn: {
        releases: document.releases.map((r) => ({
          id: r.release.id,
          name: r.release.name,
          linkedAt: r.linkedAt,
          usageContext: r.usageContext,
        })),
        posts: document.posts.map((p) => ({
          id: p.post.id,
          title: p.post.title,
          linkedAt: p.linkedAt,
          usageContext: p.usageContext,
        })),
      },
    };

    // Remove the raw relations from response
    const { releases: _releases, posts: _posts, ...cleanResponse } = response;

    return NextResponse.json({ ...cleanResponse, usedIn: response.usedIn });
  } catch (error) {
    console.error('Source document detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document details' },
      { status: 500 }
    );
  }
}

// PATCH - Update document metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { displayName, description, tags, documentType } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (documentType !== undefined) updateData.documentType = documentType as DocumentType;

    const document = await prisma.sourceDocument.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Source document update error:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a source document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the document first to retrieve the blob URL
    const document = await prisma.sourceDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from database (this will cascade to join tables)
    await prisma.sourceDocument.delete({
      where: { id },
    });

    // Delete from Vercel Blob
    try {
      await del(document.blobUrl);
    } catch (blobError) {
      console.error('Failed to delete blob:', blobError);
      // Continue even if blob deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Source document delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
