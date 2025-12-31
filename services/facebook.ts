
/**
 * Service to interact with Facebook Graph API.
 * Used for posting content to Facebook Pages.
 */

const postToPage = async (
    pageId: string, 
    accessToken: string, 
    message: string, 
    link?: string
  ): Promise<{ success: boolean; postId?: string; error?: string }> => {
    
    if (!pageId || !accessToken) {
        return { success: false, error: "Missing Page ID or Access Token" };
    }

    try {
      // Construct URL parameters
      const params = new URLSearchParams({
        message: message,
        access_token: accessToken,
      });

      if (link) {
        params.append('link', link);
      }

      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed?${params.toString()}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        console.error("Facebook API Error:", data.error);
        return { success: false, error: data.error.message };
      }

      return { success: true, postId: data.id };

    } catch (error) {
      console.error("Network Error posting to Facebook:", error);
      return { success: false, error: "Network error occurred." };
    }
};

export const FacebookService = {
  /**
   * Posts a status update (link + message) to a Facebook Page.
   * Requires 'pages_manage_posts' and 'pages_read_engagement' permissions on the token.
   */
  postBlogToPage: postToPage,

  /**
   * Generic update poster for Podcasts (releases/scheduling).
   */
  postUpdate: postToPage
};
