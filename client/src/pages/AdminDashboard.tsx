import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/api';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStatistics,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">טוען...</div>;
  }

  const cards = [
    { title: 'סה"כ משתמשים', value: stats?.totalUsers || 0, icon: '👥', color: 'bg-blue-500' },
    { title: 'סה"כ מודעות', value: stats?.totalAds || 0, icon: '📋', color: 'bg-green-500' },
    { title: 'ממתינות לאישור', value: stats?.pendingAds || 0, icon: '⏳', color: 'bg-yellow-500' },
    { title: 'מודעות פעילות', value: stats?.activeAds || stats?.approvedAds || 0, icon: '✅', color: 'bg-emerald-500' },
  ];

  return (
      <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">ניהול מערכת</h1>

          {/* סטטיסטיקות */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{card.title}</p>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </div>
                  <div className={`${card.color} text-white text-4xl p-4 rounded-lg`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* תפריט ניהול */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/admin/pending"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">⏳</div>
                <div>
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition">
                    מודעות ממתינות
                  </h3>
                  <p className="text-gray-600">אשר או דחה מודעות חדשות</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/ads-management"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">📊</div>
                <div>
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition">
                    ניהול מודעות
                  </h3>
                  <p className="text-gray-600">נהל סטטוס וצפה בכל המודעות</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">👥</div>
                <div>
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition">
                    ניהול משתמשים
                  </h3>
                  <p className="text-gray-600">צפה ונהל משתמשים</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/banners"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">🎨</div>
                <div>
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition">
                    ניהול באנרים
                  </h3>
                  <p className="text-gray-600">עריכת באנרים פרסומיים</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/categories"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">📁</div>
                <div>
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition">
                    ניהול קטגוריות
                  </h3>
                  <p className="text-gray-600">הוסף וערוך קטגוריות</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/cities"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">🏙️</div>
                <div>
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition">
                    ניהול ערים
                  </h3>
                  <p className="text-gray-600">הוסף וערוך ערים</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/whatsapp"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">💬</div>
                <div>
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition">
                    קבוצות WhatsApp
                  </h3>
                  <p className="text-gray-600">נהל קבוצות לפי קטגוריות</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/branding"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">🏷️</div>
                <div>
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition">
                    לוגו למיתוג
                  </h3>
                  <p className="text-gray-600">ניהול לוגו והגדרות Watermark</p>
                </div>
              </div>
            </Link>
          </div>

          {/* נתונים אחרונים */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">סטטיסטיקות נוספות</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats?.totalCategories || 0}</div>
                <div className="text-sm text-gray-600">קטגוריות</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats?.totalCities || 0}</div>
                <div className="text-sm text-gray-600">ערים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats?.todayAds || 0}</div>
                <div className="text-sm text-gray-600">מודעות היום</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.monthlyRevenue || 0}₪
                </div>
                <div className="text-sm text-gray-600">הכנסות חודשיות</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
