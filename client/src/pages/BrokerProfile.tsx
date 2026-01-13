import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersService, adsService } from '../services/api';

export default function BrokerProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: broker, isLoading: loadingBroker } = useQuery({
    queryKey: ['broker', id],
    queryFn: () => usersService.getUser(id!),
    enabled: !!id,
  });

  const { data: adsData, isLoading: loadingAds } = useQuery({
    queryKey: ['broker-ads', id],
    queryFn: () => adsService.getAds({ userId: id }),
    enabled: !!id,
  });

  if (loadingBroker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">המשתמש לא נמצא</h2>
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
      <div className="container mx-auto px-4 max-w-6xl">
        {/* כרטיס פרופיל */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
              {broker.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{broker.name}</h1>
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                {broker.phone && (
                  <a
                    href={`tel:${broker.phone}`}
                    className="flex items-center gap-2 hover:text-blue-600"
                  >
                    📞 {broker.phone}
                  </a>
                )}
                <span>📧 {broker.email}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-blue-600 font-bold">{ads.length}</span>
                  <span className="text-gray-600 mr-2">מודעות פעילות</span>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                  <span className="text-green-600 font-bold">
                    {new Date(broker.createdAt).getFullYear()}
                  </span>
                  <span className="text-gray-600 mr-2">שנת הצטרפות</span>
                </div>
              </div>
            </div>
            <div>
              <a
                href={`https://wa.me/${broker.phone?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#25D366] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#20BA5A] transition mb-2"
              >
                💬 שלח WhatsApp
              </a>
              <a
                href={`tel:${broker.phone}`}
                className="block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition text-center"
              >
                📞 התקשר
              </a>
            </div>
          </div>
        </div>

        {/* מודעות */}
        <div>
          <h2 className="text-2xl font-bold mb-6">מודעות של {broker.name}</h2>

          {loadingAds ? (
            <div className="text-center py-12">טוען...</div>
          ) : ads.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold mb-2">אין מודעות להצגה</h3>
              <p className="text-gray-600">למשתמש זה אין מודעות פעילות כרגע</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-4xl">📷</span>
                    </div>
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
                      <span>{ad.category.nameHe}</span>
                      {ad.city && <span>{ad.city.nameHe}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
