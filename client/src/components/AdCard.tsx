import { Link } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { profileService } from '../services/api';
import { useState } from 'react';
import { getImageUrl } from '../utils/imageUrl';

interface AdCardProps {
  ad: {
    id: string;
    title: string;
    description: string;
    price?: number;
    images?: { url: string }[];
    category: { nameHe: string };
    city?: { nameHe: string };
    createdAt: string;
    views: number;
    user: {
      email: string;
      name?: string;
    };
    isWanted?: boolean;
    requestedLocationText?: string;
  };
  featured?: boolean;
}

export default function AdCard({ ad, featured = false }: AdCardProps) {
  const queryClient = useQueryClient();
  const [isFavoriteOptimistic, setIsFavoriteOptimistic] = useState(false);

  // בדיקה אם המודעה במועדפים
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => profileService.getFavorites(100),
    enabled: !!localStorage.getItem('accessToken'),
    retry: false,
  });

  const isFavorite = favorites?.some((fav: any) => fav.adId === ad.id) || isFavoriteOptimistic;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await profileService.removeFavorite(ad.id);
      } else {
        await profileService.addFavorite(ad.id);
      }
    },
    onMutate: () => {
      setIsFavoriteOptimistic(!isFavorite);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      setIsFavoriteOptimistic(isFavorite);
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!localStorage.getItem('accessToken')) {
      window.location.href = '/login';
      return;
    }
    
    toggleFavoriteMutation.mutate();
  };
  return (
    <Link
      to={`/ads/${ad.id}`}
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group ${
        featured ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* תמונה */}
      <div className="relative overflow-hidden">
        {ad.images && ad.images[0] ? (
          <img
            src={getImageUrl(ad.images[0].url)}
            alt={ad.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-gray-400 text-5xl">📷</span>
          </div>
        )}
        {featured && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            ⭐ מומלץ
          </div>
        )}
        {/* כפתור לב */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 left-2 w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-md transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isFavorite 
              ? 'bg-red-500 border-red-600 text-white hover:bg-red-600 focus:ring-red-500' 
              : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50 focus:ring-gray-400'
          }`}
          aria-label={isFavorite ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
          title={isFavorite ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
        >
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
        </button>
      </div>

      {/* תוכן */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition">
          {ad.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ad.description}</p>

        {/* מחיר */}
        {ad.price && (
          <div className="text-2xl font-bold text-green-600 mb-3">
            ₪{ad.price.toLocaleString()}
          </div>
        )}

        {/* פרטים */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              📁 {ad.category?.nameHe || 'מודעה'}
            </span>
            {(ad.city || ad.requestedLocationText) && (
              <span className="flex items-center gap-1">
                📍 {ad.isWanted && ad.requestedLocationText 
                  ? ad.requestedLocationText 
                  : ad.city?.nameHe}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1">
            👁️ {ad.views}
          </span>
        </div>

        {/* מפרסם */}
        <div className="mt-2 text-xs text-gray-500">
          {ad.user?.name || ad.user?.email || 'משתמש'} • {new Date(ad.createdAt).toLocaleDateString('he-IL')}
        </div>
      </div>
    </Link>
  );
}
