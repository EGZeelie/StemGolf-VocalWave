import { CreatorProfile } from "../types";

// Types for Facebook Pixel
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  externalId?: string;
  clientIp?: string;
  userAgent?: string;
}

interface EventData {
  eventName: string;
  eventId: string; // Critical for deduplication
  eventSourceUrl: string;
  userData?: UserData;
  customData?: Record<string, any>;
}

/**
 * Generates a UUID to serve as the Event ID for deduplication.
 * This ID must be sent to both Browser Pixel and Server CAPI.
 */
const generateEventId = (): string => {
  return 'event-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
};

export const PixelService = {
  /**
   * Initialize the Pixel (Called in App.tsx)
   */
  init: () => {
    if (typeof window !== 'undefined' && !window.fbq) {
      console.warn("Facebook Pixel script not loaded in index.html");
    }
  },

  /**
   * The core function to track events via both channels.
   */
  track: async (eventName: string, customData: Record<string, any> = {}, userProfile?: CreatorProfile) => {
    const eventId = generateEventId();
    const currentUrl = window.location.href;

    // 1. Prepare User Data (if available in app state)
    // In a real app, you might pull this from a simpler auth context
    const userData: UserData = {
       userAgent: navigator.userAgent,
       // We can attempt to pull email/name if the user filled out settings, 
       // but typically this comes from a verified auth state or form input.
       // For this demo, we use the profile if available.
       firstName: userProfile?.name?.split(' ')[0],
       lastName: userProfile?.name?.split(' ').slice(1).join(' '),
    };

    // 2. Fire Browser Pixel (Client-Side)
    if (window.fbq) {
      window.fbq('track', eventName, customData, { eventID: eventId });
    }

    // 3. Fire Conversion API (Server-Side) via our Backend Proxy
    // We send the data to OUR backend, which then talks to Meta.
    // This keeps the Access Token secure.
    try {
      // Note: In a production React app, this URL points to your Node/Next.js API route
      const backendUrl = '/api/meta-conversion'; 
      
      // We check if we are in a dev environment without a real backend
      // In this specific demo, we'll log what would happen since we don't have a running Node server.
      console.log(`[Hybrid Track] Sending to Backend: ${eventName} (ID: ${eventId})`);
      
      // Uncomment below when backend route is active:
      /*
      await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          eventId,
          eventSourceUrl: currentUrl,
          userData,
          customData
        }),
      });
      */
    } catch (error) {
      console.error("Failed to send CAPI event", error);
    }
  },

  // --- Convenience Methods ---

  trackPageView: () => {
    PixelService.track('PageView');
  },

  trackLead: (source: string) => {
    PixelService.track('Lead', { content_name: source });
  },

  trackStudioUsage: (projectTitle: string, duration: number) => {
    PixelService.track('CustomizeProduct', { 
      content_name: projectTitle,
      status: 'generated_audio',
      value: duration, // Duration in seconds
      currency: 'ZAR' // purely illustrative
    });
  },

  trackPurchase: (amount: number, currency: string = 'ZAR') => {
    PixelService.track('Purchase', { value: amount, currency });
  }
};