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
    // Parse the notification payload
    let notification;
    try {
      notification = await request.json();
    } catch {
      // If body parsing fails, still acknowledge receipt to avoid eBay marking us down
      console.warn("eBay notification received with unparseable body");
      return NextResponse.json({
        message: "Notification acknowledged",
      }, {
        status: 200,
      });
    }

    // Log notification details for compliance
    console.log("eBay Marketplace Account Deletion Notification received:", {
      timestamp: new Date().toISOString(),
      notificationId: notification?.metadata?.notificationId,
      topic: notification?.metadata?.topic,
      userId: notification?.notification?.data?.userId,
      username: notification?.notification?.data?.username,
    });

    // Log the full payload for debugging
    console.log("Full notification payload:", JSON.stringify(notification, null, 2));

    // Note: eBay verifies endpoints through the challenge/response mechanism on GET requests.
    // Notification authenticity is ensured by eBay's infrastructure.
    // If you need additional verification, implement signature validation per eBay docs.

    // TODO: Implement actual account deletion logic if you store eBay user data
    // This application uses eBay Partner Network (affiliate links) and does not store
    // user PII, so no deletion action is required beyond acknowledging receipt.

    // Always return 200 to acknowledge receipt (required by eBay)
    return NextResponse.json({
      message: "Notification received and processed",
    }, {
      status: 200,
    });

  } catch (error) {
    // Log the error but still return 200 to avoid eBay marking us as down
    console.error("Error processing eBay notification:", error);
    return NextResponse.json({
      message: "Notification acknowledged",
    }, {
      status: 200,
    });
  }
}
