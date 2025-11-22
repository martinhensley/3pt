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
  // We need to return it with a specific response format
  if (challenge) {
    console.log("eBay endpoint verification - challenge code received:", challenge);

    // eBay expects JSON response with challengeResponse field
    return new NextResponse(
      JSON.stringify({ challengeResponse: challenge }),
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
