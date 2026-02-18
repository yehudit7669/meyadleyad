import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adsService, searchService } from '../services/api';
import { useState, useEffect } from 'react';
import AdCardCompact from '../components/home/AdCardCompact';
import FiltersSidebar from '../components/FiltersSidebar';
import Pagination from '../components/Pagination';
import { GridSkeleton } from '../components/LoadingSkeletons';
import SearchAutocomplete from '../components/SearchAutocomplete';
import GeolocationSearch from '../components/GeolocationSearch';
import { useAnalytics } from '../utils/analytics';
import SEO from '../components/SEO';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const { trackSearch } = useAnalytics();
  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    categoryId: searchParams.get('category') || '',
    cityId: searchParams.get('city') || '',
    street: searchParams.get('street') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    lat: searchParams.get('lat') || '',
    lng: searchParams.get('lng') || '',
    radius: searchParams.get('radius') || '10',
  });

  const { data: adsData, isLoading } = useQuery({
    queryKey: ['ads', Object.fromEntries(searchParams), currentPage],
    queryFn: async () => {
      // Use geolocation search if coordinates provided
      if (filters.lat && filters.lng) {
        return searchService.searchNearby(
          parseFloat(filters.lat),
          parseFloat(filters.lng),
          parseInt(filters.radius) || 10
        );
      }

      // Otherwise use standard search
      const searchQuery = searchParams.get('q') || searchParams.get('street') || undefined;
      
      return adsService.getAds({
        search: searchQuery,
        categoryId: searchParams.get('category') || undefined,
        cityId: searchParams.get('city') || undefined,
        minPrice: searchParams.get('minPrice') || undefined,
        maxPrice: searchParams.get('maxPrice') || undefined,
        page: currentPage,
      });
    },
  });

  // Track search
  useEffect(() => {
    if (filters.search && adsData?.ads) {
      trackSearch(filters.search, adsData.pagination?.total || adsData.ads.length);
    }
  }, [filters.search, adsData, trackSearch]);

  const handleLocationFound = (coords: { lat: number; lng: number }) => {
    setFilters((prev) => ({
      ...prev,
      lat: coords.lat.toString(),
      lng: coords.lng.toString(),
    }));
    setSearchParams({
      lat: coords.lat.toString(),
      lng: coords.lng.toString(),
      radius: '10',
    });
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (filters.search) params.q = filters.search;
    if (filters.street) params.street = filters.street;
    if (filters.categoryId) params.category = filters.categoryId;
    if (filters.cityId) params.city = filters.cityId;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    setSearchParams(params);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters({
      street: '',
      search: '',
      categoryId: '',
      cityId: '',
      minPrice: '',
      maxPrice: '',
      lat: '',
      lng: '',
      radius: '10',
    });
    setSearchParams({});
    setCurrentPage(1);
  };

  return (
    <>
      <SEO
        title={`חיפוש: ${filters.search || 'כל המודעות'}`}
        description="חפש מודעות לפי קטגוריות, ערים ומחיר"
        keywords={['חיפוש מודעות', 'קניה ומכירה', filters.search]}
      />

      <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* פילטרים */}
            <div className="lg:col-span-1">
              {/* Search Autocomplete */}
              <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                <SearchAutocomplete />
              </div>

              {/* Geolocation Search */}
              <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                <GeolocationSearch onLocationFound={handleLocationFound} />
              </div>

              <FiltersSidebar
                filters={filters}
                onChange={handleFilterChange}
                onSearch={handleSearch}
                onReset={handleReset}
              />
            </div>

            {/* תוצאות */}
            <div className="lg:col-span-3">
              <div className="mb-6">
                   filters.street ? `חיפוש ברחוב: ${filters.street}` :
                   
                <h1 className="text-3xl font-bold mb-2">
                  {filters.lat ? 'מודעות בסביבתך' : 'תוצאות חיפוש'}
                </h1>
                {adsData && (
                  <p className="text-gray-600">
                    נמצאו {adsData.pagination?.total || adsData?.ads?.length || 0} תוצאות
                  </p>
                )}
            </div>

            {isLoading ? (
              <GridSkeleton count={6} />
            ) : !adsData || !adsData.ads || adsData.ads.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold mb-2">לא נמצאו תוצאות</h2>
                <p className="text-gray-600">נסה לשנות את הפילטרים</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {adsData.ads.map((ad: any) => (
                    <AdCardCompact key={ad.id} ad={ad} />
                  ))}
                </div>

                {adsData.pagination && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={adsData.pagination.pages}
                    totalItems={adsData.pagination.total}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
