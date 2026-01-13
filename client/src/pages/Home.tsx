import React from 'react';
import { Link } from 'react-router-dom';
import { useAds } from '../hooks/useAds';
import SearchBar from '../components/SearchBar';
import AdCard from '../components/AdCard';
import { GridSkeleton } from '../components/LoadingSkeletons';

const Home: React.FC = () => {
  const { data: latestAds, isLoading: adsLoading } = useAds({ limit: 8 });

  return (
    <div dir="rtl">
      {/* Hero Section with Search */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              ברוכים הבאים למיעדליעד
            </h1>
            <p className="text-xl md:text-2xl mb-4">
              פלטפורמת הנדל"ן המובילה בישראל
            </p>
            <p className="text-lg opacity-90">
              מוצאים ומפרסמים דירות בקלות ובמהירות
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar placeholder="חפש דירה לפי מיקום, מחיר או מאפיינים..." />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">קטגוריות</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link
              to="/category/apartments-for-sale"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-center group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">🏠</div>
              <h3 className="font-semibold text-lg">דירות למכירה</h3>
            </Link>
            
            <Link
              to="/category/apartments-for-rent"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-center group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">🔑</div>
              <h3 className="font-semibold text-lg">דירות להשכרה</h3>
            </Link>
            
            <Link
              to="/category/commercial-real-estate"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-center group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">🏢</div>
              <h3 className="font-semibold text-lg">נדל״ן מסחרי</h3>
            </Link>
            
            <Link
              to="/category/second-hand-board"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-center group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">🛍️</div>
              <h3 className="font-semibold text-lg">לוח יד שניה</h3>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Ads */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">מודעות אחרונות</h2>
            <Link to="/search" className="text-blue-600 hover:underline font-medium">
              צפה בכל המודעות ←
            </Link>
          </div>

          {adsLoading ? (
            <GridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestAds?.data?.map((ad: any) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">למה לבחור בנו?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="font-bold text-xl mb-3">התמחות בנדל"ן</h3>
              <p className="text-gray-600">
                פלטפורמה ייעודית לנדל"ן עם כלים מתקדמים למוכרים ושוכרים
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="font-bold text-xl mb-3">בטוח ומאובטח</h3>
              <p className="text-gray-600">
                מערכת מאובטחת המגנה על הפרטיות שלך ומודעותיך
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="font-bold text-xl mb-3">חיפוש גיאוגרפי</h3>
              <p className="text-gray-600">
                מצא דירות בסביבתך עם חיפוש מבוסס מיקום מתקדם
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">מוכנים להתחיל?</h2>
          <p className="text-xl mb-8">פרסם את המודעה הראשונה שלך היום!</p>
          <Link
            to="/ads/new"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            פרסם מודעה חינם
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
