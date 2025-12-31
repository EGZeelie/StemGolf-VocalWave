
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

/**
 * Generates a UUID to serve as the Event ID for deduplication.
 * This ID must be sent to both Browser Pixel and Server CAPI.
 */
const generateEventId = (): string => {
  return 'event-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
};

export const PixelService = {
  /**
   * Initialize the Pixel with a specific ID.
   * Injects the script if not already present.
   */
  init: (pixelId?: string) => {
    if (!pixelId) return;

    if (window.fbq) {
      // Already initialized, just update init if needed or log
      // Ideally, fbq('init', pixelId) can be called multiple times for multiple pixels
      window.fbq('init', pixelId);
      return;
    }

    // Inject Pixel Script
    /* eslint-disable */
    (function(f:any,b:any,e:any,v:any,n?:any,t?:any,s?:any)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)})(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', pixelId);
  },

  /**
   * The core function to track events via both channels.
   */
  track: async (eventName: string, customData: Record<string, any> = {}, userProfile?: CreatorProfile) => {
    // If no pixel is initialized (window.fbq undefined), this will just be ignored safely usually,
    // or we check existence.
    if (!window.fbq) return;

    const eventId = generateEventId();
    
    // 1. Prepare User Data (if available in app state)
    const userData: UserData = {
       userAgent: navigator.userAgent,
       firstName: userProfile?.name?.split(' ')[0],
       lastName: userProfile?.name?.split(' ').slice(1).join(' '),
    };

    // 2. Fire Browser Pixel (Client-Side)
    window.fbq('track', eventName, customData, { eventID: eventId });

    // 3. Fire Conversion API (Server-Side)
    // (Mocked for this client-side demo)
    if (process.env.NODE_ENV === 'development') {
       console.log(`[Pixel] Tracked ${eventName}`, customData);
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
      currency: 'ZAR' 
    });
  },

  trackPurchase: (amount: number, currency: string = 'ZAR') => {
    PixelService.track('Purchase', { value: amount, currency });
  }
};