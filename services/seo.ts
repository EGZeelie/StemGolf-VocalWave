
import { SeoSettings } from "../types";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const SEOService = {
  /**
   * Updates the document head with the user's SEO settings.
   */
  updateTags: (settings?: SeoSettings) => {
    if (!settings) return;

    // 1. Google Site Verification (Search Console)
    SEOService.setMetaTag('google-site-verification', settings.googleSiteVerification);

    // 2. Google Analytics 4
    SEOService.injectGA4(settings.googleAnalyticsId);
  },

  /**
   * Sets or creates a meta tag in the head.
   */
  setMetaTag: (name: string, content?: string) => {
    let meta = document.querySelector(`meta[name="${name}"]`);
    
    if (content) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    } else {
      // If content is empty/undefined, remove the tag if it exists
      if (meta) {
        document.head.removeChild(meta);
      }
    }
  },

  /**
   * Injects the GA4 script if it doesn't exist, or updates configuration.
   */
  injectGA4: (measurementId?: string) => {
    // If no ID provided, do nothing (we don't strictly remove the script as it might be used by the platform)
    if (!measurementId) return;

    // Check if script already exists
    const scriptId = 'ga4-script-user';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.setAttribute('async', '');
      script.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
      document.head.appendChild(script);

      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', measurementId);
    } else {
      // If script exists, just push config
      if (typeof window.gtag === 'function') {
        window.gtag('config', measurementId);
      }
    }
  }
};
