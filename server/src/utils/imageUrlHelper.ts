/**
 * Image URL Helper
 * מנהל המרה של נתיבי תמונות לכתובות URL ציבוריות לפרוד/לוקאל
 */

import { config } from '../config';

/**
 * Convert any image path/URL to a full public URL
 * 
 * Examples:
 * - '/uploads/image.jpg' -> 'https://api.example.com/uploads/image.jpg'
 * - 'image.jpg' -> 'https://api.example.com/uploads/image.jpg'
 * - 'https://cdn.example.com/img.jpg' -> 'https://cdn.example.com/img.jpg' (unchanged)
 * 
 * @param imagePath - The image path (can be relative, absolute, or full URL)
 * @returns Full public URL to the image
 */
export function getPublicImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '';
  }

  // Already a full URL (http:// or https://)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // CRITICAL: Block localhost URLs in production
    if (process.env.NODE_ENV === 'production' && imagePath.includes('localhost')) {
      console.warn('⚠️  WARNING: localhost URL detected in production!', imagePath);
      // Try to extract filename and rebuild URL
      const filename = imagePath.split('/').pop();
      if (filename) {
        return `${config.appUrl}/uploads/${filename}`;
      }
      return '';
    }
    return imagePath;
  }

  // Absolute path starting with /uploads/
  if (imagePath.startsWith('/uploads/')) {
    return `${config.appUrl}${imagePath}`;
  }

  // Relative path starting with uploads/
  if (imagePath.startsWith('uploads/')) {
    return `${config.appUrl}/${imagePath}`;
  }

  // Just a filename
  return `${config.appUrl}/uploads/${imagePath}`;
}

/**
 * Get the API base URL (for frontend to construct image URLs)
 */
export function getApiBaseUrl(): string {
  return config.appUrl;
}

/**
 * Validate that an image URL is accessible (doesn't contain localhost in prod)
 */
export function validateImageUrl(imageUrl: string): boolean {
  if (!imageUrl) {
    return false;
  }

  // In production, reject localhost URLs
  if (process.env.NODE_ENV === 'production') {
    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
      console.error('❌ Invalid image URL in production (contains localhost):', imageUrl);
      return false;
    }
  }

  return true;
}

/**
 * Convert array of image paths to public URLs
 */
export function getPublicImageUrls(imagePaths: (string | null | undefined)[]): string[] {
  return imagePaths
    .filter((path): path is string => !!path)
    .map(getPublicImageUrl)
    .filter(url => validateImageUrl(url));
}
