import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesService, adsService } from '../services/api';
import AdCard from '../components/AdCard';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: loadingCategory } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesService.getCategoryBySlug(slug!),
    enabled: !!slug,
  });

  const { data: adsData, isLoading: loadingAds } = useQuery({
    queryKey: ['category-ads', category?.id],
    queryFn: () => adsService.getAds({ categoryId: category!.id }),
    enabled: !!category?.id,
  });

  if (loadingCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">הקטגוריה לא נמצאה</h2>
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
        {/* כותרת קטגוריה */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link to="/" className="hover:text-blue-600">
              דף הבית
            </Link>
            <span className="mx-2">/</span>
            <span>{category.nameHe}</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-6xl">{category.icon || '📁'}</div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{category.nameHe}</h1>
              {category.descriptionHe && (
                <p className="text-gray-600 text-lg">{category.descriptionHe}</p>
              )}
              <div className="mt-3 text-sm text-gray-500">
                {ads.length} מודעות בקטגוריה זו
              </div>
            </div>
          </div>
        </div>

        {/* תוכן */}
        {loadingAds ? (
          <div className="text-center py-12">טוען מודעות...</div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">אין מודעות בקטגוריה זו</h2>
            <p className="text-gray-600 mb-6">היה הראשון לפרסם!</p>
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
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
