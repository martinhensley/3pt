import { readFile } from "fs/promises";
import path from "path";
import { parse as csvParse } from "csv-parse/sync";
import { writeFile, mkdir } from "fs/promises";
import { tmpdir } from "os";

export type FileType = "image" | "pdf" | "csv" | "html" | "text";

export interface ParsedDocument {
  type: FileType;
  content: string | string[][];
  metadata?: {
    filename?: string;
    pageCount?: number;
    rowCount?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

/**
 * Parse a PDF file and extract text content
 */
export async function parsePDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await readFile(filePath);
    // Dynamic import to avoid ESM/CommonJS conflicts in Next.js/Vercel
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to parse PDF: ${error}`);
  }
}

/**
 * Parse a CSV file and return as 2D array
 */
export async function parseCSV(filePath: string): Promise<string[][]> {
  try {
    const fileContent = await readFile(filePath, "utf-8");
    const records = csvParse(fileContent, {
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Allow rows with different column counts
    });
    return records;
  } catch (error) {
    console.error("CSV parsing error:", error);
    throw new Error(`Failed to parse CSV: ${error}`);
  }
}

/**
 * Parse an HTML file and extract text content
 */
export async function parseHTML(filePath: string): Promise<string> {
  try {
    const fileContent = await readFile(filePath, "utf-8");
    // Simple HTML tag stripping - for better results, could use a library like cheerio
    const textContent = fileContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove script tags
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove style tags
      .replace(/<[^>]+>/g, " ") // Remove all other HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
    return textContent;
  } catch (error) {
    console.error("HTML parsing error:", error);
    throw new Error(`Failed to parse HTML: ${error}`);
  }
}

/**
 * Read a text file
 */
export async function parseText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf-8");
  } catch (error) {
    console.error("Text parsing error:", error);
    throw new Error(`Failed to parse text file: ${error}`);
  }
}

/**
 * Detect file type from file path/extension
 */
export function detectFileType(filePath: string): FileType {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".pdf":
      return "pdf";
    case ".csv":
      return "csv";
    case ".html":
    case ".htm":
      return "html";
    case ".txt":
      return "text";
    case ".jpg":
    case ".jpeg":
    case ".png":
    case ".webp":
    case ".gif":
      return "image";
    default:
      return "text"; // Default to text for unknown types
  }
}

/**
 * Universal document parser - detects type and routes to appropriate parser
 */
export async function parseDocument(
  filePath: string,
  fileType?: FileType
): Promise<ParsedDocument> {
  const detectedType = fileType || detectFileType(filePath);
  const filename = path.basename(filePath);

  try {
    switch (detectedType) {
      case "pdf": {
        const content = await parsePDF(filePath);
        const pageCount = content.split("\f").length; // Form feed indicates page break
        return {
          type: "pdf",
          content,
          metadata: { filename, pageCount },
        };
      }

      case "csv": {
        const content = await parseCSV(filePath);
        return {
          type: "csv",
          content,
          metadata: { filename, rowCount: content.length },
        };
      }

      case "html": {
        const content = await parseHTML(filePath);
        return {
          type: "html",
          content,
          metadata: { filename },
        };
      }

      case "text": {
        const content = await parseText(filePath);
        return {
          type: "text",
          content,
          metadata: { filename },
        };
      }

      case "image": {
        // For images, we don't parse them here - they'll be sent to AI as base64
        return {
          type: "image",
          content: filePath, // Return path for later processing
          metadata: { filename },
        };
      }

      default:
        throw new Error(`Unsupported file type: ${detectedType}`);
    }
  } catch (error) {
    console.error(`Document parsing error for ${filename}:`, error);
    throw error;
  }
}

/**
 * Download a file from a URL to a temporary location
 */
async function downloadFile(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // Create temp directory
  const tempDir = path.join(tmpdir(), "footy-temp");
  await mkdir(tempDir, { recursive: true });

  // Extract filename from URL or generate one
  const urlPath = new URL(url).pathname;
  const filename = path.basename(urlPath) || `temp-${Date.now()}`;
  const tempPath = path.join(tempDir, filename);

  await writeFile(tempPath, buffer);
  return tempPath;
}

/**
 * Check if a string is a URL
 */
function isUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Parse multiple documents
 */
export async function parseDocuments(
  files: Array<{ url: string; type?: FileType }>
): Promise<ParsedDocument[]> {
  const parsedDocs: ParsedDocument[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    try {
      let filePath: string;

      // Check if URL is a blob URL or external URL
      if (isUrl(file.url)) {
        // Download the file to a temporary location
        filePath = await downloadFile(file.url);
      } else {
        // Local file path (legacy support)
        filePath = path.join(process.cwd(), "public", file.url);
      }

      const parsed = await parseDocument(filePath, file.type);
      parsedDocs.push(parsed);
    } catch (error) {
      console.error(`Failed to parse ${file.url}:`, error);
      errors.push({
        file: file.url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // If we have some successful parses, return them even if some failed
  if (parsedDocs.length > 0) {
    return parsedDocs;
  }

  // If all failed, throw error
  throw new Error(
    `Failed to parse any documents. Errors: ${JSON.stringify(errors)}`
  );
}

/**
 * Convert CSV data to a formatted string for AI analysis
 */
export function formatCSVForAI(csvData: string[][]): string {
  if (csvData.length === 0) return "";

  // Assume first row is headers
  const headers = csvData[0];
  const rows = csvData.slice(1);

  let formatted = `CSV Data (${rows.length} rows):\n\n`;
  formatted += `Headers: ${headers.join(", ")}\n\n`;
  formatted += "Sample rows:\n";

  // Include up to 10 sample rows
  const sampleRows = rows.slice(0, Math.min(10, rows.length));
  sampleRows.forEach((row, idx) => {
    formatted += `Row ${idx + 1}: ${row.join(", ")}\n`;
  });

  if (rows.length > 10) {
    formatted += `\n... and ${rows.length - 10} more rows\n`;
  }

  return formatted;
}
