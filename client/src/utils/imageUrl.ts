/**
 * Image URL utilities
 * מטפל בבניית URL מלא לתמונות
 */

/**
 * Get the base URL for the API server
 * מחזיר את ה-base URL של השרת
 */
export function getBaseUrl(): string {
  // In production (when window.location is available), use the current origin
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  
  // Otherwise, use VITE_API_URL or fallback to localhost
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace('/api', '');
  }
  
  return 'http://localhost:5000';
}

/**
 * Build full image URL from relative path
 * בונה URL מלא לתמונה מנתיב יחסי
 * @param relativePath - Relative path like "/uploads/image.jpg"
 */
export function getImageUrl(relativePath: string | null | undefined): string {
  if (!relativePath) {
    return '/images/placeholder.jpg';
  }
  
  // If it's already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Build full URL
  const baseUrl = getBaseUrl();
  return `${baseUrl}${relativePath}`;
}
