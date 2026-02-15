import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappService } from '../../services/api';
import { Link } from 'react-router-dom';

interface DistributionItem {
  id: string;
  status: string;
  message: string;
  whatsappWebLink: string | null;
  scheduledAt: string;
  sentAt: string | null;
  deferredUntil: string | null;
  createdAt: string;
  Ad: {
    id: string;
    adNumber: string;
    title: string;
    price: number | null;
    Category: { nameHe: string };
    City: { nameHe: string } | null;
  };
  Group: {
    id: string;
    name: string;
    inviteLink: string | null;
  } | null;
}

export default function WhatsAppQueue() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    categoryId: '',
    cityId: '',
  });

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['whatsapp-queue', filters],
    queryFn: () => whatsappService.getQueue(filters),
  });

  // Distribute mutation: Copy message + Open WhatsApp + Mark as IN_PROGRESS
  const distributeMutation = useMutation({
    mutationFn: async (item: DistributionItem) => {
      // Check if group exists
      if (!item.Group) {
        throw new Error('לא קיימת קבוצה תואמת למודעה זו. אנא צור קבוצה מתאימה.');
      }
      
      // Check if invite link exists
      const inviteLink = item.Group.inviteLink;
      if (!inviteLink) {
        throw new Error('לא נמצא לינק לקבוצה');
      }
      
      // Mark as in progress (this will also check if group is active)
      await whatsappService.markItemAsInProgress(item.id);
      
      // Copy message to clipboard
      if (item.message) {
        await navigator.clipboard.writeText(item.message);
      }
      
      // Open WhatsApp group
      window.open(inviteLink, '_blank');
      
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-queue'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'שגיאה לא צפויה';
      alert(`❌ ${errorMessage}`);
    },
  });

  // Resend mutation: Copy message + Open WhatsApp for already SENT items
  const resendMutation = useMutation({
    mutationFn: async (item: DistributionItem) => {
      // Check if group exists
      if (!item.Group) {
        throw new Error('לא קיימת קבוצה למודעה זו');
      }
      
      // Copy message to clipboard
      if (item.message) {
        await navigator.clipboard.writeText(item.message);
      }
      
      // Open WhatsApp group using invite link
      const inviteLink = item.Group.inviteLink;
      if (inviteLink) {
        window.open(inviteLink, '_blank');
      } else {
        throw new Error('לא נמצא לינק לקבוצה');
      }
      
      return item;
    },
    onError: (error: any) => {
      alert(`❌ שגיאה: ${error.message}`);
    },
  });

  const items: DistributionItem[] = queueData?.items || [];
  
  // Debug log
  console.log('📊 WhatsApp Queue items:', items.length, items.map(i => ({ 
    adNumber: i.Ad.adNumber, 
    groupId: i.Group?.id || 'NULL', 
    groupName: i.Group?.name || 'NO GROUP' 
  })));

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'ממתין',
      IN_PROGRESS: 'בתהליך שליחה',
      READY: 'מוכן',
      SENT: 'נשלח',
      FAILED: 'נכשל',
      DEFERRED: 'נדחה',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      READY: 'bg-green-100 text-green-800',
      SENT: 'bg-blue-100 text-blue-800',
      FAILED: 'bg-red-100 text-red-800',
      DEFERRED: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">📱 תור הפצת WhatsApp</h1>
          <div className="flex gap-3">
            <Link
              to="/admin/whatsapp/groups"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              👥 ניהול קבוצות
            </Link>
            <Link
              to="/admin/whatsapp/dashboard"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              📊 Dashboard
            </Link>
          </div>
        </div>

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-600 mb-1">ממתינים</div>
            <div className="text-2xl font-bold text-yellow-800">
              {items.filter((i) => i.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-600 mb-1">בתהליך</div>
            <div className="text-2xl font-bold text-purple-800">
              {items.filter((i) => i.status === 'IN_PROGRESS').length}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">מוכנים</div>
            <div className="text-2xl font-bold text-green-800">
              {items.filter((i) => i.status === 'READY').length}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">נשלחו</div>
            <div className="text-2xl font-bold text-blue-800">
              {items.filter((i) => i.status === 'SENT').length}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 mb-1">כשלונות</div>
            <div className="text-2xl font-bold text-red-800">
              {items.filter((i) => i.status === 'FAILED').length}
            </div>
          </div>
        </div>

        {/* פילטרים */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">הכל</option>
                <option value="PENDING">ממתין</option>
                <option value="IN_PROGRESS">בתהליך שליחה</option>
                <option value="READY">מוכן</option>
                <option value="SENT">נשלח</option>
                <option value="FAILED">נכשל</option>
                <option value="DEFERRED">נדחה</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* טבלה */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">טוען...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg">אין פריטים בתור</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">מודעה</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">קבוצה</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">תזמון</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">הודעה</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">#{item.Ad.adNumber}</div>
                        <div className="text-gray-600 truncate max-w-xs">{item.Ad.title}</div>
                        <div className="text-xs text-gray-500">
                          {item.Ad.Category.nameHe} · {item.Ad.City?.nameHe || 'לא צוין'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className={`font-medium ${item.Group ? 'text-gray-900' : 'text-red-600'}`}>
                          {item.Group ? item.Group.name : 'קבוצה לא קיימת'}
                        </div>
                        {item.Group?.inviteLink && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {item.Group.inviteLink.substring(0, 30)}...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-600">
                        {item.sentAt ? (
                          <div>
                            <div className="font-medium text-green-600">נשלח:</div>
                            <div>{new Date(item.sentAt).toLocaleString('he-IL')}</div>
                          </div>
                        ) : item.deferredUntil ? (
                          <div>
                            <div className="font-medium text-orange-600">נדחה עד:</div>
                            <div>{new Date(item.deferredUntil).toLocaleString('he-IL')}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">מתוזמן:</div>
                            <div>{new Date(item.scheduledAt).toLocaleString('he-IL')}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-600 max-w-sm">
                        <div className="whitespace-pre-wrap line-clamp-2">{item.message}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {/* כפתור הפצה - למודעות PENDING */}
                      {item.status === 'PENDING' ? (
                        item.Group ? (
                          <button
                            onClick={() => distributeMutation.mutate(item)}
                            disabled={distributeMutation.isPending}
                            className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                            title="העתק הודעה ופתח WhatsApp"
                          >
                            📱 שלח
                          </button>
                        ) : (
                          <div className="text-xs text-gray-500 italic">
                            ממתין לקבוצה מתאימה
                          </div>
                        )
                      ) : (item.status === 'SENT' || item.status === 'IN_PROGRESS') ? (
                        <button
                          onClick={() => resendMutation.mutate(item)}
                          disabled={resendMutation.isPending}
                          className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                          title="שלח שוב לאותה קבוצה"
                        >
                          🔄 שלח מחדש
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
