declare global {
  interface Window {
    $memberstackDom: any;
  }
}

export interface MemberstackMember {
  id: string;
  auth: {
    email: string;
  };
  customFields: {
    "name"?: string;
    "bio"?: string;
    "website"?: string;
    "spotify-link"?: string;
    "apple-link"?: string;
    [key: string]: any;
  };
  planConnections: any[];
}

export enum AuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  SPOTIFY = 'spotify'
}

/**
 * Attempts to retrieve the current logged-in member from Memberstack.
 * Includes a small polling mechanism to wait for the script to load.
 */
export const getCurrentMember = async (): Promise<MemberstackMember | null> => {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 20; // 2 seconds approx

    const check = () => {
      if (window.$memberstackDom) {
        window.$memberstackDom.getCurrentMember()
          .then(({ data }: { data: MemberstackMember | null }) => {
            resolve(data);
          })
          .catch((err: any) => {
            console.warn("Memberstack error:", err);
            resolve(null);
          });
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 100);
        } else {
          console.warn("Memberstack script not loaded.");
          resolve(null);
        }
      }
    };

    check();
  });
};

export const logout = async () => {
  if (window.$memberstackDom) {
    await window.$memberstackDom.logout();
    window.location.reload();
  }
};

export const openModal = (type: 'LOGIN' | 'SIGNUP' | 'PROFILE') => {
    if (window.$memberstackDom) {
        window.$memberstackDom.openModal(type);
    }
}

/**
 * Trigger a social login for a specific provider.
 * Note: Providers must be enabled in the Memberstack dashboard.
 */
export const loginWithProvider = async (provider: AuthProvider) => {
  if (!window.$memberstackDom) return;
  
  // Memberstack V2 uses specific paths or modal triggers for social auth.
  // Standard implementation usually redirects to a provider URL constructed by Memberstack
  // or opens the modal with a specific configuration.
  
  // For standard modal opening with social buttons visible:
  try {
     await window.$memberstackDom.openModal('LOGIN', {
         signup: false
     });
     // Note: Direct programmatic provider triggering isn't always exposed in the DOM API V2 
     // without custom buttons mapped to data attributes, but opening the modal 
     // allows the user to click the configured social buttons.
  } catch (error) {
      console.error("Login error", error);
  }
};
