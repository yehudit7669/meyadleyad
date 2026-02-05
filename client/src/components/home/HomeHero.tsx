import React from 'react';

const HomeHero: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-20" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Right side: Headline + Search */}
          <div className="order-1 lg:order-1 text-center lg:text-right">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: '#1F3F3A' }}>
              למצוא את הנדל״ן שלך
            </h1>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto lg:mx-0">
              <form className="relative" onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input');
                if (input?.value.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(input.value.trim())}`;
                }
              }}>
                <div className="relative flex items-center bg-gray-50 rounded-full shadow-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors pl-3">
                  <input
                    type="text"
                    placeholder="חפש לפי עיר, רחוב או מאפיינים..."
                    className="flex-1 px-6 py-4 text-lg outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    className="px-8 py-3 text-white font-medium transition-colors flex items-center gap-2 rounded-full"
                    style={{ backgroundColor: '#C9A24D' }}
                    aria-label="חפש"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B08C3C'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C9A24D'}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <span className="hidden sm:inline">חפש</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Left side: Two Images */}
          <div className="order-2 lg:order-2 grid grid-cols-2 gap-4">
            {/* Image 1 */}
            <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <img
                src="/hero-image-1.jpg"
                alt="נדלן מקומי"
                className="w-full h-64 md:h-80 object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  // Fallback to gradient if image not found
                  const target = e.currentTarget;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7XoNeTXZzXnCfXnyDXldeo15XXqzwvdGV4dD48L3N2Zz4=';
                }}
              />
            </div>

            {/* Image 2 */}
            <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <img
                src="/hero-image-2.jpg"
                alt="נדלן מקומי"
                className="w-full h-64 md:h-80 object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  // Fallback to gradient if image not found
                  const target = e.currentTarget;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7XoNeTXZzXnCfXnyDXldeo15XXqzwvdGV4dD48L3N2Zz4=';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
