import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN || 'hereisalongtokenforebaytodosomestuff';
const ENDPOINT_URL = process.env.EBAY_DELETION_ENDPOINT_URL || 'https://footylimited.com/api/ebay/account-deletion';

interface ChallengeRequest {
  challengeCode: string;
}

interface DeletionNotification {
  username?: string;
  userId?: string;
  eiasToken?: string;
}

// Handle GET requests (for challenge validation)
export async function GET(request: NextRequest) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const challengeCode = searchParams.get('challenge_code');

  // If challenge_code is present, handle the challenge
  if (challengeCode) {
    // Construct the endpoint URL from the actual request
    const actualEndpointUrl = `${origin}${pathname}`;
    return handleChallenge({ challengeCode }, actualEndpointUrl);
  }

  // Otherwise, return status
  return NextResponse.json({
    status: 'ready',
    message: 'eBay Marketplace Account Deletion endpoint is configured'
  });
}

// Handle POST requests (for challenge validation and deletion notifications)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a challenge request from eBay
    if ('challengeCode' in body) {
      return handleChallenge(body as ChallengeRequest);
    }

    // Handle actual deletion notification
    return handleDeletionNotification(body as DeletionNotification);
  } catch (error) {
    console.error('Error processing eBay notification:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}

function handleChallenge(challenge: ChallengeRequest, endpointUrl?: string): NextResponse {
  const { challengeCode } = challenge;

  // Use the actual endpoint URL from the request, or fall back to env variable
  const actualEndpoint = endpointUrl || ENDPOINT_URL;

  // Create hash: SHA256(challengeCode + verificationToken + endpoint)
  // Using eBay's recommended method: update() called separately for each component
  const hash = crypto.createHash('sha256');
  hash.update(challengeCode);
  hash.update(VERIFICATION_TOKEN);
  hash.update(actualEndpoint);
  const challengeResponse = hash.digest('hex');

  console.log('eBay Challenge received:', {
    challengeCode,
    verificationToken: VERIFICATION_TOKEN,
    endpoint: actualEndpoint,
    endpointFromEnv: ENDPOINT_URL,
    response: challengeResponse
  });

  return NextResponse.json(
    { challengeResponse },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

async function handleDeletionNotification(notification: DeletionNotification): Promise<NextResponse> {
  const { username, userId, eiasToken } = notification;

  console.log('eBay Account Deletion Notification received:', {
    username,
    userId,
    eiasToken,
    timestamp: new Date().toISOString()
  });

  // TODO: Implement actual user data deletion logic here
  // This should:
  // 1. Verify the notification authenticity (optional but recommended)
  // 2. Identify the user in your system
  // 3. Delete or anonymize all user data
  // 4. Log the deletion for compliance purposes

  // For now, just log the notification
  // You should implement proper data deletion based on your data model

  // Acknowledge receipt immediately (required by eBay)
  return NextResponse.json(
    {
      status: 'accepted',
      message: 'Account deletion notification received and queued for processing'
    },
    { status: 200 }
  );
}
