/**
 * Image URL Builder - Client Side
 * בונה URLs ציבוריים לתמונות וקבצים מהשרת
 */

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

if (!API_BASE && import.meta.env.PROD) {
  console.error('❌ VITE_API_URL is not configured!');
}

/**
 * Convert image path to full public URL
 * @param imagePath - Relative path or full URL
 * @returns Full public URL
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '';
  }

  // Already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Relative path starting with /
  if (imagePath.startsWith('/')) {
    return `${API_BASE}${imagePath}`;
  }

  // No leading slash
  return `${API_BASE}/${imagePath}`;
}

/**
 * Get API base URL (without /api suffix)
 */
export function getApiBase(): string {
  return API_BASE;
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
  console.log('🔧 API Configuration:');
  console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('  API_BASE:', API_BASE);
  console.log('  MODE:', import.meta.env.MODE);
  console.log('  PROD:', import.meta.env.PROD);
}
