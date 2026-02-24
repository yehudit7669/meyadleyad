import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesService, adsService } from '../services/api';
import AdCardCompact from '../components/home/AdCardCompact';
import PropertiesMap from '../components/PropertiesMap';
import { useRef, useState, useEffect } from 'react';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const propertyRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Get cities from URL params
  const citiesParam = searchParams.get('cities');
  const selectedCities = citiesParam ? citiesParam.split(',') : [];
  
  // Pagination state - 3 cards per row × 15 rows = 45 ads per page
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 45;

  const { data: category, isLoading: loadingCategory } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesService.getCategoryBySlug(slug!),
    enabled: !!slug,
  });

  const { data: adsData, isLoading: loadingAds } = useQuery({
    queryKey: ['category-ads', category?.id, selectedCities],
    queryFn: () => {
      const params: any = { categoryId: category!.id };
      
      // Add city filter if cities are selected
      if (selectedCities.length > 0) {
        params.cities = selectedCities.join(',');
      }
      
      return adsService.getAds(params);
    },
    enabled: !!category?.id,
  });

  // Reset to page 1 when category or cities change
  useEffect(() => {
    setCurrentPage(1);
  }, [category?.id, selectedCities.join(',')]);

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

  const ads = adsData?.ads || [];

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
    setSelectedPropertyId(propertyId);
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

  // Handle city click from map - filter by city
  const handleCityClick = (cityName: string) => {
    // Navigate with city filter
    const newCities = selectedCities.includes(cityName)
      ? selectedCities // Already selected
      : [...selectedCities, cityName]; // Add to selection
    
    const citiesQuery = newCities.join(',');
    navigate(`/category/${slug}?cities=${encodeURIComponent(citiesQuery)}`);
  };

  return (
    <div className="min-h-screen bg-white py-8" dir="rtl">
      <div className="container mx-auto px-4">
        {/* כותרת קטגוריה */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link to="/" className="hover:text-blue-600">
              דף הבית
            </Link>
            <span className="mx-2">/</span>
            <span>{category.nameHe}</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-6xl">{category.icon || '📁'}</div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{category.nameHe}</h1>
              {category.descriptionHe && (
                <p className="text-gray-600 text-lg">{category.descriptionHe}</p>
              )}
              <div className="mt-3 text-sm text-gray-500">
                {ads.length} מודעות בקטגוריה זו
                {totalPages > 1 && ` (מציג ${startIndex + 1}-${Math.min(endIndex, ads.length)} מתוך ${ads.length})`}
                {selectedCities.length > 0 && (
                  <span className="mr-2 text-[#C9A24D] font-semibold">
                    (מסונן לפי {selectedCities.length} ערים)
                  </span>
                )}
              </div>
              {selectedCities.length > 0 && (
                <div className="mt-2">
                  <Link
                    to={`/category/${slug}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    הצג את כל הנכסים בקטגוריה ←
                  </Link>
                </div>
              )}
            </div>
          </div>
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
                    selectedPropertyId={selectedPropertyId || undefined}
                    onCityClick={handleCityClick}
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
