import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for PDF processing

// POST - Convert PDF pages to images and upload to blob storage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pdfUrl } = body;

    if (!pdfUrl) {
      return NextResponse.json(
        { error: 'PDF URL is required' },
        { status: 400 }
      );
    }

    console.log('Fetching PDF from:', pdfUrl);

    // Fetch the PDF file
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF');
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    console.log('PDF buffer size:', pdfBuffer.length);

    // Convert PDF pages to images using pdfjs-dist
    console.log('Converting PDF pages to images...');
    const imageUrls: string[] = [];

    try {
      // Dynamic imports to avoid bundling issues
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const canvasModule = await import('canvas');
      const createCanvas = canvasModule.default?.createCanvas || canvasModule.createCanvas;

      // Configure GlobalWorkerOptions to use the worker from the same package
      // Disable worker for server-side rendering
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useSystemFonts: true,
        useWorkerFetch: false,
        isEvalSupported: false,
      });

      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;
      console.log(`PDF has ${numPages} pages`);

      // Process each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        console.log(`Processing page ${pageNum}/${numPages}...`);

        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for quality

        // Create canvas
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // Render PDF page to canvas
        await page.render({
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport: viewport,
        }).promise;

        // Convert canvas to PNG buffer
        const imageBuffer = canvas.toBuffer('image/png');

        // Upload to Vercel Blob
        const filename = `pdf-page-${Date.now()}-${pageNum}.png`;
        const blob = await put(filename, imageBuffer, {
          access: 'public',
          contentType: 'image/png',
        });

        imageUrls.push(blob.url);
        console.log(`Page ${pageNum} uploaded:`, blob.url);
      }
    } catch (pdfError) {
      console.error('PDF conversion error:', pdfError);
      throw new Error(`Failed to convert PDF to images: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
    }

    console.log(`Successfully converted ${imageUrls.length} pages to images`);

    return NextResponse.json({
      success: true,
      imageUrls,
      pageCount: imageUrls.length,
    });
  } catch (error) {
    console.error('PDF to images error:', error);
    return NextResponse.json(
      {
        error: 'Failed to convert PDF to images',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
