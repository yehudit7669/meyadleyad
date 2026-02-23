import { useEffect, useCallback } from 'react';
import { getImageUrl } from '../utils/imageUrl';

interface ImageLightboxProps {
  images: Array<{ url: string; id?: string }>;
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function ImageLightbox({ images, currentIndex, onClose, onNavigate }: ImageLightboxProps) {
  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToNext(); // In RTL, left arrow goes to next
      } else if (e.key === 'ArrowRight') {
        goToPrevious(); // In RTL, right arrow goes to previous
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToPrevious, goToNext]);

  if (images.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[100]"
      onClick={onClose}
      dir="rtl"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-white hover:text-gray-300 text-4xl leading-none z-10 w-12 h-12 flex items-center justify-center"
        aria-label="סגור"
      >
        ×
      </button>

      {/* Image counter */}
      <div className="absolute top-6 right-6 text-white text-lg font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-lg">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          {/* Previous button (right side in RTL) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all z-10"
            aria-label="תמונה קודמת"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next button (left side in RTL) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all z-10"
            aria-label="תמונה הבאה"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Main image */}
      <div 
        className="relative w-full max-w-5xl mx-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={getImageUrl(images[currentIndex].url)}
          alt={`תמונה ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>

      {/* Thumbnail strip at bottom (optional, for quick navigation) */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-3 rounded-lg max-w-[90vw] overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(index);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                index === currentIndex
                  ? 'ring-2 ring-[#C9A24D] opacity-100'
                  : 'opacity-50 hover:opacity-100'
              }`}
            >
              <img
                src={getImageUrl(image.url)}
                alt={`תמונה ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
