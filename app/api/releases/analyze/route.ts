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

    // Step 1: Extract text from PDF if needed
    console.log('Analyzing release with Genkit...');
    let extractedText = documentText;

    if (fileUrl && mimeType === 'application/pdf') {
      console.log('Extracting text from PDF:', fileUrl);
      try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Disable worker for serverless compatibility
        // Workers don't work in Vercel serverless functions due to file system restrictions
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';

        const pdfResponse = await fetch(fileUrl);
        const pdfBuffer = await pdfResponse.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({
          data: pdfBuffer,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
          disableWorker: true, // Force disable worker
        });
        const pdfDocument = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        }

        extractedText = fullText;
        console.log('PDF text extracted, length:', extractedText.length);
      } catch (pdfError) {
        console.error('PDF text extraction failed:', pdfError);
        throw new Error(`Failed to extract text from PDF: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
      }
    }

    // Step 2: Analyze with Claude via Genkit
    console.log('Analyzing release with Claude via Genkit...');
    const releaseInfo = await analyzeReleaseFlow({
      documentText: extractedText,
    });
    console.log('Release analysis complete:', releaseInfo);

    // Step 3: Generate description with Claude via Genkit
    console.log('Generating description with Claude via Genkit...');
    const descriptionResult = await generateDescriptionFlow({
      release: releaseInfo,
      sourceText: extractedText,
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
          sellSheetText: extractedText,
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
