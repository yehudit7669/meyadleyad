// Favorites/Watchlist Page
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/api';
import AdCardCompact from '../components/home/AdCardCompact';
import { GridSkeleton } from '../components/LoadingSkeletons';

export default function Favorites() {
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => profileService.getFavorites(),
    staleTime: 0, // תמיד לרענן
  }) as { data: any[] | undefined; isLoading: boolean };

  console.log('Favorites data:', favorites); // לוג לבדיקה

  return (
    <div className="min-h-screen bg-white py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">מודעות שאהבתי</h1>

        {isLoading ? (
          <GridSkeleton count={6} />
        ) : !favorites || favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">💙</div>
            <h2 className="text-2xl font-bold mb-2">אין לך מודעות מועדפות</h2>
            <p className="text-gray-600 mb-6">
              התחל לשמור מודעות שמעניינות אותך
            </p>
            <Link
              to="/search"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              חפש מודעות
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {favorites.map((favorite: any) => {
              // התאמה למבנה הנתונים שחוזר מהשרת
              const adData = favorite.ad || favorite;
              return <AdCardCompact key={favorite.id} ad={adData} />;
            })}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-600">
          {favorites && favorites.length > 0 && (
            <p>יש לך {favorites.length} מודעות מועדפות</p>
          )}
        </div>
      </div>
    </div>
  );
}
