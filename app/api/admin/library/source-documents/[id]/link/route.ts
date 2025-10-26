import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// POST - Link a document to content (release or post)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentType, contentId, usageContext } = body;

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: 'contentType and contentId are required' },
        { status: 400 }
      );
    }

    if (contentType !== 'release' && contentType !== 'post') {
      return NextResponse.json(
        { error: 'contentType must be either "release" or "post"' },
        { status: 400 }
      );
    }

    // Check if document exists
    const document = await prisma.sourceDocument.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Create the link
    if (contentType === 'release') {
      // Check if release exists
      const release = await prisma.release.findUnique({
        where: { id: contentId },
      });

      if (!release) {
        return NextResponse.json(
          { error: 'Release not found' },
          { status: 404 }
        );
      }

      // Create link (or update if exists due to unique constraint)
      await prisma.releaseSourceDocument.upsert({
        where: {
          releaseId_documentId: {
            releaseId: contentId,
            documentId: params.id,
          },
        },
        create: {
          releaseId: contentId,
          documentId: params.id,
          usageContext,
          linkedById: session.user.email || 'unknown',
        },
        update: {
          usageContext,
        },
      });
    } else {
      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: contentId },
      });

      if (!post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      // Create link (or update if exists due to unique constraint)
      await prisma.postSourceDocument.upsert({
        where: {
          postId_documentId: {
            postId: contentId,
            documentId: params.id,
          },
        },
        create: {
          postId: contentId,
          documentId: params.id,
          usageContext,
          linkedById: session.user.email || 'unknown',
        },
        update: {
          usageContext,
        },
      });
    }

    // Update document usage stats
    await prisma.sourceDocument.update({
      where: { id: params.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Document linked successfully',
    });
  } catch (error) {
    console.error('Source document link error:', error);
    return NextResponse.json(
      { error: 'Failed to link document' },
      { status: 500 }
    );
  }
}

// DELETE - Unlink a document from content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const contentId = searchParams.get('contentId');

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: 'contentType and contentId are required' },
        { status: 400 }
      );
    }

    if (contentType !== 'release' && contentType !== 'post') {
      return NextResponse.json(
        { error: 'contentType must be either "release" or "post"' },
        { status: 400 }
      );
    }

    // Delete the link
    if (contentType === 'release') {
      await prisma.releaseSourceDocument.deleteMany({
        where: {
          releaseId: contentId,
          documentId: params.id,
        },
      });
    } else {
      await prisma.postSourceDocument.deleteMany({
        where: {
          postId: contentId,
          documentId: params.id,
        },
      });
    }

    // Update document usage stats
    await prisma.sourceDocument.update({
      where: { id: params.id },
      data: {
        usageCount: { decrement: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Document unlinked successfully',
    });
  } catch (error) {
    console.error('Source document unlink error:', error);
    return NextResponse.json(
      { error: 'Failed to unlink document' },
      { status: 500 }
    );
  }
}
