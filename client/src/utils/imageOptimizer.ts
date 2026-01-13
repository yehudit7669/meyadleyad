// Image Optimization Utilities
export class ImageOptimizer {
  // Compress image before upload
  static async compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  // Generate thumbnail
  static async generateThumbnail(file: File, size = 300): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext('2d');
          
          // Calculate crop
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx?.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  // Get optimized URL with CDN parameters
  static getCDNUrl(url: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }): string {
    if (!url) return url;

    // If using Cloudinary or similar CDN
    const params: string[] = [];
    
    if (options?.width) params.push(`w_${options.width}`);
    if (options?.height) params.push(`h_${options.height}`);
    if (options?.quality) params.push(`q_${options.quality}`);
    if (options?.format) params.push(`f_${options.format}`);

    // Example for Cloudinary:
    // return url.replace('/upload/', `/upload/${params.join(',')}/`);
    
    // For now, return original URL
    return url;
  }

  // Lazy load image
  static lazyLoadImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Convert to WebP if supported
  static isWebPSupported(): boolean {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Get responsive image srcset
  static getResponsiveSrcSet(url: string, widths: number[] = [320, 640, 1024, 1920]): string {
    return widths
      .map((width) => `${this.getCDNUrl(url, { width })} ${width}w`)
      .join(', ');
  }
}

// Helper hook for lazy loading images
export function useLazyImage(src: string) {
  const [imageSrc, setImageSrc] = React.useState<string>();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    ImageOptimizer.lazyLoadImage(src)
      .then((loadedSrc) => {
        setImageSrc(loadedSrc);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [src]);

  return { imageSrc, loading };
}

import React from 'react';
