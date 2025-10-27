import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import sharp from 'sharp';

export interface ExtractedImage {
  buffer: Buffer;
  format: 'png' | 'jpeg';
  width: number;
  height: number;
  pageNumber: number;
  index: number;
}

/**
 * Extract images from a PDF file
 * @param pdfPath - Path to the PDF file (can be local path or will be downloaded)
 * @returns Array of extracted images with metadata
 */
export async function extractImagesFromPDF(pdfPath: string): Promise<ExtractedImage[]> {
  try {
    // Read the PDF file
    const pdfBuffer = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

    const extractedImages: ExtractedImage[] = [];
    const pages = pdfDoc.getPages();

    console.log(`PDF has ${pages.length} pages`);

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];

      try {
        // Get all resources from the page
        const resources = page.node.Resources();
        if (!resources) {
          console.log(`Page ${pageIndex + 1}: No resources found`);
          continue;
        }

        // Get XObject resources (images are stored as XObjects)
        const xObjectsRef = resources.get(pdfDoc.context.obj('XObject'));
        if (!xObjectsRef) {
          console.log(`Page ${pageIndex + 1}: No XObjects found`);
          continue;
        }

        const xObjects = pdfDoc.context.lookup(xObjectsRef);
        if (!xObjects || typeof xObjects !== 'object') {
          console.log(`Page ${pageIndex + 1}: XObjects not an object`);
          continue;
        }

        // Get all XObject entries
        const xObjectKeys = xObjects.dict ? xObjects.dict.entries() : [];
        let imageIndexOnPage = 0;

        console.log(`Page ${pageIndex + 1}: Found ${xObjectKeys.length} XObjects`);

        for (const [key, xObjectRef] of xObjectKeys) {
          try {
            const xObject = pdfDoc.context.lookup(xObjectRef);
            if (!xObject || typeof xObject !== 'object') continue;

            // Check if this XObject is an image
            const subtypeRef = xObject.dict?.get(pdfDoc.context.obj('Subtype'));
            const subtype = subtypeRef ? pdfDoc.context.lookup(subtypeRef) : null;

            if (!subtype || subtype.toString() !== '/Image') {
              console.log(`Page ${pageIndex + 1}, XObject ${key}: Not an image (${subtype?.toString()})`);
              continue;
            }

            console.log(`Page ${pageIndex + 1}, XObject ${key}: Found image!`);

            // Get image properties using dict.get
            const widthRef = xObject.dict?.get(pdfDoc.context.obj('Width'));
            const heightRef = xObject.dict?.get(pdfDoc.context.obj('Height'));
            const colorSpaceRef = xObject.dict?.get(pdfDoc.context.obj('ColorSpace'));
            const filterRef = xObject.dict?.get(pdfDoc.context.obj('Filter'));

            const width = widthRef ? pdfDoc.context.lookup(widthRef) : null;
            const height = heightRef ? pdfDoc.context.lookup(heightRef) : null;
            const colorSpace = colorSpaceRef ? pdfDoc.context.lookup(colorSpaceRef) : null;
            const filter = filterRef ? pdfDoc.context.lookup(filterRef) : null;

            // Get dimensions
            const imgWidth = typeof width === 'number' ? width : (width && typeof width === 'object' && 'value' in width ? width.value : 0);
            const imgHeight = typeof height === 'number' ? height : (height && typeof height === 'object' && 'value' in width ? height.value : 0);

            console.log(`  Image dimensions: ${imgWidth}x${imgHeight}`);

            // Skip very small images (likely logos or artifacts < 100x100)
            if (imgWidth < 100 || imgHeight < 100) {
              console.log(`  Skipping small image: ${imgWidth}x${imgHeight}`);
              continue;
            }

            // Get the image data stream
            let imageData: Uint8Array | undefined;

            // Try to get image contents
            try {
              imageData = xObject.contents;
            } catch (e) {
              console.log(`  Failed to get image contents:`, e);
              continue;
            }

            if (!imageData || imageData.length === 0) {
              console.log(`  No image data found`);
              continue;
            }

            console.log(`  Image data size: ${imageData.length} bytes`);

            // Convert to PNG using sharp for consistent format
            let imageBuffer: Buffer;
            let format: 'png' | 'jpeg' = 'png';

            try {
              const filterStr = filter?.toString();
              console.log(`  Filter: ${filterStr}`);

              // Determine if it's already JPEG
              if (filterStr === '/DCTDecode') {
                // It's a JPEG, we can use it directly or convert
                console.log(`  Processing JPEG image`);
                imageBuffer = await sharp(Buffer.from(imageData))
                  .png()
                  .toBuffer();
                format = 'png';
              } else if (filterStr === '/FlateDecode') {
                // Compressed image data - need to decompress and convert
                console.log(`  Processing FlateDecode image`);
                const colorSpaceStr = colorSpace?.toString();
                console.log(`  ColorSpace: ${colorSpaceStr}`);

                let channels = 3;
                if (colorSpaceStr === '/DeviceGray' || colorSpaceStr === '/Gray') {
                  channels = 1;
                } else if (colorSpaceStr === '/DeviceRGB' || colorSpaceStr === '/RGB') {
                  channels = 3;
                } else if (colorSpaceStr === '/DeviceCMYK' || colorSpaceStr === '/CMYK') {
                  channels = 4;
                }

                try {
                  imageBuffer = await sharp(Buffer.from(imageData), {
                    raw: {
                      width: imgWidth,
                      height: imgHeight,
                      channels,
                    }
                  }).png().toBuffer();
                  format = 'png';
                } catch (rawError) {
                  // If raw processing fails, try to process as-is
                  console.log(`  Raw processing failed, trying direct conversion`);
                  imageBuffer = await sharp(Buffer.from(imageData)).png().toBuffer();
                  format = 'png';
                }
              } else {
                // Unknown filter or no filter - try direct processing
                console.log(`  Processing image with unknown/no filter`);
                try {
                  imageBuffer = await sharp(Buffer.from(imageData)).png().toBuffer();
                  format = 'png';
                } catch (directError) {
                  console.log(`  Direct processing failed, trying raw RGB`);
                  imageBuffer = await sharp(Buffer.from(imageData), {
                    raw: {
                      width: imgWidth,
                      height: imgHeight,
                      channels: 3,
                    }
                  }).png().toBuffer();
                  format = 'png';
                }
              }

              // Get actual dimensions after processing
              const metadata = await sharp(imageBuffer).metadata();
              console.log(`  Converted image: ${metadata.width}x${metadata.height}`);

              extractedImages.push({
                buffer: imageBuffer,
                format,
                width: metadata.width || imgWidth,
                height: metadata.height || imgHeight,
                pageNumber: pageIndex + 1,
                index: imageIndexOnPage,
              });

              imageIndexOnPage++;
              console.log(`  Successfully extracted image ${imageIndexOnPage}`);
            } catch (conversionError) {
              console.warn(`  Failed to convert image on page ${pageIndex + 1}:`, conversionError);
              // Continue to next image
            }
          } catch (xObjectError) {
            console.warn(`Error processing XObject on page ${pageIndex + 1}:`, xObjectError);
            // Continue to next XObject
          }
        }
      } catch (pageError) {
        console.warn(`Error processing page ${pageIndex + 1}:`, pageError);
        // Continue to next page
      }
    }

    console.log(`Extracted ${extractedImages.length} images from PDF`);
    return extractedImages;
  } catch (error) {
    console.error('Error extracting images from PDF:', error);
    throw new Error(`Failed to extract images from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Filter images by minimum size to exclude small logos/icons
 * @param images - Array of extracted images
 * @param minWidth - Minimum width in pixels (default: 200)
 * @param minHeight - Minimum height in pixels (default: 200)
 * @returns Filtered array of images
 */
export function filterImagesBySize(
  images: ExtractedImage[],
  minWidth: number = 200,
  minHeight: number = 200
): ExtractedImage[] {
  return images.filter(img => img.width >= minWidth && img.height >= minHeight);
}

/**
 * Get the largest N images from the extracted images
 * Useful for getting the most prominent images (like cover pages, card examples)
 * @param images - Array of extracted images
 * @param count - Number of images to return
 * @returns Array of the largest images
 */
export function getLargestImages(images: ExtractedImage[], count: number = 5): ExtractedImage[] {
  return images
    .sort((a, b) => (b.width * b.height) - (a.width * a.height))
    .slice(0, count);
}
