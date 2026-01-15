import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Newspaper, Eye, Download, RefreshCw, Send, Trash2, FileText, Calendar, MapPin } from 'lucide-react';
import { api } from '../../services/api';

interface NewspaperAd {
  id: string;
  adId: string;
  filePath: string;
  version: number;
  createdAt: string;
  createdBy: string;
  ad: {
    id: string;
    title: string;
    address: string;
    status: string;
    customFields?: any;
    City?: { nameHe: string };
    Street?: { name: string };
  };
  creator: {
    name: string;
    email: string;
  };
}

const AD_STATUSES: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'טיוטה', color: 'bg-gray-100 text-gray-800' },
  PENDING: { label: 'ממתינה', color: 'bg-yellow-100 text-yellow-800' },
  ACTIVE: { label: 'פעילה', color: 'bg-green-100 text-green-800' },
  APPROVED: { label: 'מאושרת', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'נדחתה', color: 'bg-red-100 text-red-800' },
  EXPIRED: { label: 'פגה תוקף', color: 'bg-orange-100 text-orange-800' },
  REMOVED: { label: 'הוסרה', color: 'bg-gray-100 text-gray-800' },
};

export default function NewspaperLayoutPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAd, setSelectedAd] = useState<NewspaperAd | null>(null);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [emailList, setEmailList] = useState('');

  // Fetch newspaper PDFs
  const { data, isLoading } = useQuery({
    queryKey: ['newspaper-ads', currentPage],
    queryFn: async () => {
      // Add timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const response = await api.get(`/admin/newspaper?page=${currentPage}&limit=20&_t=${timestamp}`);
      return response.data;
    },
    // Refetch on window focus to ensure fresh data
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data immediately stale
  });

  // Regenerate mutation
  const regenerateMutation = useMutation({
    mutationFn: async (newspaperAdId: string) => {
      const response = await api.post(`/admin/newspaper/regenerate/${newspaperAdId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newspaper-ads'] });
      alert('✅ PDF עיתון נוצר מחדש בהצלחה');
    },
    onError: (error: any) => {
      alert(`❌ שגיאה: ${error.response?.data?.error || error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (newspaperAdId: string) => {
      await api.delete(`/admin/newspaper/${newspaperAdId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newspaper-ads'] });
      alert('✅ PDF נמחק בהצלחה');
    },
    onError: (error: any) => {
      alert(`❌ שגיאה: ${error.response?.data?.error || error.message}`);
    },
  });

  // Distribute mutation
  const distributeMutation = useMutation({
    mutationFn: async ({ newspaperAdId, emails }: { newspaperAdId: string; emails: string[] }) => {
      const response = await api.post(`/admin/newspaper/${newspaperAdId}/distribute`, {
        emailList: emails,
      });
      return response.data;
    },
    onSuccess: () => {
      setShowDistributeModal(false);
      setEmailList('');
      setSelectedAd(null);
      alert('✅ PDF הופץ בהצלחה');
    },
    onError: (error: any) => {
      alert(`❌ שגיאה: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleView = async (newspaperAdId: string) => {
    try {
      const response = await api.get(`/admin/newspaper/${newspaperAdId}/view`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Cleanup
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      alert(`שגיאה בטעינת PDF: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDownload = async (newspaperAdId: string, ad: NewspaperAd) => {
    try {
      const response = await api.get(`/admin/newspaper/${newspaperAdId}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `newspaper-${ad.ad.title}-v${ad.version}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      alert(`שגיאה בהורדת PDF: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleRegenerate = (newspaperAdId: string) => {
    if (confirm('האם לייצר גרסה חדשה של PDF זה? הגרסה הקיימת תישאר.')) {
      regenerateMutation.mutate(newspaperAdId);
    }
  };

  const handleDelete = (newspaperAdId: string) => {
    if (confirm('האם למחוק PDF זה? פעולה זו אינה הפיכה.')) {
      deleteMutation.mutate(newspaperAdId);
    }
  };

  const handleDistribute = () => {
    if (!selectedAd) return;

    const emails = emailList
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emails.length === 0) {
      alert('נא להזין לפחות כתובת אימייל אחת');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter((email) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      alert(`כתובות אימייל לא תקינות: ${invalidEmails.join(', ')}`);
      return;
    }

    distributeMutation.mutate({
      newspaperAdId: selectedAd.id,
      emails,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFullAddress = (ad: NewspaperAd['ad']) => {
    const parts = [];
    if (ad.City?.nameHe) parts.push(ad.City.nameHe);
    if (ad.Street?.name) parts.push(ad.Street.name);
    if (ad.customFields?.houseNumber) parts.push(ad.customFields.houseNumber);
    return parts.length > 0 ? parts.join(', ') : ad.address || 'לא צוין';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">טוען...</div>
      </div>
    );
  }

  const newspaperAds = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="w-8 h-8 text-[#1F3F3A]" />
          <h1 className="text-2xl font-bold text-gray-900">לוח מודעות – תצורת עיתון</h1>
        </div>
        <p className="text-gray-600">
          ניהול קבצי PDF עיתונאיים של מודעות פעילות. כל PDF נשמר עם גרסה ומותאם להדפסה בפורמט A4.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-2">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">מידע חשוב:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>קבצי PDF נוצרים אוטומטית כאשר מודעה עוברת לסטטוס "פעילה"</li>
              <li>כל יצירה מחדש (Regenerate) יוצרת גרסה חדשה מבלי למחוק את הקודמת</li>
              <li>קבצים אינם ציבוריים ונגישים רק למנהלי מערכת</li>
              <li>הורדה והפצה דורשים הרשאת EXPORT</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">סה"כ קבצי PDF</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">מודעות פעילות</div>
          <div className="text-2xl font-bold text-green-600">
            {newspaperAds.filter((ad: NewspaperAd) => ad.ad.status === 'ACTIVE').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">דף נוכחי</div>
          <div className="text-2xl font-bold text-gray-900">
            {pagination.page} / {pagination.totalPages}
          </div>
        </div>
      </div>

      {/* Table */}
      {newspaperAds.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">אין קבצי PDF עיתונאיים</p>
          <p className="text-gray-400 text-sm">
            קבצי PDF ייווצרו אוטומטית כאשר מודעות יעברו לסטטוס "פעילה"
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">תאריך יצירה</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">מזהה מודעה</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">כותרת / כתובת</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">סטטוס</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">גרסה</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">נוצר ע"י</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {newspaperAds.map((newspaperAd: NewspaperAd) => (
                  <tr key={newspaperAd.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(newspaperAd.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {newspaperAd.adId.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 truncate">{newspaperAd.ad.title}</div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 truncate mt-1">
                          <MapPin className="w-3 h-3" />
                          {getFullAddress(newspaperAd.ad)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          AD_STATUSES[newspaperAd.ad.status]?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {AD_STATUSES[newspaperAd.ad.status]?.label || newspaperAd.ad.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-900">v{newspaperAd.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{newspaperAd.creator.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* View */}
                        <button
                          onClick={() => handleView(newspaperAd.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="צפייה ב-PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => handleDownload(newspaperAd.id, newspaperAd)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="הורדת PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Regenerate */}
                        <button
                          onClick={() => handleRegenerate(newspaperAd.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="יצירה מחדש"
                          disabled={regenerateMutation.isPending}
                        >
                          <RefreshCw className={`w-4 h-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Distribute */}
                        <button
                          onClick={() => {
                            setSelectedAd(newspaperAd);
                            setShowDistributeModal(true);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="הפצה לרשימת תפוצה"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(newspaperAd.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="מחיקת PDF"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                מציג {newspaperAds.length} מתוך {pagination.total} רשומות
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הקודם
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  עמוד {pagination.page} מתוך {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הבא
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Distribute Modal */}
      {showDistributeModal && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">הפצת PDF לרשימת תפוצה</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>מודעה:</strong> {selectedAd.ad.title}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>גרסה:</strong> v{selectedAd.version}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כתובות אימייל (מופרדות בפסיקים)
              </label>
              <textarea
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="example1@email.com, example2@email.com"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDistributeModal(false);
                  setEmailList('');
                  setSelectedAd(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleDistribute}
                disabled={distributeMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {distributeMutation.isPending ? 'שולח...' : 'שלח'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
