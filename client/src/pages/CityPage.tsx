import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { citiesService, adsService } from '../services/api';

export default function CityPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: city, isLoading: loadingCity } = useQuery({
    queryKey: ['city', slug],
    queryFn: () => citiesService.getCityBySlug(slug!),
    enabled: !!slug,
  });

  const { data: adsData, isLoading: loadingAds } = useQuery({
    queryKey: ['city-ads', city?.id],
    queryFn: () => adsService.getAds({ cityId: city!.id }),
    enabled: !!city?.id,
  });

  if (loadingCity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">העיר לא נמצאה</h2>
          <Link to="/" className="text-blue-600 hover:underline">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  const ads = adsData?.ads || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4">
        {/* כותרת עיר */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link to="/" className="hover:text-blue-600">
              דף הבית
            </Link>
            <span className="mx-2">/</span>
            <span>{city.nameHe}</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-6xl">📍</div>
            <div>
              <h1 className="text-4xl font-bold mb-2">מודעות ב{city.nameHe}</h1>
              <p className="text-gray-600 text-lg">כל המודעות באזור {city.nameHe}</p>
              <div className="mt-3 text-sm text-gray-500">
                {ads.length} מודעות בעיר זו
              </div>
            </div>
          </div>
        </div>

        {/* סינון לפי קטגוריות */}
        {ads.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="font-bold mb-3">סנן לפי קטגוריה:</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(ads.map((ad: any) => ad.category.nameHe))).map(
                (categoryName: any) => (
                  <button
                    key={categoryName}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    {categoryName}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* תוכן */}
        {loadingAds ? (
          <div className="text-center py-12">טוען מודעות...</div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">אין מודעות בעיר {city.nameHe}</h2>
            <p className="text-gray-600 mb-6">היה הראשון לפרסם בעיר זו!</p>
            <Link
              to="/ads/new"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              פרסם מודעה חדשה
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ads.map((ad: any) => (
              <Link
                key={ad.id}
                to={`/ads/${ad.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {ad.images && ad.images[0] ? (
                  <img
                    src={ad.images[0].url}
                    alt={ad.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <img
                    src="/images/default-property.jpg"
                    alt={ad.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">{ad.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ad.description}</p>
                  {ad.price && (
                    <div className="text-xl font-bold text-green-600 mb-2">
                      ₪{ad.price.toLocaleString()}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>📁 {ad.category.nameHe}</span>
                    <span>👁️ {ad.views}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
