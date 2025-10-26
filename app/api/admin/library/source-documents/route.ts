import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';

export const runtime = 'nodejs';

// GET - List all source documents with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const documentType = searchParams.get('documentType') as DocumentType | null;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'uploadedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (documentType) {
      where.documentType = documentType;
    }

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
        { extractedText: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.sourceDocument.count({ where });

    // Get documents
    const documents = await prisma.sourceDocument.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        filename: true,
        displayName: true,
        blobUrl: true,
        mimeType: true,
        fileSize: true,
        documentType: true,
        tags: true,
        uploadedAt: true,
        usageCount: true,
        lastUsedAt: true,
      },
    });

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Source documents list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch source documents' },
      { status: 500 }
    );
  }
}

// POST - Upload a new source document
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as DocumentType;
    const displayName = formData.get('displayName') as string | null;
    const description = formData.get('description') as string | null;
    const tagsJson = formData.get('tags') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
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

    // Parse tags
    let tags: string[] = [];
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
      } catch {
        tags = [];
      }
    }

    // Generate filename with timestamp and UUID-like structure
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

    // Extract text for searchability (simplified - just for text files for now)
    let extractedText: string | null = null;
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      extractedText = await file.text();
    }

    // Create database record
    const document = await prisma.sourceDocument.create({
      data: {
        filename: file.name,
        displayName: displayName || file.name.replace(/\.[^/.]+$/, ''),
        blobUrl: blob.url,
        mimeType: file.type,
        fileSize: file.size,
        documentType,
        tags,
        extractedText,
        description,
        uploadedById: session.user.email || 'unknown',
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
        fileSize: document.fileSize,
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
