/**
 * Image URL Builder - Client Side
 * בונה URLs ציבוריים לתמונות וקבצים מהשרת
 */

import { getBackendOrigin } from '../config/env';

// Get backend origin (without /api suffix) for image URLs
const BACKEND_ORIGIN = getBackendOrigin();

/**
 * Convert image path to full public URL
 * @param imagePath - Relative path or full URL
 * @returns Full public URL pointing to backend server
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '';
  }

  // Already a full URL - return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Relative path starting with /
  if (imagePath.startsWith('/')) {
    return `${BACKEND_ORIGIN}${imagePath}`;
  }

  // No leading slash - add one
  return `${BACKEND_ORIGIN}/${imagePath}`;
}

/**
 * Get backend origin for building custom URLs
 */
export function getApiBase(): string {
  return BACKEND_ORIGIN;
}

/**
 * Build full URL for file download
 */
export function getFileUrl(filePath: string): string {
  return getImageUrl(filePath);
}

/**
 * Log current configuration (for debugging)
 */
export function logApiConfig(): void {
  console.log('�️  Image URL Configuration:', {
    backendOrigin: BACKEND_ORIGIN,
    mode: import.meta.env.MODE,
    isProd: import.meta.env.PROD,
  });
}
