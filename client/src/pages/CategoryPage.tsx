import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesService, adsService } from '../services/api';
import AdCardCompact from '../components/home/AdCardCompact';
import PropertiesMap from '../components/PropertiesMap';
import PropertyFilters, { FilterValues } from '../components/filters/PropertyFilters';
import { useRef, useState, useEffect } from 'react';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const propertyRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterValues>({
    propertyTypes: [],
    priceRange: [0, 20000000],
  });
  
  // Pagination state - 3 cards per row × 15 rows = 45 ads per page
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 45;

  const { data: category, isLoading: loadingCategory } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesService.getCategoryBySlug(slug!),
    enabled: !!slug,
  });

  const { data: adsData, isLoading: loadingAds } = useQuery({
    queryKey: ['category-ads', category?.id],
    queryFn: () => {
      const params: any = { categoryId: category!.id };
      return adsService.getAds(params);
    },
    enabled: !!category?.id,
  });

  // Client-side filtering
  const filteredAds = (adsData?.ads || []).filter((ad: any) => {
    // City filter
    if (filters.cityId && ad.cityId !== filters.cityId) {
      return false;
    }

    // Address search filter (city, neighborhood, street, address)
    if (filters.addressSearch) {
      const searchLower = filters.addressSearch.toLowerCase();
      const cityName = ad.city?.nameHe?.toLowerCase() || '';
      const neighborhood = (ad.neighborhood || '').toLowerCase();
      const street = ad.Street?.name?.toLowerCase() || '';
      const address = (ad.address || '').toLowerCase();
      
      if (!cityName.includes(searchLower) && 
          !neighborhood.includes(searchLower) && 
          !street.includes(searchLower) &&
          !address.includes(searchLower)) {
        return false;
      }
    }

    // Price filter
    if (ad.price !== null && ad.price !== undefined) {
      if (ad.price < filters.priceRange[0] || ad.price > filters.priceRange[1]) {
        return false;
      }
    }

    // Property type filter
    if (filters.propertyTypes.length > 0) {
      const adPropertyType = ad.customFields?.propertyType;
      if (!adPropertyType || !filters.propertyTypes.includes(adPropertyType)) {
        return false;
      }
    }

    // Rooms filter
    if (filters.rooms !== undefined) {
      const adRooms = ad.customFields?.rooms;
      if (adRooms !== filters.rooms) {
        return false;
      }
    }

    return true;
  });

  const ads = filteredAds;

  // Reset to page 1 when category or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category?.id, JSON.stringify(filters)]);

  if (loadingCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">הקטגוריה לא נמצאה</h2>
          <Link to="/" className="text-blue-600 hover:underline">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(ads.length / adsPerPage);
  const startIndex = (currentPage - 1) * adsPerPage;
  const endIndex = startIndex + adsPerPage;
  const currentAds = ads.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll the properties container to top instead of the whole page
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle marker click - scroll to property
  const handleMarkerClick = (propertyId: string) => {
    const element = propertyRefs.current[propertyId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight effect
      element.classList.add('ring-2', 'ring-[#C9A24D]');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-[#C9A24D]');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8" dir="rtl">
      <div className="container mx-auto px-4">
        {/* ניווט breadcrumb קטן */}
        <nav className="text-sm text-gray-600 mb-4">
          <Link to="/" className="hover:text-blue-600">
            דף הבית
          </Link>
          <span className="mx-2">/</span>
          <span>{category.nameHe}</span>
        </nav>

        {/* סינונים */}
        <PropertyFilters
          onFilterChange={(newFilters) => setFilters(newFilters)}
          initialFilters={filters}
        />

        {/* מידע על מספר התוצאות */}
        <div className="mb-4 text-sm text-gray-600">
          {ads.length} נכסים
          {totalPages > 1 && ` (מציג ${startIndex + 1}-${Math.min(endIndex, ads.length)} מתוך ${ads.length})`}
        </div>

        {/* תוכן */}
        {loadingAds ? (
          <div className="text-center py-12">טוען מודעות...</div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">אין מודעות בקטגוריה זו</h2>
            <p className="text-gray-600 mb-6">היה הראשון לפרסם!</p>
            <Link
              to="/ads/new"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              פרסם מודעה חדשה
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* רשימת נכסים - צד שמאל - 3 כרטיסים של 200px בדיוק */}
              <div className="flex-1 lg:order-1">
                <div 
                  ref={scrollContainerRef}
                  className="lg:h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-2 scrollbar-hide"
                >
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 200px))' }}>
                    {currentAds.map((ad: any) => (
                      <div 
                        key={ad.id}
                        ref={(el) => { propertyRefs.current[ad.id] = el; }}
                        className="transition-all duration-300"
                        style={{ width: '200px' }}
                      >
                        <AdCardCompact ad={ad} />
                      </div>
                    ))}
                  </div>

                  {/* Pagination בתוך אזור הגלילה */}
                  {totalPages > 1 && (
                    <div className="mt-8 pt-6 pb-4 flex justify-center items-center gap-2" dir="ltr">
                      {/* Previous Button */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                        aria-label="עמוד קודם"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage =
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2);

                        if (!showPage) {
                          // Show ellipsis
                          if (page === currentPage - 3 || page === currentPage + 3) {
                            return (
                              <span key={page} className="px-2 text-gray-400">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 rounded-lg min-w-[40px] ${
                              currentPage === page
                                ? 'bg-[#C9A24D] text-white font-bold'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      {/* Next Button */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === totalPages
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                        aria-label="עמוד הבא"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* מפה - צד ימין */}
              <div className="w-full lg:w-[500px] lg:order-2">
                <div className="sticky top-4 h-[400px] lg:h-[calc(100vh-200px)] rounded-lg shadow-lg overflow-hidden">
                  <PropertiesMap 
                    properties={currentAds}
                    onMarkerClick={handleMarkerClick}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* CSS to hide scrollbar */}
        <style>{`
          .scrollbar-hide {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
}
