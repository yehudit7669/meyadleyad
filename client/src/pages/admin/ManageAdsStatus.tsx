import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Status mapping
const AD_STATUSES = {
  DRAFT: { label: 'טיוטה', color: 'bg-gray-100 text-gray-800' },
  PENDING: { label: 'ממתינה', color: 'bg-yellow-100 text-yellow-800' },
  ACTIVE: { label: 'פעילה', color: 'bg-green-100 text-green-800' },
  APPROVED: { label: 'מאושרת', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'נדחתה', color: 'bg-red-100 text-red-800' },
  EXPIRED: { label: 'פגה תוקף', color: 'bg-orange-100 text-orange-800' },
  REMOVED: { label: 'הוסרה', color: 'bg-gray-100 text-gray-800' },
};

export default function ManageAdsStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get user role - DO NOT modify it
  const userRole = user?.role || 'USER';
  const isAdminOrSuper = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [previewAdId, setPreviewAdId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'views'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch ads with filters
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-all-ads', search, statusFilter, dateFrom, dateTo],
    queryFn: () => adminService.getAllAds({
      search,
      status: statusFilter.length > 0 ? statusFilter.join(',') : undefined,
    }),
  });

  // Fetch single ad for preview
  const { data: fullAdData, isLoading: isLoadingFullAd } = useQuery({
    queryKey: ['admin-ad-full', previewAdId],
    queryFn: () => adminService.getAdById(previewAdId!),
    enabled: !!previewAdId,
  });

  // Update ad status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      if (status === 'REJECTED' && !reason) {
        throw new Error('סיבת דחייה נדרשת');
      }
      if (status === 'REJECTED') {
        return adminService.rejectAd(id, reason!);
      }
      return adminService.updateAdStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-ads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setEditingAdId(null);
      setNewStatus('');
      setRejectionReason('');
      alert('✅ סטטוס המודעה עודכן בהצלחה');
    },
    onError: (error: any) => {
      alert(`❌ שגיאה: ${error.message}`);
    }
  });

  const handleStatusChange = (adId: string) => {
    if (!newStatus) {
      alert('נא לבחור סטטוס חדש');
      return;
    }

    if (newStatus === 'REJECTED') {
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        alert('נא להזין סיבת דחייה');
        return;
      }
      if (rejectionReason.length > 250) {
        alert('סיבת דחייה חייבת להיות עד 250 תווים');
        return;
      }
    }

    updateStatusMutation.mutate({
      id: adId,
      status: newStatus,
      reason: newStatus === 'REJECTED' ? rejectionReason : undefined
    });
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleSort = (field: 'date' | 'views') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Filter ads client-side for date range
  const filteredAds = (data?.ads || []).filter((ad: any) => {
    if (dateFrom) {
      const adDate = new Date(ad.createdAt);
      const fromDate = new Date(dateFrom);
      if (adDate < fromDate) return false;
    }
    if (dateTo) {
      const adDate = new Date(ad.createdAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59);
      if (adDate > toDate) return false;
    }
    return true;
  }).sort((a: any, b: any) => {
    if (sortBy === 'views') {
      const viewsA = a.views || 0;
      const viewsB = b.views || 0;
      return sortOrder === 'desc' ? viewsB - viewsA : viewsA - viewsB;
    } else {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }
  });

  // Check permissions - based on table
  const canEdit = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const canExport = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'; // Both can export ads
  const isModerator = userRole === 'MODERATOR';

  // Debug log
  console.log('🔍 Debug - User Info:', {
    email: user?.email,
    isAdmin: user?.isAdmin,
    role: user?.role,
    calculatedRole: userRole,
    canExport
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-black">ניהול סטטוס מודעות</h1>
          <p className="text-black">
            צפייה וניהול של כל המודעות במערכת
            {isModerator && <span className="text-yellow-600 font-medium"> (צפייה בלבד)</span>}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 text-black">סינון וחיפוש</h2>
          
          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-black">חיפוש (שם, כתובת, טלפון)</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="הקלד לחיפוש..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status filters */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-black">סינון לפי סטטוס</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(AD_STATUSES).map(([status, { label, color }]) => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter.includes(status)
                      ? color + ' ring-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-black">מתאריך</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black">עד תאריך</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Clear filters */}
          {(search || statusFilter.length > 0 || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter([]);
                setDateFrom('');
                setDateTo('');
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              נקה סינונים
            </button>
          )}
        </div>

        {/* Results count and Export button */}
        <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="text-sm text-black">
            {filteredAds.length} מודעות נמצאו
          </div>
          
          {canExport && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                🔒 ייצוא מותר ל-Admin ו-Super Admin • מתועד ב-Audit Log
              </div>
              <button
                onClick={async () => {
                  // Build filter summary
                  let filterSummary = '';
                  if (dateFrom || dateTo) {
                    filterSummary += `\n📅 טווח תאריכים: ${dateFrom || 'התחלה'} - ${dateTo || 'סיום'}`;
                  }
                  if (statusFilter.length > 0) {
                    const statusLabels = statusFilter.map(s => AD_STATUSES[s as keyof typeof AD_STATUSES]?.label || s).join(', ');
                    filterSummary += `\n📊 סטטוסים: ${statusLabels}`;
                  }
                  if (!dateFrom && !dateTo && statusFilter.length === 0) {
                    filterSummary = '\n⚠️ אזהרה: לא נבחרו פילטרים - יש לייצא את כל המודעות במערכת!';
                  }

                  const confirmExport = window.confirm(
                    `האם לייצא ${filteredAds.length} מודעות?${filterSummary}\n\n` +
                    `הייצוא יכלול:\n` +
                    `✓ כל פרטי המודעות (כתובת, מחיר, תיאור)\n` +
                    `✓ פרטי מפרסמים (שם, אימייל, טלפון)\n` +
                    `✓ תאריכים (יצירה, פרסום, פקיעה, הסרה)\n` +
                    `✓ צפיות ולחיצות קשר\n` +
                    `✓ סיבות דחייה (אם רלוונטי)\n\n` +
                    `🔒 פעולה זו מתועדת אוטומטית ב-Audit Log.`
                  );
                  
                  if (!confirmExport) return;

                  try {
                    const blob = await adminService.exportAdsHistory({
                      dateFrom,
                      dateTo,
                      statuses: statusFilter,
                    });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const fileName = `ads-history-${new Date().toISOString().split('T')[0]}.csv`;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    alert(
                      `✅ הקובץ הורד בהצלחה!\n\n` +
                      `שם קובץ: ${fileName}\n` +
                      `מספר מודעות: ${filteredAds.length}\n\n` +
                      `הפעולה תועדה במערכת Audit Log.`
                    );
                  } catch (error: any) {
                    alert(
                      `❌ שגיאה בהורדת הקובץ\n\n` +
                      `${error?.message || 'שגיאה לא ידועה'}\n\n` +
                      `נא לנסות שוב או לפנות למפתח.`
                    );
                    console.error('Export error:', error);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 active:bg-green-800 transition shadow-md hover:shadow-lg"
                title="ייצוא ארכיון מודעות מלא לפי הפילטרים שנבחרו"
              >
                📊 ייצוא ארכיון מלא (CSV)
                <span className="text-xs bg-green-700 px-2 py-0.5 rounded">
                  {filteredAds.length} מודעות
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Ads Table */}
        {filteredAds.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2 text-black">לא נמצאו מודעות</h2>
            <p className="text-black">נסה לשנות את הפילטרים או החיפוש</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-bold text-black">מספר</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-black">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        תאריך
                        {sortBy === 'date' && (
                          <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-black">כתובת</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-black">קטגוריה</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-black">מפרסם</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-black">סטטוס</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-black">
                      <button
                        onClick={() => handleSort('views')}
                        className="flex items-center gap-1 hover:text-blue-600 mx-auto"
                      >
                        צפיות
                        {sortBy === 'views' && (
                          <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-black">תצוגה</th>
                    {canEdit && <th className="px-4 py-3 text-center text-sm font-bold text-black">פעולות</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAds.map((ad: any) => (
                    <tr key={ad.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-mono">#{ad.adNumber}</td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">
                        {new Date(ad.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="max-w-xs">
                          <div className="font-medium text-black">{ad.City?.nameHe || 'לא צוין'}</div>
                          {ad.Street && <div className="text-xs text-black">{ad.Street.name}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-black">{ad.Category?.nameHe}</td>
                      <td className="px-4 py-4 text-sm">
                        <div className="max-w-xs">
                          <div className="font-medium text-black">{ad.User?.name || ad.User?.email}</div>
                          {ad.User?.phone && <div className="text-xs text-black">{ad.User.phone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          AD_STATUSES[ad.status as keyof typeof AD_STATUSES]?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {AD_STATUSES[ad.status as keyof typeof AD_STATUSES]?.label || ad.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          👁️ {ad.views || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => { setPreviewAdId(ad.id); setSelectedImageIndex(0); }}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        >
                          👁️ תצוגה
                        </button>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-4 text-center">
                          {editingAdId === ad.id ? (
                            <div className="space-y-2">
                              <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="w-full px-2 py-1 text-sm border rounded"
                              >
                                <option value="">בחר סטטוס</option>
                                {Object.entries(AD_STATUSES).map(([status, { label }]) => (
                                  <option key={status} value={status}>{label}</option>
                                ))}
                              </select>
                              
                              {newStatus === 'REJECTED' && (
                                <input
                                  type="text"
                                  placeholder="סיבת דחייה (חובה)"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  className="w-full px-2 py-1 text-sm border rounded"
                                  maxLength={250}
                                />
                              )}
                              
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleStatusChange(ad.id)}
                                  disabled={updateStatusMutation.isPending}
                                  className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                  שמור
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingAdId(null);
                                    setNewStatus('');
                                    setRejectionReason('');
                                  }}
                                  className="flex-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
                                >
                                  ביטול
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingAdId(ad.id)}
                              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
                            >
                              ✏️ שנה סטטוס
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Preview Panel - Reuse from PendingAds */}
        {previewAdId && fullAdData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => { setPreviewAdId(null); setSelectedImageIndex(0); }}>
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-black">תצוגה מקדימה - מודעה #{fullAdData.adNumber}</h2>
                <button
                  onClick={() => { setPreviewAdId(null); setSelectedImageIndex(0); }}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-black mb-1">סטטוס נוכחי</h4>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        AD_STATUSES[fullAdData.status as keyof typeof AD_STATUSES]?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {AD_STATUSES[fullAdData.status as keyof typeof AD_STATUSES]?.label || fullAdData.status}
                      </span>
                    </div>
                    <div>
                      <a
                        href={`/ads/${fullAdData.id}?preview=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        🔍 תצוגה באתר
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-black">
                  <p><strong>כתובת:</strong> {fullAdData.City?.nameHe} {fullAdData.Street?.name && `, ${fullAdData.Street.name}`}</p>
                  <p><strong>קטגוריה:</strong> {fullAdData.Category?.nameHe}</p>
                  <p><strong>מחיר:</strong> ₪{fullAdData.price?.toLocaleString()}</p>
                  <p><strong>תיאור:</strong> {fullAdData.description}</p>
                  <p><strong>מפרסם:</strong> {fullAdData.User?.name} ({fullAdData.User?.email})</p>
                  <p><strong>צפיות:</strong> {fullAdData.views || 0}</p>
                  <p><strong>תאריך יצירה:</strong> {new Date(fullAdData.createdAt).toLocaleString('he-IL')}</p>
                </div>
                
                <div className="mt-6 pt-4 border-t flex justify-end">
                  <button
                    onClick={() => setPreviewAdId(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
