import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/api';
import { Link } from 'react-router-dom';

// מיפוי סטטוסים - במסך ניהול המודעות "מאושרת" מוצגת כ"פעילה"
// הסרנו APPROVED כדי למנוע כפילות - רק ACTIVE מייצג "פעילה"
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'טיוטה',
  PENDING: 'ממתינה',
  ACTIVE: 'פעילה',
  REJECTED: 'נדחתה',
  EXPIRED: 'פגה תוקף',
  REMOVED: 'הוסרה',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  APPROVED: 'bg-green-100 text-green-800', // גם APPROVED יקבל צבע של פעילה אם קיים ב-DB
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
  REMOVED: 'bg-slate-100 text-slate-800',
};

// פונקציה שמתמפה גם APPROVED ל"פעילה" בתצוגה
const getStatusLabel = (status: string): string => {
  if (status === 'APPROVED') return 'פעילה';
  return STATUS_LABELS[status] || status;
};

export default function AdminAdsManagement() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-all-ads', filters],
    queryFn: () => adminService.getAllAds(filters),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateAdStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-ads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const handleStatusChange = (adId: string, newStatus: string) => {
    if (window.confirm(`האם להחליף סטטוס ל-${getStatusLabel(newStatus)}?`)) {
      updateStatusMutation.mutate({ id: adId, status: newStatus });
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  const ads = data?.ads || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
      <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* כותרת */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin" className="text-blue-600 hover:underline text-sm">
              ← חזרה לניהול
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">ניהול מודעות - כל הסטטוסים</h1>
          </div>

          {/* פילטרים */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* סינון לפי סטטוס */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">סטטוס</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">הכל</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* חיפוש */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    חיפוש (שם, כתובת, טלפון, אימייל)
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="הקלד כדי לחפש..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  🔍 חפש
                </button>
                <button
                  type="button"
                  onClick={() => setFilters({ status: '', search: '', page: 1, limit: 20 })}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  נקה
                </button>
              </div>
            </form>
          </div>

          {/* סטטיסטיקות */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 font-medium">סה"כ מודעות:</span>
              <span className="text-xl font-bold text-gray-900">{pagination.total}</span>
            </div>
          </div>

          {/* טבלה */}
          {ads.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">לא נמצאו מודעות</h2>
              <p className="text-gray-700">נסה לשנות את הפילטרים</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                        מזהה
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                        כותרת
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                        כתובת
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                        מפרסם
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                        סטטוס
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                        תאריכים
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                        פעולות
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ads.map((ad: any) => (
                      <tr key={ad.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{ad.adNumber || ad.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="font-medium text-gray-900">{ad.title}</div>
                            <div className="text-xs text-gray-700">{ad.Category?.nameHe}</div>
                            {typeof ad.views === 'number' && (
                              <span
                                className="inline-block bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-0.5 mt-1"
                                title="מספר צפיות"
                              >
                                👁️ {ad.views} צפיות
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            {ad.City?.nameHe}
                            {ad.Street && `, ${ad.Street.name}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900">{ad.User?.name || ad.User?.email}</div>
                          {ad.User?.phone && (
                            <div className="text-xs text-gray-700">{ad.User.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={ad.status}
                            onChange={(e) => handleStatusChange(ad.id, e.target.value)}
                            disabled={updateStatusMutation.isPending}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              STATUS_COLORS[ad.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-900">
                          <div>יצירה: {new Date(ad.createdAt).toLocaleDateString('he-IL')}</div>
                          {ad.publishedAt && (
                            <div>פרסום: {new Date(ad.publishedAt).toLocaleDateString('he-IL')}</div>
                          )}
                          {ad.expiresAt && (
                            <div>פקיעה: {new Date(ad.expiresAt).toLocaleDateString('he-IL')}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link
                            to={`/ads/${ad.id}`}
                            target="_blank"
                            className="text-blue-600 hover:underline"
                          >
                            צפייה
                          </Link>
                          <button
                            onClick={() => adminService.exportAdA4PDF(ad.id)}
                            className="ml-2 bg-gray-200 hover:bg-blue-100 text-xs rounded px-2 py-1"
                            title="ייצוא PDF A4"
                          >
                            ייצוא A4
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-900">
                    עמוד {pagination.page} מתוך {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                      disabled={filters.page === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                      ← הקודם
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                      disabled={filters.page >= pagination.totalPages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                      הבא →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );
}
