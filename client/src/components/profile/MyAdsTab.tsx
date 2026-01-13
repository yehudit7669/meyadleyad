import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/api';
import { Link } from 'react-router-dom';

export default function MyAdsTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-ads', page],
    queryFn: () => profileService.getMyAds({ page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: profileService.deleteMyAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ads'] });
      setDeleteConfirm(null);
    },
  });

  const handleDelete = (adId: string) => {
    if (deleteConfirm === adId) {
      deleteMutation.mutate(adId);
    } else {
      setDeleteConfirm(adId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      ACTIVE: { text: 'פעילה', className: 'bg-green-100 text-green-800' },
      PENDING: { text: 'ממתינה לאישור', className: 'bg-yellow-100 text-yellow-800' },
      REJECTED: { text: 'נדחתה', className: 'bg-red-100 text-red-800' },
      EXPIRED: { text: 'פג תוקף', className: 'bg-gray-100 text-gray-800' },
      DRAFT: { text: 'טיוטה', className: 'bg-blue-100 text-blue-800' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">המודעות שלי</h2>
        <Link
          to="/publish"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + פרסם מודעה חדשה
        </Link>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">מספר</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">כותרת</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">סוג</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">סטטוס</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">כתובת</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">תאריך</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">צפיות</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.ads.map((ad: any) => (
              <tr key={ad.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  #{ad.adNumber}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{ad.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{ad.category}</td>
                <td className="px-4 py-3">{getStatusBadge(ad.status)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {ad.cityName && ad.streetName 
                    ? `${ad.streetName}, ${ad.cityName}`
                    : ad.address || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(ad.createdAt).toLocaleDateString('he-IL')}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{ad.views}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      to={`/ads/${ad.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      צפייה
                    </Link>
                    <Link
                      to={`/ads/${ad.id}/edit`}
                      className="text-green-600 hover:text-green-700 text-sm"
                    >
                      ערוך
                    </Link>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className={`text-sm ${
                        deleteConfirm === ad.id
                          ? 'text-red-700 font-bold'
                          : 'text-red-600 hover:text-red-700'
                      }`}
                    >
                      {deleteConfirm === ad.id ? 'אישור מחיקה?' : 'מחק'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data?.ads.map((ad: any) => (
          <div key={ad.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="font-semibold text-gray-900">#{ad.adNumber} - {ad.title}</div>
                <div className="text-sm text-gray-600">{ad.category}</div>
              </div>
              {getStatusBadge(ad.status)}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {ad.cityName && ad.streetName 
                ? `${ad.streetName}, ${ad.cityName}`
                : ad.address || '-'}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
              <span>{new Date(ad.createdAt).toLocaleDateString('he-IL')}</span>
              <span>{ad.views} צפיות</span>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/ads/${ad.id}`}
                className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                צפייה
              </Link>
              <Link
                to={`/ads/${ad.id}/edit`}
                className="flex-1 text-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                ערוך
              </Link>
              <button
                onClick={() => handleDelete(ad.id)}
                className={`flex-1 px-3 py-2 text-sm rounded ${
                  deleteConfirm === ad.id
                    ? 'bg-red-700 text-white font-bold'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {deleteConfirm === ad.id ? 'אישור?' : 'מחק'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            הקודם
          </button>
          <span className="px-3 py-1">
            עמוד {page} מתוך {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            הבא
          </button>
        </div>
      )}

      {data?.ads.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">עדיין לא פרסמת מודעות</p>
          <Link
            to="/publish"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            פרסם מודעה ראשונה
          </Link>
        </div>
      )}
    </div>
  );
}
