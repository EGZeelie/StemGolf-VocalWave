// This file is designed to run in a Node.js environment (e.g., Express, Vercel Function, AWS Lambda).
// You would import this handler in your actual API route file.

import crypto from 'crypto';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PIXEL_ID = process.env.META_PIXEL_ID;

// Helper: Normalize and Hash Data (SHA-256) per Meta requirements
const hashData = (data: string | undefined): string | undefined => {
  if (!data) return undefined;
  const normalized = data.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

const isBot = (userAgent: string): boolean => {
  const botPatterns = [
    'bot', 'crawl', 'spider', 'mediapartners', 'apis-google', 'slurp', 'facebookexternalhit'
  ];
  const lowerUA = userAgent.toLowerCase();
  return botPatterns.some(pattern => lowerUA.includes(pattern));
};

interface CapiRequestBody {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    externalId?: string;
    clientIp?: string; // Should be passed from request headers
    userAgent?: string;
  };
  customData?: Record<string, any>;
}

/**
 * THE BACKEND FUNCTION
 * Call this from your API route handler.
 */
export const handleMetaEvent = async (body: CapiRequestBody, reqIp: string) => {
  if (!META_ACCESS_TOKEN || !META_PIXEL_ID) {
    console.error("Meta CAPI configuration missing.");
    return { success: false, error: "Configuration Missing" };
  }

  // 1. Bot Filtering
  // We check the User Agent passed in the body or the request
  const userAgent = body.userData?.userAgent || '';
  if (isBot(userAgent)) {
    console.log(`[Meta CAPI] Bot detected, ignoring event: ${userAgent}`);
    return { success: true, status: 'ignored_bot' };
  }

  // 2. Data Enrichment & Hashing
  const userDataPayload = {
    em: hashData(body.userData.email),
    ph: hashData(body.userData.phone),
    fn: hashData(body.userData.firstName),
    ln: hashData(body.userData.lastName),
    ct: hashData(body.userData.city),
    st: hashData(body.userData.state),
    zp: hashData(body.userData.zip),
    country: hashData(body.userData.country),
    external_id: hashData(body.userData.externalId),
    client_ip_address: reqIp || body.userData.clientIp,
    client_user_agent: userAgent,
    // fbp and fbc cookies should also be extracted from req.cookies if available
  };

  // 3. Construct Meta Payload
  const currentTimestamp = Math.floor(Date.now() / 1000);

  const payload = {
    data: [
      {
        event_name: body.eventName,
        event_time: currentTimestamp,
        action_source: "website",
        event_source_url: body.eventSourceUrl,
        event_id: body.eventId, // CRITICAL: Must match the browser pixel's eventID
        user_data: userDataPayload,
        custom_data: body.customData,
      },
    ],
    // "test_event_code": "TEST12345" // Uncomment when testing in Events Manager
  };

  // 4. Send to Meta Graph API
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("[Meta CAPI] Error:", data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data };

  } catch (error) {
    console.error("[Meta CAPI] Network Error:", error);
    return { success: false, error: "Network Error" };
  }
};