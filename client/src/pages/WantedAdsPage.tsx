import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adsService } from '../services/api';
import AdCardCompact from '../components/home/AdCardCompact';
import PropertyFilters, { FilterValues } from '../components/filters/PropertyFilters';
import { useState } from 'react';

export default function WantedAdsPage() {
  // Filter state
  const [filters, setFilters] = useState<FilterValues & { categoryId?: string }>({
    propertyTypes: [],
    priceRange: [0, 20000000],
  });

  const { data: adsData, isLoading: loadingAds } = useQuery({
    queryKey: ['wanted-ads'],
    queryFn: () => {
      const params: any = { adType: 'WANTED' };
      return adsService.getAds(params);
    },
  });

  // Client-side filtering
  const filteredAds = (adsData?.ads || []).filter((ad: any) => {
    // City filter
    if (filters.cityId && ad.cityId !== filters.cityId) {
      return false;
    }

    // Category filter
    if (filters.categoryId && ad.categoryId !== filters.categoryId) {
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

  return (
    <div className="min-h-screen bg-white py-8" dir="rtl">
      <div className="container mx-auto px-4">
        {/* ניווט breadcrumb */}
        <nav className="text-sm text-gray-600 mb-4">
          <Link to="/" className="hover:text-blue-600">
            דף הבית
          </Link>
          <span className="mx-2">/</span>
          <span>דרושים</span>
        </nav>

        {/* סינונים */}
        <PropertyFilters
          onFilterChange={(newFilters) => setFilters({ ...newFilters, categoryId: filters.categoryId })}
          initialFilters={filters}
          showCategoryFilter={true}
          onCategoryChange={(categoryId) => setFilters({ ...filters, categoryId })}
          currentCategoryId={filters.categoryId}
          wantedCategoriesOnly={true}
        />

        {/* מידע על מספר התוצאות */}
        <div className="mb-4 text-sm text-gray-600">
          {ads.length} מודעות דרושים
        </div>

        {/* תוכן */}
        {loadingAds ? (
          <div className="flex justify-center py-12">
            <div className="text-xl text-gray-600">טוען מודעות...</div>
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              אין מודעות דרושים
            </h3>
            <p className="text-gray-600 mb-6">
              היה הראשון לפרסם מודעת דרושים!
            </p>
            <Link
              to="/publish/wanted"
              className="inline-block px-6 py-3 bg-[#1F3F3A] text-white rounded-lg hover:bg-[#2D5A52] transition"
            >
              פרסם מודעת דרושים
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {ads.map((ad: any) => (
              <AdCardCompact key={ad.id} ad={ad} showCategory={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
