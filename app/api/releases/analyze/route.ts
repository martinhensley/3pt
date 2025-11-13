import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeReleaseFlow, generateDescriptionFlow } from '@/lib/genkit';
import { prisma } from '@/lib/prisma';
import { parseReleaseDateToPostDate } from '@/lib/formatters';

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
    const { documentText, fileUrl, mimeType, uploadedImages = [], createRelease = false } = body;

    // Support both file upload and direct text input
    if (!documentText && !fileUrl) {
      return NextResponse.json(
        { error: 'Either documentText or fileUrl is required' },
        { status: 400 }
      );
    }

    // Step 1: Analyze with Claude (Anthropic SDK)
    // Claude can read PDFs directly, so we pass the URL instead of extracting text
    console.log('Analyzing release with Claude (Anthropic SDK)...');
    const releaseInfo = await analyzeReleaseFlow({
      documentText: documentText || undefined,
      documentUrl: fileUrl || undefined,
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

      // Prepare sourceFiles array from uploaded file
      const sourceFiles = fileUrl
        ? [
            {
              url: fileUrl,
              type: mimeType || 'application/pdf',
              filename: fileUrl.split('/').pop() || 'document',
            },
          ]
        : null;

      // Parse releaseDate string to postDate DateTime
      const postDate = releaseInfo.releaseDate
        ? parseReleaseDateToPostDate(releaseInfo.releaseDate)
        : null;

      // Create release
      const release = await prisma.release.create({
        data: {
          manufacturerId: manufacturer.id,
          name: releaseInfo.releaseName, // Use releaseName (without year/manufacturer) instead of fullReleaseName
          year: releaseInfo.year,
          slug: releaseInfo.slug,
          description: descriptionResult.description,
          releaseDate: releaseInfo.releaseDate || null,
          postDate: postDate,
          sellSheetText: sourceText,
          sourceFiles: sourceFiles || undefined,
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

      // Create source document record if fileUrl was provided
      if (fileUrl) {
        try {
          const filename = fileUrl.split('/').pop() || 'document';
          const displayName = `${releaseInfo.manufacturer} ${releaseInfo.releaseName} ${releaseInfo.year}`;

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
              blobUrl: fileUrl,
              mimeType: mimeType || 'application/octet-stream',
              fileSize: 0, // We don't have size info at this point
              documentType: documentType as any,
              tags: [releaseInfo.year, releaseInfo.manufacturer, releaseInfo.releaseName],
              extractedText: sourceText || null,
              uploadedById: session.user.email || 'unknown',
              releaseId: release.id,
            },
          });
          console.log('Source document saved to library');
        } catch (docError) {
          console.error('Failed to save source document:', docError);
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
      description: descriptionResult.description,
      createdRelease,
    });
  } catch (error) {
    console.error('Release analysis error:', error);

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
