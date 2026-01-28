import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAds } from '../../hooks/useAds';
import AdCardCompact from './AdCardCompact';

interface CategorySliderProps {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
}

const CategorySlider: React.FC<CategorySliderProps> = ({
  categoryId,
  categorySlug,
  categoryName,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch ads for this category (limit to 12)
  const { data, isLoading } = useAds({
    categoryId,
    limit: 12,
  });

  const ads = data?.ads || [];

  // Scroll functions
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === 'right' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  // Don't render if no ads
  if (!isLoading && ads.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 bg-gray-50 w-full py-6" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {categoryName}
          </h2>
          <Link
            to={`/category/${categorySlug}`}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
          >
            לכל המודעות
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        </div>

      {/* Slider Container */}
      <div className="relative group">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
          aria-label="גלול שמאלה"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
          aria-label="גלול ימינה"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Cards Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[180px] md:min-w-[200px] bg-gray-200 rounded-lg animate-pulse"
                style={{ height: '240px' }}
              />
            ))
          ) : (
            ads.map((ad: any) => (
              <div key={ad.id} className="min-w-[180px] md:min-w-[200px]">
                <AdCardCompact ad={ad} />
              </div>
            ))
          )}
        </div>
      </div>
      </div>

      {/* CSS to hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CategorySlider;
