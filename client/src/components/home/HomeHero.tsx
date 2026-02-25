import React from 'react';

const HomeHero: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-20" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Right side: Headline + Search */}
          <div className="order-1 lg:order-1 text-center lg:text-right">
            <h1 className="mb-6 leading-tight" style={{ color: '#3f504f', fontFamily: 'Assistant, sans-serif', fontSize: '75px' }}>
              למצוא את<br />הנדל״ן שלך
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
                <div className="relative flex items-center bg-[#f8f3f2] rounded-full overflow-hidden transition-colors pl-3">
                  <input
                    type="text"
                    placeholder="חפש לפי עיר, רחוב או מאפיינים..."
                    className="flex-1 px-6 py-4 text-lg outline-none bg-transparent"
                    style={{ color: '#3f504f' }}
                  />
                  <button
                    type="submit"
                    className="px-8 py-3 text-white font-medium transition-colors flex items-center gap-2 rounded-full"
                    style={{ backgroundColor: '#c89b4c' }}
                    aria-label="חפש"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b88a3d'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c89b4c'}
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

          {/* Left side: Homepage Image */}
          <div className="order-2 lg:order-2">
            <div className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow max-w-md mx-auto">
              <img
                src="/images/homepage-image.jpg"
                alt="נדלן המקום"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
