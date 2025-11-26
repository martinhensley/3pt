import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeReleaseFlow, generateDescriptionFlow } from '@/lib/release-analyzer';
import { prisma } from '@/lib/prisma';
import { parseReleaseDateToCreatedAt } from '@/lib/formatters';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for AI processing

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentText, fileUrl, fileUrls, mimeType, uploadedImages = [], createRelease = false, releaseDate } = body;

    // Support both single file (fileUrl) and multiple files (fileUrls)
    const urlsToProcess = fileUrls || (fileUrl ? [fileUrl] : []);

    // Support both file upload and direct text input
    if (!documentText && urlsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'Either documentText or fileUrl/fileUrls is required' },
        { status: 400 }
      );
    }

    // Step 1: Analyze with Claude (Anthropic SDK)
    // Claude can read PDFs and images directly, so we pass URLs instead of extracting text
    console.log('Analyzing release with Claude (Anthropic SDK)...');
    const releaseInfo = await analyzeReleaseFlow({
      documentText: documentText || undefined,
      documentUrl: urlsToProcess.length === 1 ? urlsToProcess[0] : undefined,
      documentUrls: urlsToProcess.length > 1 ? urlsToProcess : undefined,
      mimeType: mimeType || undefined,
    });
    console.log('Release analysis complete:', releaseInfo);

    // For description generation, we need text - extract from PDF if needed
    let sourceText = documentText;
    if (!sourceText && fileUrl && mimeType === 'application/pdf') {
      // Use the release info as a minimal source if no text provided
      sourceText = `Release: ${releaseInfo.fullReleaseName}\nYear: ${releaseInfo.year}\nManufacturer: ${releaseInfo.manufacturer}`;
    }

    // Step 3: Generate description with Claude (Anthropic SDK)
    console.log('Generating description with Claude (Anthropic SDK)...');
    const descriptionResult = await generateDescriptionFlow({
      release: releaseInfo,
      sourceText: sourceText,
    });
    console.log('Description generated');

    // Step 4: Create database records if requested
    let createdRelease = null;
    if (createRelease) {
      console.log('Creating database records...');

      // Get or create manufacturer
      let manufacturer = await prisma.manufacturer.findFirst({
        where: {
          name: {
            equals: releaseInfo.manufacturer,
            mode: 'insensitive',
          },
        },
      });

      if (!manufacturer) {
        manufacturer = await prisma.manufacturer.create({
          data: {
            name: releaseInfo.manufacturer,
          },
        });
      }

      // Check for duplicate release by slug
      const { findReleaseBySlug, findExistingRelease } = await import('@/lib/database');

      const duplicateBySlug = await findReleaseBySlug(releaseInfo.slug);
      if (duplicateBySlug) {
        console.log('Duplicate release found by slug:', releaseInfo.slug);
        return NextResponse.json(
          {
            error: 'Duplicate release',
            message: `A release with this slug already exists: ${releaseInfo.slug}`,
            existingRelease: {
              id: duplicateBySlug.id,
              name: duplicateBySlug.name,
              year: duplicateBySlug.year,
              slug: duplicateBySlug.slug,
              manufacturer: duplicateBySlug.manufacturer.name,
              setCount: duplicateBySlug._count.sets,
            },
          },
          { status: 409 }
        );
      }

      // Check for duplicate release by manufacturer + name + year (case-insensitive)
      const duplicateByData = await findExistingRelease(
        manufacturer.id,
        releaseInfo.releaseName,
        releaseInfo.year
      );
      if (duplicateByData) {
        console.log('Duplicate release found by data:', {
          manufacturer: manufacturer.name,
          name: releaseInfo.releaseName,
          year: releaseInfo.year,
        });
        return NextResponse.json(
          {
            error: 'Duplicate release',
            message: `A release with this name already exists for ${manufacturer.name}`,
            existingRelease: {
              id: duplicateByData.id,
              name: duplicateByData.name,
              year: duplicateByData.year,
              slug: duplicateByData.slug,
              manufacturer: duplicateByData.manufacturer.name,
            },
          },
          { status: 409 }
        );
      }

      // Use the manually edited release date if provided, otherwise use the one from analysis
      const finalReleaseDate = releaseDate || releaseInfo.releaseDate || null;

      // Parse releaseDate string to createdAt DateTime at 4:20pm MT
      const createdAtDate = finalReleaseDate
        ? parseReleaseDateToCreatedAt(finalReleaseDate)
        : undefined;

      // Create release
      const release = await prisma.release.create({
        data: {
          manufacturerId: manufacturer.id,
          name: releaseInfo.releaseName, // Use releaseName (without year/manufacturer) instead of fullReleaseName
          year: releaseInfo.year,
          slug: releaseInfo.slug,
          summary: descriptionResult.description,
          releaseDate: finalReleaseDate,
          ...(createdAtDate && { createdAt: createdAtDate }),
        },
      });

      // Create images from uploaded images
      if (uploadedImages.length > 0) {
        for (let i = 0; i < uploadedImages.length; i++) {
          await prisma.image.create({
            data: {
              url: uploadedImages[i],
              order: i,
              caption: null,
              type: 'RELEASE',
              releaseId: release.id,
            },
          });
        }
        console.log(`Created ${uploadedImages.length} image records for release`);
      }

      // Create source document records for all uploaded files
      if (urlsToProcess.length > 0) {
        try {
          for (const [index, url] of urlsToProcess.entries()) {
            const filename = url.split('/').pop() || 'document';
            const displayName = urlsToProcess.length > 1
              ? `${releaseInfo.manufacturer} ${releaseInfo.releaseName} ${releaseInfo.year} - Page ${index + 1}`
              : `${releaseInfo.manufacturer} ${releaseInfo.releaseName} ${releaseInfo.year}`;

            // Determine document type based on mime type and context
            let documentType = 'OTHER';
            if (mimeType?.includes('pdf')) {
              // Most PDFs for releases are sell sheets or checklists
              documentType = filename.toLowerCase().includes('checklist') ? 'CHECKLIST' : 'SELL_SHEET';
            } else if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet') || mimeType?.includes('csv')) {
              documentType = 'CHECKLIST';
            }

            await prisma.sourceDocument.create({
              data: {
                filename: filename,
                displayName: displayName,
                blobUrl: url,
                mimeType: mimeType || 'application/octet-stream',
                documentType: documentType as any,
                entityType: 'RELEASE',
                tags: [releaseInfo.year, releaseInfo.manufacturer, releaseInfo.releaseName],
                extractedText: sourceText || null,
                uploadedById: session.user.email || 'unknown',
                releaseId: release.id,
              },
            });
          }
          console.log(`Saved ${urlsToProcess.length} source document(s) to library`);
        } catch (docError) {
          console.error('Failed to save source documents:', docError);
          // Don't fail the whole request if source document save fails
        }
      }

      // Note: Sets will be added later via the manage releases workflow
      // Do not create sets during initial release creation

      createdRelease = await prisma.release.findUnique({
        where: { id: release.id },
        include: {
          manufacturer: true,
          sets: true,
          images: {
            orderBy: { order: 'asc' },
          },
        },
      });

      console.log('Database records created successfully');
    }

    return NextResponse.json({
      success: true,
      releaseInfo,
      summary: descriptionResult.description,
      createdRelease,
    });
  } catch (error: any) {
    console.error('Release analysis error:', error);

    // Handle Prisma unique constraint violation (P2002)
    if (error.code === 'P2002') {
      const target = error.meta?.target || ['unknown field'];
      console.error('Unique constraint violation on:', target);

      return NextResponse.json(
        {
          error: 'Duplicate release',
          message: `A release with this ${target.join(', ')} already exists`,
          details: 'This release appears to be a duplicate. Please check existing releases.',
        },
        { status: 409 }
      );
    }

    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    console.error('Full error details:', errorDetails);

    return NextResponse.json(
      {
        error: 'Failed to analyze release',
        details: errorDetails.message,
        debugInfo: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
