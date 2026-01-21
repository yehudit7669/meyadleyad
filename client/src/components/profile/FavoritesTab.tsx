import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/api';
import { Link } from 'react-router-dom';
import { getBackendOrigin } from '../../config/env';

export default function FavoritesTab() {
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => profileService.getFavorites(100),
  });

  const removeMutation = useMutation({
    mutationFn: profileService.removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="mb-4">עדיין לא שמרת מודעות למועדפים</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          חזור לעמוד הראשי
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">המודעות שאהבתי</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((fav: any) => (
          <div key={fav.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            {fav.ad?.images?.[0]?.url && (
              <img
                src={fav.ad.images[0].url.startsWith('http') 
                  ? fav.ad.images[0].url 
                  : `${getBackendOrigin()}${fav.ad.images[0].url}`
                }
                alt={fav.ad?.title || 'מודעה'}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                  {fav.ad?.title || 'ללא כותרת'}
                </h3>
                <span className="text-xs text-gray-500 mr-2">#{fav.ad?.adNumber}</span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">{fav.ad?.category?.nameHe}</div>
              
              {fav.ad?.city?.nameHe && (
                <div className="text-sm text-gray-500 mb-2">{fav.ad.city.nameHe}</div>
              )}
              
              {fav.ad?.price && (
                <div className="text-lg font-bold text-blue-600 mb-3">
                  ₪{fav.ad.price.toLocaleString()}
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  to={`/ads/${fav.adId}`}
                  className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  צפייה במודעה
                </Link>
                <button
                  onClick={() => removeMutation.mutate(fav.adId)}
                  disabled={removeMutation.isPending}
                  className="px-3 py-2 text-red-600 border border-red-600 text-sm rounded hover:bg-red-50 disabled:opacity-50"
                  title="הסר מהמועדפים"
                >
                  ♥
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {removeMutation.isSuccess && (
        <div className="fixed bottom-4 left-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          המודעה הוסרה מהמועדפים
        </div>
      )}
    </div>
  );
}
