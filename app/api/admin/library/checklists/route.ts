import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET - List all checklists with filtering and pagination
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
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'uploadedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause - only CHECKLIST documents
    const where: Record<string, unknown> = {
      documentType: 'CHECKLIST',
    };

    // Add search filter
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.sourceDocument.count({ where });

    // Get checklists with release/set information
    const checklists = await prisma.sourceDocument.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        releases: {
          include: {
            release: {
              include: {
                sets: true,
              },
            },
          },
        },
      },
    });

    // Transform to match the UI interface
    // For each checklist, we need to determine which set it belongs to
    // This is a bit complex because checklists are linked to releases, not sets
    // We'll need to infer the set from the checklist name or context
    const transformedChecklists = checklists.map((checklist) => {
      const releaseLink = checklist.releases[0]; // Get first release link
      if (!releaseLink) {
        return null; // Skip checklists not linked to releases
      }

      const release = releaseLink.release;

      // Try to determine which set this checklist belongs to
      // Look for set name in the checklist filename or tags
      let matchedSet = release.sets[0]; // Default to first set

      if (release.sets.length > 1) {
        // Try to match set name in checklist name
        for (const set of release.sets) {
          const setNameLower = set.name.toLowerCase();
          const checklistNameLower = checklist.displayName.toLowerCase();
          if (checklistNameLower.includes(setNameLower)) {
            matchedSet = set;
            break;
          }
        }
      }

      if (!matchedSet) {
        return null; // Skip if no set found
      }

      return {
        id: checklist.id,
        name: checklist.displayName,
        fileUrl: checklist.blobUrl,
        fileSize: checklist.fileSize,
        mimeType: checklist.mimeType,
        uploadedAt: checklist.uploadedAt.toISOString(),
        set: {
          id: matchedSet.id,
          name: matchedSet.name,
          release: {
            id: release.id,
            name: release.name,
            year: release.year,
          },
        },
      };
    }).filter(Boolean); // Remove null entries

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      checklists: transformedChecklists,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Checklists library error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checklists' },
      { status: 500 }
    );
  }
}
