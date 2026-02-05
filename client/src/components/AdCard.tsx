import { Link } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { profileService } from '../services/api';
import { useState } from 'react';

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
    customFields?: {
      rooms?: number;
      squareMeters?: number;
      floor?: number;
      [key: string]: any;
    };
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
    staleTime: 0, // תמיד לוודא שהנתונים עדכניים
    initialData: [], // התחלה עם מערך ריק
  });

  const isFavorite = favorites?.some((fav: any) => fav.adId === ad.id) || isFavoriteOptimistic;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (shouldAdd: boolean) => {
      if (shouldAdd) {
        await profileService.addFavorite(ad.id);
      } else {
        await profileService.removeFavorite(ad.id);
      }
    },
    onMutate: async (shouldAdd: boolean) => {
      // ביטול queries קודמות
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      
      // שמירת הערך הקודם
      const previousFavorites = queryClient.getQueryData(['favorites']);
      
      // עדכון אופטימיסטי
      setIsFavoriteOptimistic(shouldAdd);
      queryClient.setQueryData(['favorites'], (oldData: any) => {
        if (!oldData) return oldData;
        if (shouldAdd) {
          // הוספה למועדפים
          return [...oldData, { adId: ad.id, id: ad.id, createdAt: new Date().toISOString() }];
        } else {
          // הסרה מהמועדפים
          return oldData.filter((fav: any) => fav.adId !== ad.id);
        }
      });
      
      return { previousFavorites };
    },
    onSuccess: () => {
      // רענון המועדפים
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (_err, _shouldAdd, context) => {
      // החזרה למצב הקודם במקרה של שגיאה
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
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
    
    // מניעת לחיצה כפולה
    if (toggleFavoriteMutation.isPending) {
      return;
    }
    
    // שליחת הפעולה עם הפרמטר הנכון
    toggleFavoriteMutation.mutate(!isFavorite);
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
            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${ad.images[0].url}`}
            alt={ad.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <img
            src="/default-ad-image.svg"
            alt="אין תמונה זמינה"
            className="w-full h-48 object-cover"
          />
        )}
        {featured && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            ⭐ מומלץ
          </div>
        )}
        {/* כפתור לב */}
        <button
          onClick={handleFavoriteClick}
          disabled={toggleFavoriteMutation.isPending}
          className={`absolute top-2 left-2 w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-md transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isFavorite 
              ? 'bg-red-500 border-red-600 text-white hover:bg-red-600 focus:ring-red-500' 
              : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50 focus:ring-gray-400'
          } ${toggleFavoriteMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        {/* מחיר */}
        {ad.price && (
          <div className="text-xl font-bold text-[#C9A24D] mb-2">
            ₪{ad.price.toLocaleString()}
          </div>
        )}

        {/* כתובת */}
        {(ad.city || ad.requestedLocationText) && (
          <div className="text-base font-semibold text-gray-900 mb-2">
            {ad.isWanted && ad.requestedLocationText 
              ? ad.requestedLocationText 
              : ad.city?.nameHe}
          </div>
        )}

        {/* פרטי נכס */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {(ad as any).customFields?.rooms && (
            <span>{(ad as any).customFields.rooms} חדרים</span>
          )}
          {(ad as any).customFields?.rooms && (ad as any).customFields?.squareMeters && (
            <span className="text-gray-400">|</span>
          )}
          {(ad as any).customFields?.squareMeters && (
            <span>{(ad as any).customFields.squareMeters} מ"ר</span>
          )}
          {((ad as any).customFields?.squareMeters || (ad as any).customFields?.rooms) && 
           (ad as any).customFields?.floor !== null && 
           (ad as any).customFields?.floor !== undefined && (
            <span className="text-gray-400">|</span>
          )}
          {(ad as any).customFields?.floor !== null && (ad as any).customFields?.floor !== undefined && (
            <span>קומה {(ad as any).customFields.floor}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
