/**
 * Environment Configuration
 * Single source of truth for all environment-dependent URLs
 */

/**
 * Get the API base URL for all backend requests
 * 
 * PRODUCTION: Requires VITE_API_URL to be set, throws error if missing
 * DEVELOPMENT: Uses VITE_API_URL if set, otherwise defaults to localhost:5000/api
 * 
 * IMPORTANT: Always returns URL ending with /api (no trailing slash after /api)
 * 
 * @returns Normalized API base URL ending with /api (e.g., https://example.com/api)
 * @throws Error if VITE_API_URL is not set in production
 */
export function getApiBaseUrl(): string {
  const viteApiUrl = import.meta.env.VITE_API_URL;
  const isProd = import.meta.env.PROD;

  // PRODUCTION: Strict validation - must have VITE_API_URL
  if (isProd) {
    if (!viteApiUrl) {
      throw new Error(
        'CRITICAL: VITE_API_URL environment variable is required in production but is not defined. ' +
        'All API requests will fail. Please configure VITE_API_URL in your deployment settings.'
      );
    }
    // Normalize and ensure /api suffix
    return ensureApiSuffix(viteApiUrl);
  }

  // DEVELOPMENT: Use env if available, otherwise default to localhost
  const baseUrl = viteApiUrl || 'http://localhost:5000/api';
  
  // Normalize and ensure /api suffix
  return ensureApiSuffix(baseUrl);
}

/**
 * Ensure URL ends with /api (no trailing slash)
 * @param url - URL to normalize
 * @returns URL ending with /api
 */
function ensureApiSuffix(url: string): string {
  // Remove trailing slashes
  const normalized = url.replace(/\/+$/, '');
  
  // If already ends with /api, return it
  if (normalized.endsWith('/api')) {
    return normalized;
  }
  
  // Add /api suffix
  return `${normalized}/api`;
}

/**
 * Get the backend origin (without /api suffix)
 * Useful for constructing public asset URLs (images, uploads)
 * 
 * @returns Backend origin URL (e.g., https://example.onrender.com)
 */
export function getBackendOrigin(): string {
  const apiBaseUrl = getApiBaseUrl();
  
  // Remove /api suffix if present (only at the end)
  return apiBaseUrl.replace(/\/api\/?$/, '');
}

/**
 * Validate that a URL is not pointing to the frontend domain
 * Prevents accidental requests to Vercel when backend is expected
 * 
 * @param url - URL to validate
 * @returns true if URL is safe (points to backend or is relative)
 */
export function isValidBackendUrl(url: string): boolean {
  // Relative URLs are fine (will use baseURL from axios)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return true;
  }
  
  // Absolute URLs should NOT point to vercel.app
  if (url.includes('vercel.app')) {
    return false;
  }
  
  return true;
}
