import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsService } from '../services/api';

export default function MyAds() {
  const queryClient = useQueryClient();

  const { data: adsData, isLoading } = useQuery({
    queryKey: ['my-ads'],
    queryFn: () => adsService.getMyAds(),
  });

  // וודא ש-ads הוא מערך
  const ads = Array.isArray(adsData) ? adsData : [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adsService.deleteAd(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ads'] });
    },
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { text: 'ממתין לאישור', class: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { text: 'מאושר', class: 'bg-green-100 text-green-800' },
      REJECTED: { text: 'נדחה', class: 'bg-red-100 text-red-800' },
      EXPIRED: { text: 'פג תוקף', class: 'bg-gray-100 text-gray-800' },
    };
    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">המודעות שלי</h1>
          <Link
            to="/ads/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            + מודעה חדשה
          </Link>
        </div>

        {!ads || ads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">אין לך מודעות עדיין</h2>
            <p className="text-gray-600 mb-6">התחל לפרסם מודעות והן יופיעו כאן</p>
            <Link
              to="/ads/new"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              פרסם מודעה ראשונה
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad: any) => (
              <div key={ad.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex gap-4">
                  {/* תמונה */}
                  <div className="flex-shrink-0">
                    {ad.AdImage && ad.AdImage[0] ? (
                      <img
                        src={ad.AdImage[0].url}
                        alt={ad.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">📷</span>
                      </div>
                    )}
                  </div>

                  {/* פרטים */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link
                          to={`/ads/${ad.id}`}
                          className="text-xl font-bold hover:text-blue-600 transition"
                        >
                          {ad.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <span>{ad.Category.nameHe}</span>
                          {ad.City && <span>• {ad.City.nameHe}</span>}
                          <span>• {new Date(ad.createdAt).toLocaleDateString('he-IL')}</span>
                        </div>
                      </div>
                      {getStatusBadge(ad.status)}
                    </div>

                    <p className="text-gray-700 mb-3 line-clamp-2">{ad.description}</p>

                    {ad.price && (
                      <div className="text-lg font-bold text-green-600 mb-3">
                        ₪{ad.price.toLocaleString()}
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>👁️ {ad.views} צפיות</span>
                      <span>📞 {ad.contactClicks} לחיצות</span>
                    </div>
                  </div>

                  {/* פעולות */}
                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/ads/${ad.id}/edit`}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition text-center"
                    >
                      ערוך
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('האם אתה בטוח שברצונך למחוק מודעה זו?')) {
                          deleteMutation.mutate(ad.id);
                        }
                      }}
                      aria-label="מחק מודעה"
                      className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      מחק
                    </button>
                  </div>
                </div>

                {ad.status === 'REJECTED' && ad.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="font-medium text-red-800">סיבת דחייה: </span>
                    <span className="text-red-700">{ad.rejectionReason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
