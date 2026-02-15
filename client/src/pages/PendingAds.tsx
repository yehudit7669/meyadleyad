import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/api';
import { Link } from 'react-router-dom';

// מיפוי סטטוסים לתצוגה
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    DRAFT: 'טיוטה',
    PENDING: 'ממתינה',
    ACTIVE: 'מאושרת',
    APPROVED: 'מאושרת',
    REJECTED: 'נדחתה',
    EXPIRED: 'פגה תוקף',
  };
  return labels[status] || status;
};

// מיפוי סוגי נכסים
const getPropertyType = (categoryName: string): string => {
  const types: Record<string, string> = {
    'דירות למכירה': 'למכירה',
    'דירות להשכרה': 'להשכרה',
    'דירות לשבת': 'לשבת',
    'דרושים': 'דרושים',
  };
  return types[categoryName] || categoryName;
};

export default function PendingAds() {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [rejectingAdId, setRejectingAdId] = useState<string | null>(null);
  const [previewAdId, setPreviewAdId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [tableImageIndexes, setTableImageIndexes] = useState<{ [key: string]: number }>({});
  const [sortBy, setSortBy] = useState<'date' | 'views'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // סינונים
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    cityName: '',
    publisher: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['pending-ads', filters],
    queryFn: () => adminService.getPendingAds(filters as any),
  });

  // טעינת מודעה מלאה לתצוגה מקדימה
  const { data: fullAdData, isLoading: isLoadingFullAd } = useQuery({
    queryKey: ['admin-ad-full', previewAdId],
    queryFn: () => adminService.getAdById(previewAdId!),
    enabled: !!previewAdId,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveAdWithPendingDistribution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-queue'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      // Don't show error if it's about no matching groups - ad is still approved
      if (errorMessage && !errorMessage.includes('לא נמצאו קבוצות') && !errorMessage.includes('קבוצה')) {
        alert(`❌ שגיאה: ${errorMessage}`);
      }
      // Always refresh the lists even if there was an error
      queryClient.invalidateQueries({ queryKey: ['pending-ads'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-queue'] });
    },
  });

  const approveAndWhatsappMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`🔵 Calling approve-and-whatsapp for ad: ${id}`);
      
      // Call the API that approves + creates SENT distribution items + returns message text
      const result = await adminService.approveAdWithInProgressDistribution(id);
      
      console.log(`✅ Received result:`, result);
      
      // Show warning if exists (but not as error - ad is still approved)
      if (result.data?.warning) {
        alert(`⚠️ ${result.data.warning}\n\nהמודעה אושרה ותופיע בתור הפצה.`);
      }
      
      // Copy message text to clipboard
      if (result.data?.messageText) {
        await navigator.clipboard.writeText(result.data.messageText);
      }
      
      // Open WhatsApp Web with first group's phone (or just WhatsApp if no groups)
      if (result.data?.items?.[0]) {
        // Items now have groupId, try to open WhatsApp Web
        window.open('https://web.whatsapp.com', '_blank');
      } else {
        window.open('https://web.whatsapp.com', '_blank');
      }
      
      return result;
    },
    onSuccess: async () => {
      // Use refetch to prevent flash
      await queryClient.refetchQueries({ queryKey: ['pending-ads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-queue'] });
    },
    onError: (error: any) => {
      alert(`❌ שגיאה: ${error.response?.data?.message || error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.rejectAd(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-ads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setRejectionReason((prev) => {
        const newState = { ...prev };
        delete newState[variables.id];
        return newState;
      });
      setRejectingAdId(null);
      alert('❌ המודעה נדחתה ונשלח מייל למפרסם');
    },
  });

  const handleReject = (id: string) => {
    const reason = rejectionReason[id] || '';
    if (reason.length > 250) {
      alert('סיבת דחייה חייבת להיות עד 250 תווים');
      return;
    }
    rejectMutation.mutate({ id, reason });
  };
  
  // סינון ומיון מודעות
  const filteredAds = (data?.ads || []).filter((ad: any) => {
    let matches = true;
    
    if (filters.cityName && ad.City?.nameHe) {
      matches = matches && ad.City.nameHe.includes(filters.cityName);
    }
    
    if (filters.publisher) {
      const publisherName = ad.User?.name || ad.User?.email || '';
      matches = matches && publisherName.includes(filters.publisher);
    }
    
    if (filters.dateFrom) {
      const adDate = new Date(ad.createdAt);
      const fromDate = new Date(filters.dateFrom);
      matches = matches && adDate >= fromDate;
    }
    
    if (filters.dateTo) {
      const adDate = new Date(ad.createdAt);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      matches = matches && adDate <= toDate;
    }
    
    return matches;
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

  const handleSort = (field: 'date' | 'views') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  const previewAd = fullAdData; // ה-API מחזיר ישירות את המודעה

  return (
      <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/admin"
              className="text-blue-600 hover:underline text-sm"
            >
              ← חזרה לניהול
            </Link>
            <h1 className="text-3xl font-bold">מודעות ממתינות לאישור</h1>
          </div>

          {/* סינונים */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900">סינון</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">מתאריך</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">עד תאריך</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">עיר</label>
                <input
                  type="text"
                  value={filters.cityName}
                  onChange={(e) => setFilters({ ...filters, cityName: e.target.value })}
                  placeholder="חפש לפי עיר..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">שם מפרסם</label>
                <input
                  type="text"
                  value={filters.publisher}
                  onChange={(e) => setFilters({ ...filters, publisher: e.target.value })}
                  placeholder="חפש לפי מפרסם..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {(filters.dateFrom || filters.dateTo || filters.cityName || filters.publisher) && (
              <button
                onClick={() => setFilters({ dateFrom: '', dateTo: '', cityName: '', publisher: '' })}
                className="mt-4 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                נקה סינונים
              </button>
            )}
          </div>

          {!filteredAds || filteredAds.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-2">אין מודעות ממתינות</h2>
              <p className="text-gray-600">כל המודעות אושרו או נדחו</p>
            </div>
          ) : (
            <>
              {/* טבלה - תצוגה למחשב */}
              <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">
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
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">כתובת</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">סוג נכס</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">תיאור</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-900">תמונות</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">שם מפרסם</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-900">
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
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-900">פעולה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAds.map((ad: any) => {
                        const currentImageIndex = tableImageIndexes[ad.id] || 0;
                        const images = ad.AdImage?.sort((a: any, b: any) => a.order - b.order) || [];
                        
                        return (
                        <tr key={ad.id} className="hover:bg-gray-50">
                          {/* תאריך */}
                          <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900 font-medium">
                            {new Date(ad.createdAt).toLocaleDateString('he-IL')}
                          </td>
                          
                          {/* כתובת */}
                          <td className="px-4 py-4 text-sm">
                            <div className="max-w-xs">
                              <div className="font-medium text-gray-900">
                                {ad.address || ad.Street?.name || 'לא צוין'}
                              </div>
                              {ad.City?.nameHe && (
                                <div className="text-xs text-gray-700">{ad.City.nameHe}</div>
                              )}
                            </div>
                          </td>
                          
                          {/* סוג נכס */}
                          <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                            {getPropertyType(ad.Category?.nameHe || '')}
                          </td>
                          
                          {/* תיאור */}
                          <td className="px-4 py-4 text-sm">
                            <div className="max-w-xs">
                              <p className="text-gray-700 line-clamp-3" title={ad.description}>
                                {ad.description || 'אין תיאור'}
                              </p>
                            </div>
                          </td>
                          
                          {/* תמונות */}
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center">
                              {images.length > 0 ? (
                                <div className="relative group">
                                  <img
                                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${images[currentImageIndex]?.url}`}
                                    alt="תמונת נכס"
                                    className="w-32 h-32 object-cover rounded-lg cursor-pointer"
                                    onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${images[currentImageIndex]?.url}`, '_blank')}
                                  />
                                  {images.length > 1 && (
                                    <>
                                      <button
                                        onClick={() => setTableImageIndexes(prev => ({
                                          ...prev,
                                          [ad.id]: currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
                                        }))}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
                                      >
                                        ←
                                      </button>
                                      <button
                                        onClick={() => setTableImageIndexes(prev => ({
                                          ...prev,
                                          [ad.id]: currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
                                        }))}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
                                      >
                                        →
                                      </button>
                                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-2 py-0.5 rounded-full text-xs">
                                        {currentImageIndex + 1}/{images.length}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                  אין תמונות
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* שם מפרסם */}
                          <td className="px-4 py-4 text-sm">
                            <div className="max-w-xs">
                              <div className="font-medium text-gray-900">{ad.User?.name || ad.User?.email}</div>
                              {ad.User?.phone && (
                                <div className="text-xs text-gray-700">{ad.User.phone}</div>
                              )}
                            </div>
                          </td>
                          
                          {/* צפיות */}
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                              👁️ {ad.views || 0}
                            </span>
                          </td>
                          
                          {/* פעולה */}
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => { setPreviewAdId(ad.id); setSelectedImageIndex(0); }}
                                title="תצוגה מקדימה"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                👁️
                              </button>
                              <button
                                onClick={() => approveMutation.mutate(ad.id)}
                                disabled={approveMutation.isPending}
                                title="אשר מודעה"
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                              >
                                ✅
                              </button>
                              <button
                                onClick={() => approveAndWhatsappMutation.mutate(ad.id)}
                                disabled={approveAndWhatsappMutation.isPending}
                                title="אשר ושלח ל-WhatsApp"
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                              >
                                📱✅
                              </button>
                              <button
                                onClick={() => setRejectingAdId(ad.id)}
                                title="דחה מודעה"
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                ❌
                              </button>
                            </div>
                            
                            {/* שדה דחייה */}
                            {rejectingAdId === ad.id && (
                              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <input
                                  type="text"
                                  placeholder="סיבת דחייה (חובה, עד 250 תווים)"
                                  value={rejectionReason[ad.id] || ''}
                                  onChange={(e) =>
                                    setRejectionReason((prev) => ({
                                      ...prev,
                                      [ad.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-2"
                                  maxLength={250}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReject(ad.id)}
                                    disabled={rejectMutation.isPending}
                                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                                  >
                                    שלח
                                  </button>
                                  <button
                                    onClick={() => setRejectingAdId(null)}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                                  >
                                    ביטול
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* כרטיסים - תצוגה למובייל */}
              <div className="lg:hidden space-y-4">
                {filteredAds.map((ad: any) => {
                  const currentImageIndex = tableImageIndexes[ad.id] || 0;
                  const images = ad.AdImage?.sort((a: any, b: any) => a.order - b.order) || [];
                  
                  return (
                  <div key={ad.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm text-gray-700 mb-1 font-medium">
                            {new Date(ad.createdAt).toLocaleDateString('he-IL')}
                          </div>
                          <div className="font-bold text-lg mb-1 text-gray-900">
                            {ad.address ? (
                              <>{ad.address}{ad.City?.nameHe && `, ${ad.City.nameHe}`}</>
                            ) : (
                              <>{ad.City?.nameHe}{ad.Street && `, ${ad.Street.name}`}</>
                            )}
                          </div>
                          <div className="text-sm text-gray-800 mb-1 font-medium">
                            {getPropertyType(ad.Category?.nameHe || '')}
                          </div>
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">מפרסם: </span>
                            {ad.User?.name || ad.User?.email}
                          </div>
                          {ad.User?.phone && (
                            <div className="text-sm text-gray-700">{ad.User.phone}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* תיאור */}
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-1">תיאור:</div>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {ad.description || 'אין תיאור'}
                        </p>
                      </div>
                      
                      {/* תמונות */}
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-2">תמונות:</div>
                        <div className="flex items-center justify-center">
                          {images.length > 0 ? (
                            <div className="relative group w-full">
                              <img
                                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${images[currentImageIndex]?.url}`}
                                alt="תמונת נכס"
                                className="w-full h-48 object-cover rounded-lg cursor-pointer"
                                onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${images[currentImageIndex]?.url}`, '_blank')}
                              />
                              {images.length > 1 && (
                                <>
                                  <button
                                    onClick={() => setTableImageIndexes(prev => ({
                                      ...prev,
                                      [ad.id]: currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
                                    }))}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition"
                                  >
                                    ←
                                  </button>
                                  <button
                                    onClick={() => setTableImageIndexes(prev => ({
                                      ...prev,
                                      [ad.id]: currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
                                    }))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition"
                                  >
                                    →
                                  </button>
                                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                                    {currentImageIndex + 1}/{images.length}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                              אין תמונות
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* צפיות */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">צפיות:</span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          👁️ {ad.views || 0}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setPreviewAdId(ad.id); setSelectedImageIndex(0); }}
                          className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          👁️ תצוגה
                        </button>
                        <button
                          onClick={() => approveMutation.mutate(ad.id)}
                          disabled={approveMutation.isPending}
                          className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          ✅ אשר
                        </button>
                        <button
                          onClick={() => approveAndWhatsappMutation.mutate(ad.id)}
                          disabled={approveAndWhatsappMutation.isPending}
                          className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          title="אשר ושלח ל-WhatsApp"
                        >
                          📱✅
                        </button>
                        <button
                          onClick={() => setRejectingAdId(ad.id)}
                          className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          ❌ דחה
                        </button>
                      </div>
                      
                      {rejectingAdId === ad.id && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <input
                            type="text"
                            placeholder="סיבת דחייה (חובה, עד 250 תווים)"
                            value={rejectionReason[ad.id] || ''}
                            onChange={(e) =>
                              setRejectionReason((prev) => ({
                                ...prev,
                                [ad.id]: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-2"
                            maxLength={250}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(ad.id)}
                              disabled={rejectMutation.isPending}
                              className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                            >
                              שלח
                            </button>
                            <button
                              onClick={() => setRejectingAdId(null)}
                              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              ביטול
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </>
          )}

          {/* פאנל תצוגה מקדימה */}
          {previewAdId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => { setPreviewAdId(null); setSelectedImageIndex(0); }}>
              <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                  <h2 className="text-xl font-bold">תצוגה מקדימה מלאה</h2>
                  <button
                    onClick={() => { setPreviewAdId(null); setSelectedImageIndex(0); }}
                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                
                {isLoadingFullAd ? (
                  <div className="p-12 text-center">
                    <div className="text-lg">טוען פרטי מודעה...</div>
                  </div>
                ) : previewAd ? (
                  <div className="p-6">
                    {/* תמונות - גלריה מלאה */}
                    {previewAd.AdImage && previewAd.AdImage.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold mb-3 text-gray-900">תמונות הנכס ({previewAd.AdImage.length})</h3>
                        
                        {/* תמונה ראשית גדולה */}
                        <div className="mb-4 relative bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${previewAd.AdImage.sort((a: any, b: any) => a.order - b.order)[selectedImageIndex]?.url}`}
                            alt={`תמונה ${selectedImageIndex + 1}`}
                            className="w-full h-96 object-contain cursor-pointer"
                            onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${previewAd.AdImage[selectedImageIndex]?.url}`, '_blank')}
                          />
                          
                          {/* כפתורי ניווט */}
                          {previewAd.AdImage.length > 1 && (
                            <>
                              <button
                                onClick={() => setSelectedImageIndex(prev => prev === 0 ? previewAd.AdImage.length - 1 : prev - 1)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition"
                              >
                                ←
                              </button>
                              <button
                                onClick={() => setSelectedImageIndex(prev => prev === previewAd.AdImage.length - 1 ? 0 : prev + 1)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition"
                              >
                                →
                              </button>
                            </>
                          )}
                          
                          {/* מונה תמונות */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-bold">
                            {selectedImageIndex + 1} / {previewAd.AdImage.length}
                          </div>
                          
                          {/* תג תמונה ראשית */}
                          {selectedImageIndex === 0 && (
                            <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                              ⭐ תמונה ראשית
                            </div>
                          )}
                        </div>
                        
                        {/* תמונות ממוזערות */}
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                          {previewAd.AdImage.sort((a: any, b: any) => a.order - b.order).map((img: any, idx: number) => (
                            <div
                              key={img.id}
                              onClick={() => setSelectedImageIndex(idx)}
                              className={`relative cursor-pointer rounded-lg overflow-hidden ${
                                idx === selectedImageIndex ? 'ring-4 ring-blue-500' : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-blue-300'
                              } transition`}
                            >
                              <img
                                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${img.url}`}
                                alt={`תמונה ממוזערת ${idx + 1}`}
                                className="w-full h-20 object-cover"
                              />
                              {idx === 0 && (
                                <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">
                                  ⭐
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-3 text-center">
                          💡 לחץ על התמונה הגדולה לפתיחה במסך מלא • השתמש בחיצים או בתמונות הממוזערות למעבר בין תמונות
                        </p>
                      </div>
                    )}
                    
                    {/* כותרת וסוג מודעה */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {previewAd.Category?.nameHe}
                        </span>
                        {previewAd.isWanted && (
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                            דרושים
                          </span>
                        )}
                      </div>
                      <h3 className="text-3xl font-bold mb-2 text-gray-900">{previewAd.title}</h3>
                    </div>
                    
                    {/* כתובת מלאה */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-bold mb-2 flex items-center gap-2 text-gray-900">
                        <span>📍</span>
                        <span>כתובת מלאה</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {previewAd.City && (
                          <div>
                            <span className="text-gray-700 font-medium">עיר:</span>{' '}
                            <span className="text-gray-900">{previewAd.City.nameHe}</span>
                          </div>
                        )}
                        {previewAd.Street && (
                          <div>
                            <span className="text-gray-700 font-medium">רחוב:</span>{' '}
                            <span className="text-gray-900">{previewAd.Street.name}</span>
                          </div>
                        )}
                        {previewAd.address && (
                          <div>
                            <span className="text-gray-700 font-medium">כתובת:</span>{' '}
                            <span className="text-gray-900">{previewAd.address}</span>
                          </div>
                        )}
                        {previewAd.neighborhood && (
                          <div>
                            <span className="text-gray-700 font-medium">שכונה:</span>{' '}
                            <span className="text-gray-900">{previewAd.neighborhood}</span>
                          </div>
                        )}
                        {previewAd.requestedLocationText && (
                          <div className="col-span-2">
                            <span className="text-gray-700 font-medium">מיקום מבוקש:</span>{' '}
                            <span className="text-gray-900">{previewAd.requestedLocationText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* מחיר */}
                    {previewAd.price !== null && previewAd.price !== undefined && (
                      <div className="mb-6">
                        <div className="text-3xl font-bold text-green-600">
                          ₪{previewAd.price.toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    {/* פרטי הנכס מ-customFields */}
                    {previewAd.customFields && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-bold mb-3 text-lg text-gray-900">פרטי הנכס</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {Object.entries(previewAd.customFields).map(([key, value]: [string, any]) => {
                            // דלג על שדות ריקים, null, או אובייקטים מקוננים
                            if (value === null || value === undefined || value === '' || typeof value === 'object') return null;
                            
                            // תרגום שמות שדות נפוצים לעברית
                            const fieldLabels: Record<string, string> = {
                              rooms: 'מספר חדרים',
                              bedrooms: 'חדרי שינה',
                              bathrooms: 'חדרי רחצה',
                              floor: 'קומה',
                              totalFloors: 'סה״כ קומות בבניין',
                              squareMeters: 'שטח במ״ר',
                              buildingArea: 'שטח בנוי',
                              totalArea: 'שטח כולל',
                              balconies: 'מספר מרפסות',
                              parking: 'חניה',
                              warehouse: 'מחסן',
                              storage: 'מחסן',
                              furnished: 'ריהוט',
                              furniture: 'מרוהט',
                              condition: 'מצב הנכס',
                              arnona: 'ארנונה (חודשי)',
                              vaad: 'ועד בית (חודשי)',
                              vaadBayit: 'ועד בית (חודשי)',
                              entryDate: 'תאריך כניסה',
                              immediate: 'כניסה מיידית',
                              flexible: 'תאריך גמיש',
                              longTerm: 'לטווח ארוך',
                              minRental: 'תקופת השכרה מינימלית',
                              option: 'אופציה',
                              elevator: 'מעלית',
                              accessibility: 'נגישות לנכים',
                              airConditioner: 'מזגן',
                              airConditioning: 'מיזוג אוויר',
                              bars: 'סורגים',
                              succahBalcony: 'מרפסת סוכה',
                              sukkaBalcony: 'מרפסת סוכה',
                              mamad: 'ממ״ד',
                              safeRoom: 'ממ״ד',
                              parentalSuite: 'יחידת הורים',
                              parentalUnit: 'יחידת הורים',
                              housingUnit: 'יחידת דיור נוספת',
                              view: 'נוף',
                              yard: 'חצר',
                              pool: 'בריכה',
                              security: 'אבטחה',
                              renovated: 'משופץ',
                              garden: 'גינה',
                              terrace: 'טרסה',
                              cottage: 'קוטג׳',
                              penthouse: 'פנטהאוז',
                              duplex: 'דופלקס',
                              triplex: 'טריפלקס',
                              studio: 'סטודיו',
                              loft: 'לופט',
                              sheets: 'מצעים',
                              hotPlate: 'פלטה חשמלית',
                              waterHeater: 'מיחם מים',
                              kosher: 'כשר',
                              shabbosClock: 'שעון שבת',
                              freeParking: 'חניה חינם',
                              paidParking: 'חניה בתשלום',
                              noParking: 'אין חניה',
                              hasOption: 'יש אופציה',
                              houseNumber: 'מספר בית',
                              streetNumber: 'מספר בית',
                              contactPhone: 'טלפון ליצירת קשר',
                              phone: 'טלפון',
                              hasBroker: 'יש מתווך',
                              broker: 'מתווך',
                              propertyType: 'סוג נכס',
                              type: 'סוג',
                            };
                            
                            // תרגום ערכי קבועים באנגלית
                            const valueTranslations: Record<string, string> = {
                              APARTMENT: 'דירה',
                              HOUSE: 'בית פרטי',
                              PENTHOUSE: 'פנטהאוז',
                              DUPLEX: 'דופלקס',
                              COTTAGE: 'קוטג׳',
                              STUDIO: 'סטודיו',
                              MAINTAINED: 'מתוחזק',
                              RENOVATED: 'משופץ',
                              NEW: 'חדש',
                              OLD: 'ישן',
                              YES: 'כן',
                              NO: 'לא',
                              TRUE: 'כן',
                              FALSE: 'לא',
                            };
                            
                            const label = fieldLabels[key] || key;
                            let displayValue = value;
                            
                            // תרגום ערכים באנגלית
                            if (typeof value === 'string' && valueTranslations[value.toUpperCase()]) {
                              displayValue = valueTranslations[value.toUpperCase()];
                            }
                            // עיצוב ערכים בוליאניים
                            else if (typeof value === 'boolean') {
                              displayValue = value ? '✓ כן' : '✗ לא';
                            }
                            
                            return (
                              <div key={key} className="bg-white p-2 rounded">
                                <span className="text-gray-700 font-medium">{label}:</span>{' '}
                                <span className="text-gray-900 font-semibold">{String(displayValue)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* תיאור */}
                    <div className="mb-6">
                      <h4 className="font-bold mb-2 text-lg text-gray-900">תיאור הנכס</h4>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">{previewAd.description}</p>
                    </div>
                    
                    {/* מפת מיקום */}
                    {previewAd.latitude && previewAd.longitude && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-bold mb-2 text-gray-900">מיקום במפה</h4>
                        <div className="text-sm text-gray-700 mb-2">
                          קואורדינטות: {previewAd.latitude.toFixed(6)}, {previewAd.longitude.toFixed(6)}
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${previewAd.latitude},${previewAd.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          🗺️ פתח במפות Google
                        </a>
                      </div>
                    )}
                    
                    {/* פרטי מפרסם */}
                    <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                      <h4 className="font-bold mb-3 text-lg text-gray-900">פרטי מפרסם</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {previewAd.User?.name && (
                          <div>
                            <span className="text-gray-700 font-medium">שם:</span>{' '}
                            <span className="text-gray-900">{previewAd.User.name}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-700 font-medium">אימייל:</span>{' '}
                          <span className="text-gray-900">{previewAd.User?.email}</span>
                        </div>
                        {previewAd.User?.phone && (
                          <div>
                            <span className="text-gray-700 font-medium">טלפון:</span>{' '}
                            <span className="text-gray-900 font-semibold">{previewAd.User.phone}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-700 font-medium">סוג משתמש:</span>{' '}
                          <span className="text-gray-900">
                            {previewAd.User?.role === 'ADMIN' ? 'מנהל מערכת' : 
                             previewAd.User?.role === 'BROKER' ? 'מתווך' : 'משתמש רגיל'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* מידע נוסף */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <span className="font-medium text-gray-700">מספר מודעה:</span>{' '}
                        <span className="text-gray-900">#{previewAd.adNumber}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">סטטוס:</span>{' '}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          previewAd.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          previewAd.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          previewAd.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusLabel(previewAd.status)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">צפיות:</span>{' '}
                        <span className="text-gray-900">{previewAd.views}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">לחיצות יצירת קשר:</span>{' '}
                        <span className="text-gray-900">{previewAd.contactClicks}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">תאריך יצירה:</span>{' '}
                        <span className="text-gray-900">{new Date(previewAd.createdAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      {previewAd.publishedAt && (
                        <div>
                          <span className="font-medium text-gray-700">תאריך פרסום:</span>{' '}
                          <span className="text-gray-900">{new Date(previewAd.publishedAt).toLocaleDateString('he-IL')}</span>
                        </div>
                      )}
                      {previewAd.expiresAt && (
                        <div>
                          <span className="font-medium text-gray-700">תפוג ב:</span>{' '}
                          <span className="text-gray-900">{new Date(previewAd.expiresAt).toLocaleDateString('he-IL')}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* קישור לתצוגה כפי שתיראה באתר */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-bold mb-2 text-gray-900">תצוגה כפי שתיראה באתר</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        צפייה במודעה כפי שהיא תיראה למשתמשים באתר (גישה למנהלים בלבד)
                      </p>
                      <a
                        href={`/ads/${previewAd.id}?preview=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        🔍 תצוגה מקדימה באתר
                        <span className="text-xs opacity-75">(יפתח בחלון חדש)</span>
                      </a>
                    </div>
                    
                    {/* כפתורי פעולה */}
                    <div className="sticky bottom-0 bg-white border-t pt-4 flex gap-3">
                      <button
                        onClick={() => {
                          approveMutation.mutate(previewAd.id);
                          setPreviewAdId(null);
                        }}
                        disabled={approveMutation.isPending || previewAd.status !== 'PENDING'}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 transition"
                      >
                        ✅ אשר מודעה
                      </button>
                      <button
                        onClick={() => {
                          approveAndWhatsappMutation.mutate(previewAd.id);
                          setPreviewAdId(null);
                        }}
                        disabled={approveAndWhatsappMutation.isPending || previewAd.status !== 'PENDING'}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 transition"
                      >
                        📱✅ אשר ושלח ל-WhatsApp
                      </button>
                      <button
                        onClick={() => {
                          setPreviewAdId(null);
                          setRejectingAdId(previewAd.id);
                        }}
                        disabled={previewAd.status !== 'PENDING'}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-400 transition"
                      >
                        ❌ דחה מודעה
                      </button>
                      <button
                        onClick={() => setPreviewAdId(null)}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        סגור
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-red-600">
                    שגיאה בטעינת המודעה
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
