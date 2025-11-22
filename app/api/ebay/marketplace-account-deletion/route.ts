import { NextRequest, NextResponse } from "next/server";

/**
 * eBay Marketplace Account Deletion/Notification Endpoint
 * Required for GDPR compliance
 *
 * This endpoint receives notifications when eBay users request account deletion.
 * eBay will send a verification challenge during setup, then send actual deletion
 * notifications when users delete their eBay accounts.
 *
 * Documentation: https://developer.ebay.com/api-docs/buy/feed/overview.html#market
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get("challenge_code");

  // During endpoint verification, eBay sends a challenge_code parameter
  // We need to return a SHA-256 hash of: challenge_code + verification_token + endpoint_url
  if (challenge) {
    console.log("eBay endpoint verification - challenge code received:", challenge);

    const verificationToken = process.env.EBAY_VERIFICATION_TOKEN || "";
    const endpointUrl = process.env.EBAY_DELETION_ENDPOINT_URL || "";

    // Create the hash string: challengeCode + verificationToken + endpointUrl
    const hashString = challenge + verificationToken + endpointUrl;

    // Generate SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log("eBay challenge response hash generated:", hashHex);

    // eBay expects JSON response with challengeResponse field containing the hash
    return new NextResponse(
      JSON.stringify({ challengeResponse: hashHex }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // If no challenge code, return success
  return NextResponse.json({
    message: "eBay Marketplace Account Deletion endpoint is active",
  }, {
    status: 200,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from eBay
    const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;
    const authHeader = request.headers.get("authorization");

    // eBay sends the verification token in the Authorization header
    if (verificationToken && authHeader !== `Bearer ${verificationToken}`) {
      console.error("eBay notification rejected - invalid verification token");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the notification payload
    const notification = await request.json();

    console.log("eBay Marketplace Account Deletion Notification received:", {
      timestamp: new Date().toISOString(),
      notificationId: notification.metadata?.notificationId,
      topic: notification.metadata?.topic,
    });

    // Log the notification for compliance records
    // In a production environment, you would:
    // 1. Store this notification in your database
    // 2. Process the user account deletion request
    // 3. Remove any personally identifiable information (PII)
    // 4. Maintain an audit log

    console.log("Full notification payload:", JSON.stringify(notification, null, 2));

    // TODO: Implement actual account deletion logic if you store eBay user data
    // For now, we just acknowledge receipt

    return NextResponse.json({
      message: "Notification received and logged",
    }, {
      status: 200,
    });

  } catch (error) {
    console.error("Error processing eBay notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
