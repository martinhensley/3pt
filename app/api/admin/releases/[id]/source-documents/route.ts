import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// POST - Upload and link a source document to a release
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: releaseId } = await params;

    // Check if release exists
    const release = await prisma.release.findUnique({
      where: { id: releaseId },
    });

    if (!release) {
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Auto-determine document type based on filename
    let documentType = 'OTHER';
    const lowerFilename = file.name.toLowerCase();
    if (lowerFilename.includes('sell-sheet') || lowerFilename.includes('sellsheet')) {
      documentType = 'SELL_SHEET';
    } else if (lowerFilename.includes('checklist')) {
      documentType = 'CHECKLIST';
    } else if (lowerFilename.includes('press') || lowerFilename.includes('release')) {
      documentType = 'PRESS_RELEASE';
    } else if (lowerFilename.includes('price') || lowerFilename.includes('guide')) {
      documentType = 'PRICE_GUIDE';
    } else if (file.type.startsWith('image/')) {
      documentType = 'IMAGE';
    }

    // Generate filename with timestamp
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const ext = file.name.split('.').pop();
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    const blobPath = `source-documents/${year}/${month}/${timestamp}-${sanitizedName}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Create display name from filename (remove timestamp prefix if present)
    let displayName = file.name
      .replace(/^\d+-/, '') // Remove timestamp prefix
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize words

    // Create database record linked to release
    const document = await prisma.sourceDocument.create({
      data: {
        filename: file.name,
        displayName,
        blobUrl: blob.url,
        mimeType: file.type,
        documentType: documentType as any,
        entityType: 'RELEASE',
        tags: [],
        uploadedById: session.user.email || 'unknown',
        releaseId: releaseId,
        usageContext: 'Uploaded for release content creation',
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        displayName: document.displayName,
        blobUrl: document.blobUrl,
        documentType: document.documentType,
        mimeType: document.mimeType,
      },
    });
  } catch (error) {
    console.error('Source document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload source document' },
      { status: 500 }
    );
  }
}
