import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adsService } from '../services/api';
import AdCard from '../components/AdCard';

export default function WantedAdsPage() {
  const [searchParams] = useSearchParams();
  
  // Get cities from URL params
  const citiesParam = searchParams.get('cities');
  const selectedCities = citiesParam ? citiesParam.split(',') : [];

  const { data: adsData, isLoading: loadingAds } = useQuery({
    queryKey: ['wanted-ads', selectedCities],
    queryFn: () => {
      const params: any = { adType: 'WANTED' };
      
      // Add city filter if cities are selected
      if (selectedCities.length > 0) {
        params.cities = selectedCities.join(',');
      }
      
      return adsService.getAds(params);
    },
  });

  const ads = adsData?.ads || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4">
        {/* כותרת */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link to="/" className="hover:text-blue-600">
              דף הבית
            </Link>
            <span className="mx-2">/</span>
            <span>דרושים</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-6xl">🔍</div>
            <div>
              <h1 className="text-4xl font-bold mb-2">דרושים - מחפשים נכסים</h1>
              <p className="text-gray-600 text-lg">כל המודעות של מי שמחפש נכס</p>
              <div className="mt-3 text-sm text-gray-500">
                {ads.length} מודעות דרושים
                {selectedCities.length > 0 && (
                  <span className="mr-2 text-[#C9A24D] font-semibold">
                    (מסונן לפי {selectedCities.length} ערים)
                  </span>
                )}
              </div>
              {selectedCities.length > 0 && (
                <div className="mt-2">
                  <Link
                    to="/wanted"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    הצג את כל המודעות דרושים ←
                  </Link>
                </div>
              )}
            </div>
          </div>
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
              {selectedCities.length > 0 && ' בערים שנבחרו'}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedCities.length > 0 
                ? 'נסה לבחור ערים אחרות או הסר את הסינון'
                : 'היה הראשון לפרסם מודעת דרושים!'
              }
            </p>
            {selectedCities.length > 0 ? (
              <Link
                to="/wanted"
                className="inline-block px-6 py-3 bg-[#1F3F3A] text-white rounded-lg hover:bg-[#2D5A52] transition"
              >
                הצג את כל המודעות דרושים
              </Link>
            ) : (
              <Link
                to="/publish/wanted"
                className="inline-block px-6 py-3 bg-[#1F3F3A] text-white rounded-lg hover:bg-[#2D5A52] transition"
              >
                פרסם מודעת דרושים
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {ads.map((ad: any) => (
              <AdCard key={ad.id} ad={ad} showCategory={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
