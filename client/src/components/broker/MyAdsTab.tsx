import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brokerService } from '../../services/brokerService';
import { pendingApprovalsService } from '../../services/api';
import { Link } from 'react-router-dom';

const MyAdsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['broker-ads', page],
    queryFn: () => brokerService.getMyAds({ page, limit: 10 }),
  });

  // Fetch approval requests
  const { data: myApprovals } = useQuery({
    queryKey: ['my-approvals'],
    queryFn: pendingApprovalsService.getMyApprovals,
    refetchInterval: 5000,
  });

  // Check if user has permission to import properties
  const hasImportPermission = myApprovals?.some(
    (approval: any) => 
      approval.type === 'IMPORT_PROPERTIES_PERMISSION' && 
      approval.status === 'APPROVED'
  );

  // Check if there's a pending request
  const hasPendingRequest = myApprovals?.some(
    (approval: any) => 
      approval.type === 'IMPORT_PROPERTIES_PERMISSION' && 
      approval.status === 'PENDING'
  );

  // Check if there's a rejected request
  const rejectedRequest = myApprovals?.find(
    (approval: any) => 
      approval.type === 'IMPORT_PROPERTIES_PERMISSION' && 
      approval.status === 'REJECTED'
  );

  const requestPermissionMutation = useMutation({
    mutationFn: async (reason: string) => {
      return pendingApprovalsService.create({
        type: 'IMPORT_PROPERTIES_PERMISSION',
        requestData: { reason },
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      setShowRequestForm(false);
      setRequestReason('');
      alert('הבקשה נשלחה בהצלחה! נודיע לך כאשר תטופל.');
    },
    onError: () => {
      alert('שגיאה בשליחת הבקשה. נסה שוב.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: brokerService.deleteMyAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-ads'] });
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
        <div className="flex gap-2">
          {hasImportPermission && (
            <Link
              to="/broker/import-properties"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              📁 העלאת נכסים מקובץ
            </Link>
          )}
          {!hasImportPermission && !hasPendingRequest && !rejectedRequest && (
            <button
              onClick={() => setShowRequestForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              📋 בקש הרשאה להעלאת קבצים
            </button>
          )}
          {hasPendingRequest && (
            <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-300">
              ⏳ ממתין לאישור הרשאת העלאה
            </div>
          )}
          {rejectedRequest && (
            <div className="px-4 py-2 bg-red-100 text-red-800 rounded-md border border-red-300">
              ❌ בקשה נדחתה
            </div>
          )}
          <Link
            to="/publish"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + פרסם מודעה חדשה
          </Link>
        </div>
      </div>

      {/* Rejected Request Notice */}
      {rejectedRequest && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-red-500 text-2xl">❌</div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-red-900 mb-1">בקשת ההרשאה להעלאת קבצים נדחתה</h3>
              {rejectedRequest.adminNotes && (
                <div className="bg-white border border-red-200 rounded-md p-3 mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">סיבת הדחייה מהמנהל:</p>
                  <p className="text-sm text-gray-900">{rejectedRequest.adminNotes}</p>
                </div>
              )}
              <p className="text-sm text-red-700 mb-3">
                ניתן לשלוח בקשה חדשה עם פרטים נוספים או הסבר מעודכן.
              </p>
              <button
                onClick={() => setShowRequestForm(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                שלח בקשה חדשה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Permission Form */}
      {showRequestForm && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-lg mb-2">בקשת הרשאה להעלאת נכסים מקובץ</h3>
          <p className="text-sm text-gray-600 mb-3">
            הסבר למנהל מדוע אתה זקוק להרשאה זו (לדוגמה: כמות גדולה של נכסים להעלאה)
          </p>
          <textarea
            value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
            placeholder="הסבר קצר..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={() => requestPermissionMutation.mutate(requestReason)}
              disabled={!requestReason.trim() || requestPermissionMutation.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
              {requestPermissionMutation.isPending ? 'שולח...' : 'שלח בקשה'}
            </button>
            <button
              onClick={() => {
                setShowRequestForm(false);
                setRequestReason('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

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
};

export default MyAdsTab;