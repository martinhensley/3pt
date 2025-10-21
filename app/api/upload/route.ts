import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";

export type FileType = "image" | "pdf" | "csv" | "html" | "text";

/**
 * Detect file type from file path/extension
 */
function detectFileType(filePath: string): FileType {
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

// Allowed MIME types for upload
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // Documents
  "application/pdf",
  "text/csv",
  "text/html",
  "text/plain",
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `File type not allowed: ${file.type}. Allowed types: images, PDFs, CSVs, HTML, text files`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Upload to Vercel Blob
    console.log("Uploading to Vercel Blob:", filename);
    console.log("Token configured:", !!process.env.BLOB_READ_WRITE_TOKEN);

    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log("Upload successful, blob URL:", blob.url);

    // Detect file type for categorization
    const fileType: FileType = detectFileType(filename);

    return NextResponse.json({
      url: blob.url,
      filename,
      type: fileType,
      mimeType: file.type,
      size: file.size,
      blobUrl: blob.url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
