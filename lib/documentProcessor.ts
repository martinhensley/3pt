/**
 * Document Processing Library
 *
 * Prepares documents for AI processing using Claude's native PDF and image understanding.
 * Documents are passed directly to Claude SDK instead of pre-extracting text.
 */

export interface SourceDocument {
  blobUrl: string;
  filename: string;
  displayName: string;
  mimeType: string;
  documentType: string;
}

export interface DocumentForAI {
  filename: string;
  displayName: string;
  documentType: string;
  mimeType: string;
  blobUrl: string;
  isSupported: boolean;
  reason?: string;
}

/**
 * Determine if a document is supported by Claude's native understanding
 */
function isDocumentSupportedByAI(mimeType: string): { supported: boolean; reason?: string } {
  // Claude supports PDFs and images natively
  if (mimeType === 'application/pdf') {
    return { supported: true };
  }

  if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
    return { supported: true };
  }

  // Text files can be read and passed as text
  if (mimeType === 'text/plain' || mimeType === 'text/csv') {
    return { supported: true };
  }

  return {
    supported: false,
    reason: `Unsupported MIME type: ${mimeType}`
  };
}

/**
 * Filter and prepare documents for AI processing
 * Excludes checklists and unsupported formats
 */
export function prepareDocumentsForAI(
  documents: SourceDocument[]
): DocumentForAI[] {
  return documents
    .filter(doc => {
      // Exclude checklists - they're structured data, not narrative content
      if (doc.documentType === 'CHECKLIST') {
        return false;
      }

      // Only include sell sheets, press releases, images, and other narrative content
      return ['SELL_SHEET', 'PRESS_RELEASE', 'IMAGE', 'OTHER'].includes(doc.documentType);
    })
    .map(doc => {
      const supportCheck = isDocumentSupportedByAI(doc.mimeType);

      return {
        filename: doc.filename,
        displayName: doc.displayName,
        documentType: doc.documentType,
        mimeType: doc.mimeType,
        blobUrl: doc.blobUrl,
        isSupported: supportCheck.supported,
        reason: supportCheck.reason,
      };
    })
    .filter(doc => doc.isSupported); // Only return supported documents
}

/**
 * Fetch file content from Vercel Blob Storage
 */
export async function fetchDocumentContent(blobUrl: string): Promise<Buffer> {
  const response = await fetch(blobUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
