interface EbayProduct {
  itemId: string;
  title: string;
  image: string;
  price: string;
  currency: string;
  itemAffiliateWebUrl: string;
}

interface EbaySearchResponse {
  itemSummaries?: Array<{
    itemId: string;
    title: string;
    image: { imageUrl: string };
    price: { value: string; currency: string };
    itemWebUrl: string;
    itemAffiliateWebUrl?: string;
  }>;
}

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const appId = process.env.EBAY_APP_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!appId || !clientSecret) {
    throw new Error("eBay API credentials not configured");
  }

  // Detect if using sandbox credentials
  const isSandbox = appId.includes('-SBX-') || clientSecret.startsWith('SBX-');
  const authUrl = isSandbox
    ? "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
    : "https://api.ebay.com/identity/v1/oauth2/token";
  const scope = isSandbox
    ? "https://api.ebay.com/oauth/api_scope"
    : "https://api.ebay.com/oauth/api_scope";

  const credentials = Buffer.from(`${appId}:${clientSecret}`).toString("base64");

  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: `grant_type=client_credentials&scope=${scope}`,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('eBay auth error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      appIdPresent: !!appId,
      secretPresent: !!clientSecret,
      isSandbox,
      authUrl
    });
    throw new Error(`eBay authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;

  if (!accessToken) {
    throw new Error("Failed to obtain eBay access token");
  }

  // Set expiry to 5 minutes before actual expiry for safety
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

  return accessToken;
}

export async function searchSoccerCards(
  query: string = "soccer cards",
  limit: number = 5
): Promise<EbayProduct[]> {
  const token = await getAccessToken();
  const campaignId = process.env.EBAY_CAMPAIGN_ID;
  const appId = process.env.EBAY_APP_ID;

  if (!campaignId) {
    throw new Error("eBay Campaign ID not configured");
  }

  // Detect if using sandbox credentials
  const isSandbox = appId?.includes('-SBX-') || false;
  const apiBaseUrl = isSandbox
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com";

  // Build search URL with filters for soccer cards
  const searchParams = new URLSearchParams({
    q: query,
    category_ids: "212", // Sports Trading Cards category
    limit: limit.toString(),
    sort: "newlyListed", // Show newest listings
    filter: "buyingOptions:{FIXED_PRICE}",
  });

  const response = await fetch(
    `${apiBaseUrl}/buy/browse/v1/item_summary/search?${searchParams}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        "X-EBAY-C-ENDUSERCTX": `affiliateCampaignId=${campaignId}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`eBay search failed: ${response.statusText}`);
  }

  const data: EbaySearchResponse = await response.json();

  if (!data.itemSummaries || data.itemSummaries.length === 0) {
    return [];
  }

  return data.itemSummaries.map((item) => ({
    itemId: item.itemId,
    title: item.title,
    image: item.image?.imageUrl || "",
    price: item.price?.value || "0",
    currency: item.price?.currency || "USD",
    itemAffiliateWebUrl: item.itemAffiliateWebUrl || item.itemWebUrl,
  }));
}
