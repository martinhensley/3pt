import 'dotenv/config'; // Load environment variables
import { analyzeReleaseFlow, generateDescriptionFlow } from './lib/genkit';
import { renderPDFPagesToImages } from './lib/pdfImageExtractor';
import { tmpdir } from 'os';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Test URL - using the most recent Donruss Soccer PDF upload
const TEST_PDF_URL = 'https://glxspabwcixgafov.public.blob.vercel-storage.com/1762087011320-2024-25-Donruss-Soccer-Cards-Sell-Sheet.pdf';

// Mock PDF text extraction with sample data from Donruss Soccer
const SAMPLE_TEXT = `
2024-25 Panini Donruss Soccer

Official Release

Base Set: 200 Cards
- Veterans
- Rookies
- Rated Rookies

Parallels:
- Press Proof Red /199
- Press Proof Purple /99
- Press Proof Green /50
- Press Proof Orange /25
- Press Proof Gold /10
- Press Proof Black 1/1

Inserts:
- Elite Series
- The Rookies
- Net Marvels
- Pitch Kings

Autographs:
- Rated Rookie Signatures
- Elite Series Signatures
- Net Marvels Signatures

Memorabilia:
- Rated Rookie Jersey
- Pitch Kings Jersey

Release Date: January 2025
`;

async function extractPDFText(pdfUrl: string): Promise<string> {
  console.log('Using sample PDF text...');
  return SAMPLE_TEXT;
}

async function testWorkflow() {
  try {
    console.log('='.repeat(60));
    console.log('TESTING GENKIT WORKFLOW');
    console.log('='.repeat(60));
    console.log();

    // Step 1: Extract text from PDF
    console.log('STEP 1: Extracting text from PDF...');
    const documentText = await extractPDFText(TEST_PDF_URL);
    console.log(`✓ Extracted ${documentText.length} characters`);
    console.log();

    // Step 2: Extract PDF page images
    console.log('STEP 2: Extracting PDF page images...');
    const tempDir = path.join(tmpdir(), 'footy-pdf-test');
    await mkdir(tempDir, { recursive: true });

    const response = await fetch(TEST_PDF_URL);
    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    const tempPdfPath = path.join(tempDir, 'test.pdf');
    await writeFile(tempPdfPath, pdfBuffer);

    const images = await renderPDFPagesToImages(tempPdfPath, { scale: 2.0 });
    console.log(`✓ Rendered ${images.length} page images`);
    console.log();

    // Step 3: Analyze release with Genkit
    console.log('STEP 3: Analyzing release with Genkit...');
    const releaseInfo = await analyzeReleaseFlow({
      documentText,
    });
    console.log('✓ Release analysis complete:');
    console.log(`  Full Name: ${releaseInfo.fullReleaseName}`);
    console.log(`  Manufacturer: ${releaseInfo.manufacturer}`);
    console.log(`  Year: ${releaseInfo.year}`);
    console.log(`  Release Date: ${releaseInfo.releaseDate || 'Not specified'}`);
    console.log(`  Sets: ${releaseInfo.sets.length}`);
    releaseInfo.sets.forEach((set, idx) => {
      console.log(`    ${idx + 1}. ${set.name}`);
      if (set.totalCards) console.log(`       Total Cards: ${set.totalCards}`);
      if (set.parallels && set.parallels.length > 0) {
        console.log(`       Parallels: ${set.parallels.slice(0, 3).join(', ')}${set.parallels.length > 3 ? '...' : ''}`);
      }
    });
    console.log();

    // Step 4: Generate description with Genkit
    console.log('STEP 4: Generating description with Genkit...');
    const descriptionResult = await generateDescriptionFlow({
      release: releaseInfo,
      sourceText: documentText,
    });
    console.log('✓ Description generated:');
    console.log();
    console.log(descriptionResult.description);
    console.log();

    // Count sentences
    const sentences = descriptionResult.description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    console.log(`  (${sentences.length} sentences)`);
    console.log();

    console.log('='.repeat(60));
    console.log('✓ WORKFLOW TEST COMPLETE');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error during workflow test:', error);
    throw error;
  }
}

// Run the test
testWorkflow()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
