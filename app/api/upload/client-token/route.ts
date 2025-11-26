import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Server endpoint to handle client-side blob uploads
 * This generates tokens for direct browser-to-blob uploads, bypassing serverless size limits
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate the upload before generating a token
        // pathname is the filename being uploaded
        console.log("Generating upload token for:", pathname);

        return {
          allowedContentTypes: [
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
            // Excel
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB limit
          tokenPayload: JSON.stringify({
            uploadedBy: session.user.email,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is called after the upload completes
        // We could log this or create database records here
        console.log("Upload completed:", blob.url);
        try {
          const payload = JSON.parse(tokenPayload || "{}");
          console.log("Uploaded by:", payload.uploadedBy);
        } catch {
          // Ignore JSON parse errors
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Client upload error:", error);
    return NextResponse.json(
      { error: "Failed to handle upload", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
