import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/api';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PendingChanges {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  adType?: string;
  cityId?: string;
  streetId?: string;
  houseNumber?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  customFields?: Record<string, any>;
  contactName?: string;
  contactPhone?: string;
  neighborhood?: string;
  requestedAt?: string;
  requestedBy?: string;
  images?: Array<{ url: string; order?: number }>;
}

interface Ad {
  id: string;
  adNumber: number;
  title: string;
  description: string;
  price: number;
  status: string;
  createdAt: string;
  hasPendingChanges: boolean;
  pendingChanges: PendingChanges | null;
  pendingChangesAt: string | null;
  address?: string;
  Category?: { nameHe: string; id: string };
  City?: { nameHe: string; id: string };
  Street?: { name: string; id: string };
  User?: {
    name: string;
    email: string;
    phone: string;
  };
  customFields?: Record<string, any>;
  contactName?: string;
  contactPhone?: string;
  neighborhood?: string;
  AdImage?: Array<{ id: string; url: string; order: number }>;
}

export default function PendingChangesPage() {
  const queryClient = useQueryClient();
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch ads with pending changes
  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-changes'],
    queryFn: () => adminService.getAdsWithPendingChanges(),
  });

  const ads = data?.ads || [];

  // Approve changes mutation
  const approveMutation = useMutation({
    mutationFn: (adId: string) => adminService.approvePendingChanges(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
      setShowModal(false);
      setSelectedAd(null);
    },
    onError: (error: any) => {
      console.error('Error approving changes:', error);
      alert(`❌ שגיאה באישור שינויים: ${error.message}`);
    },
  });

  // Reject changes mutation
  const rejectMutation = useMutation({
    mutationFn: ({ adId, reason }: { adId: string; reason?: string }) => 
      adminService.rejectPendingChanges(adId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
      setShowModal(false);
      setSelectedAd(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      console.error('Error rejecting changes:', error);
      alert(`❌ שגיאה בדחיית שינויים: ${error.message}`);
    },
  });

  const handleApprove = (adId: string) => {
    approveMutation.mutate(adId);
  };

  const handleReject = (adId: string) => {
    rejectMutation.mutate({ adId, reason: rejectionReason });
  };

  const renderFieldComparison = (label: string, oldValue: any, newValue: any) => {
    return (
      <div className="bg-gradient-to-l from-yellow-50 to-white border-r-4 border-yellow-500 rounded-lg p-4 shadow-sm">
        <div className="font-bold text-gray-800 mb-3 text-lg">{label}</div>
        <div className="grid grid-cols-2 gap-4">
          {/* Before */}
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">לפני השינוי</div>
            <div className="bg-gray-100 px-4 py-3 rounded-lg border-2 border-gray-300">
              <div className="text-gray-700 whitespace-pre-wrap break-words">
                {oldValue || <span className="text-gray-400 italic">לא צוין</span>}
              </div>
            </div>
          </div>
          {/* After */}
          <div>
            <div className="text-xs font-semibold text-yellow-700 mb-2 uppercase tracking-wide">אחרי השינוי</div>
            <div className="bg-yellow-50 px-4 py-3 rounded-lg border-2 border-yellow-400">
              <div className="text-yellow-900 font-medium whitespace-pre-wrap break-words">
                {newValue || <span className="text-gray-400 italic">לא צוין</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
          <h1 className="text-3xl font-bold mb-2 text-black flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            שינויים ממתינים לאישור
          </h1>
          <p className="text-gray-600">
            מודעות מאושרות שהמשתמשים ביקשו לעדכן - השינויים ממתינים לאישור שלך
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-10 h-10 text-yellow-600" />
              <div>
                <div className="text-3xl font-bold text-yellow-600">{ads.length}</div>
                <div className="text-sm text-gray-600">מודעות עם שינויים ממתינים</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ads List */}
        {ads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2 text-black">אין שינויים ממתינים</h2>
            <p className="text-gray-600">כל השינויים המבוקשים טופלו</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad: Ad) => (
              <div key={ad.id} className="bg-white rounded-lg shadow-md p-6 border-r-4 border-yellow-400">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-black">מודעה #{ad.adNumber}</h3>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        שינויים ממתינים
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📍 {ad.City?.nameHe} {ad.Street?.name && `, ${ad.Street.name}`}</div>
                      <div>📁 {ad.Category?.nameHe}</div>
                      <div>👤 {ad.User?.name || ad.User?.email}</div>
                      <div className="flex items-center gap-2 text-yellow-700 font-medium mt-2">
                        <Clock className="w-4 h-4" />
                        התקבל: {ad.pendingChangesAt ? new Date(ad.pendingChangesAt).toLocaleString('he-IL') : 'לא ידוע'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedAd(ad);
                        setShowModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      🔍 צפייה והשוואה
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(ad.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400"
                  >
                    <CheckCircle className="w-5 h-5" />
                    אשר שינויים
                  </button>
                  <button
                    onClick={() => handleReject(ad.id)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:bg-gray-400"
                  >
                    <XCircle className="w-5 h-5" />
                    דחה שינויים
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comparison Modal */}
        {showModal && selectedAd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                      <AlertTriangle className="w-7 h-7 text-yellow-600" />
                      השוואת שינויים - מודעה #{selectedAd.adNumber}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      המודעה המקורית נשארת פעילה באתר עד לאישור השינויים
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedAd(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-3xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-2">מידע על המבקש</h3>
                  <div className="text-sm space-y-1 text-blue-800">
                    <div>👤 {selectedAd.User?.name}</div>
                    <div>📧 {selectedAd.User?.email}</div>
                    {selectedAd.User?.phone && <div>📱 {selectedAd.User.phone}</div>}
                  </div>
                </div>

                {/* Changes Comparison */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    שינויים שבוצעו על ידי המשתמש
                  </h3>
                  
                  <div className="space-y-4">
                    {(() => {
                      const changes = selectedAd.pendingChanges;
                      if (!changes) {
                        return (
                          <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">לא נמצאו נתוני שינויים</p>
                            <p className="text-sm mt-2">ייתכן שיש בעיה בשמירת השינויים</p>
                          </div>
                        );
                      }
                      console.log('🔍 Pending changes data:', changes);
                      console.log('🔍 Images in pendingChanges:', changes.images);
                      console.log('🔍 Current AdImage:', selectedAd.AdImage);
                      const changedFields = [];

                      // כותרת
                      if (changes.title !== undefined && changes.title !== selectedAd.title) {
                        changedFields.push(
                          <div key="title">
                            {renderFieldComparison('📌 כותרת המודעה', selectedAd.title, changes.title)}
                          </div>
                        );
                      }

                      // תיאור
                      if (changes.description !== undefined && changes.description !== selectedAd.description) {
                        changedFields.push(
                          <div key="description">
                            {renderFieldComparison('📝 תיאור המודעה', selectedAd.description, changes.description)}
                          </div>
                        );
                      }

                      // מחיר
                      if (changes.price !== undefined && changes.price !== selectedAd.price) {
                        changedFields.push(
                          <div key="price">
                            {renderFieldComparison(
                              '💰 מחיר',
                              selectedAd.price ? `₪${selectedAd.price.toLocaleString()}` : 'לא צוין',
                              changes.price ? `₪${changes.price.toLocaleString()}` : 'לא צוין'
                            )}
                          </div>
                        );
                      }

                      // כתובת
                      if (changes.address !== undefined && changes.address !== selectedAd.address) {
                        changedFields.push(
                          <div key="address">
                            {renderFieldComparison('📍 כתובת', selectedAd.address || 'לא צוין', changes.address || 'לא צוין')}
                          </div>
                        );
                      }

                      // שכונה
                      if (changes.neighborhood !== undefined && changes.neighborhood !== selectedAd.neighborhood) {
                        changedFields.push(
                          <div key="neighborhood">
                            {renderFieldComparison('🏘️ שכונה', selectedAd.neighborhood || 'לא צוין', changes.neighborhood || 'לא צוין')}
                          </div>
                        );
                      }

                      // קטגוריה
                      if (changes.categoryId !== undefined && changes.categoryId !== selectedAd.Category?.id) {
                        changedFields.push(
                          <div key="categoryId">
                            {renderFieldComparison('📁 קטגוריה', 
                              selectedAd.Category?.nameHe || 'לא צוין', 
                              'קטגוריה חדשה (ID: ' + changes.categoryId + ')'
                            )}
                          </div>
                        );
                      }

                      // עיר
                      if (changes.cityId !== undefined && changes.cityId !== selectedAd.City?.id) {
                        changedFields.push(
                          <div key="cityId">
                            {renderFieldComparison('🏙️ עיר', 
                              selectedAd.City?.nameHe || 'לא צוין', 
                              'עיר חדשה (ID: ' + changes.cityId + ')'
                            )}
                          </div>
                        );
                      }

                      // רחוב
                      if (changes.streetId !== undefined && changes.streetId !== selectedAd.Street?.id) {
                        changedFields.push(
                          <div key="streetId">
                            {renderFieldComparison('🛣️ רחוב', 
                              selectedAd.Street?.name || 'לא צוין', 
                              'רחוב חדש (ID: ' + changes.streetId + ')'
                            )}
                          </div>
                        );
                      }

                      // תמונות
                      if (changes.images !== undefined) {
                        const currentImages = selectedAd.AdImage || [];
                        const pendingImages = Array.isArray(changes.images) ? changes.images : [];
                        const currentImageCount = currentImages.length;
                        const pendingImageCount = pendingImages.length;
                        
                        // Helper להמרת URL יחסי ל-מלא
                        const getFullImageUrl = (url: string) => {
                          if (!url) return '';
                          if (url.startsWith('data:')) return url; // base64
                          if (url.startsWith('http')) return url; // URL מלא
                          // URL יחסי
                          const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                          return `${baseUrl}${url}`;
                        };
                        
                        // השוואה - בדוק אם יש שינוי במספר התמונות או ב-URLs
                        const imagesChanged = 
                          currentImageCount !== pendingImageCount ||
                          JSON.stringify(currentImages.map((img: any) => img.url).sort()) !== 
                          JSON.stringify(pendingImages.map((img: any) => img.url).sort());
                        
                        if (imagesChanged) {
                          changedFields.push(
                            <div key="images" className="space-y-2">
                              <div className="font-medium text-gray-700">🖼️ תמונות</div>
                              <div className="grid grid-cols-2 gap-4">
                                {/* תמונות נוכחיות */}
                                <div>
                                  <div className="text-sm text-gray-600 mb-2 line-through text-red-600">
                                    נוכחי: {currentImageCount} {currentImageCount === 0 ? 'ללא תמונות' : 'תמונות'}
                                  </div>
                                  {currentImageCount > 0 ? (
                                    <div className="grid grid-cols-3 gap-1">
                                      {currentImages.slice(0, 6).map((img: any, idx: number) => (
                                        <img
                                          key={idx}
                                          src={getFullImageUrl(img.url)}
                                          alt={`תמונה ${idx + 1}`}
                                          className="w-full h-16 object-cover rounded border opacity-50"
                                        />
                                      ))}
                                      {currentImageCount > 6 && (
                                        <div className="w-full h-16 flex items-center justify-center bg-gray-200 rounded text-xs opacity-50">
                                          +{currentImageCount - 6}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 italic text-sm">אין תמונות</div>
                                  )}
                                </div>
                                
                                {/* תמונות חדשות */}
                                <div>
                                  <div className="text-sm font-bold text-green-600 mb-2">
                                    חדש: {pendingImageCount} {pendingImageCount === 0 ? 'ללא תמונות' : 'תמונות'}
                                  </div>
                                  {pendingImageCount > 0 ? (
                                    <div className="grid grid-cols-3 gap-1">
                                      {pendingImages.slice(0, 6).map((img: any, idx: number) => (
                                        <img
                                          key={idx}
                                          src={getFullImageUrl(img.url)}
                                          alt={`תמונה חדשה ${idx + 1}`}
                                          className="w-full h-16 object-cover rounded border-2 border-green-500"
                                          onError={(e) => {
                                            console.error('Image load error:', img.url);
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      ))}
                                      {pendingImageCount > 6 && (
                                        <div className="w-full h-16 flex items-center justify-center bg-green-100 rounded text-xs">
                                          +{pendingImageCount - 6}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 italic text-sm">אין תמונות</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      }

                      // ✅ השוואת customFields
                      if (changes.customFields && selectedAd.customFields) {
                        const currentCustom = selectedAd.customFields as Record<string, any>;
                        const pendingCustom = changes.customFields as Record<string, any>;

                        // קומה
                        if (pendingCustom.floor !== undefined && pendingCustom.floor !== currentCustom.floor) {
                          changedFields.push(
                            <div key="floor">
                              {renderFieldComparison('🏢 קומה', 
                                currentCustom.floor ?? 'לא צוין', 
                                pendingCustom.floor ?? 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // חדרים
                        if (pendingCustom.rooms !== undefined && pendingCustom.rooms !== currentCustom.rooms) {
                          changedFields.push(
                            <div key="rooms">
                              {renderFieldComparison('🚪 מספר חדרים', 
                                currentCustom.rooms ?? 'לא צוין', 
                                pendingCustom.rooms ?? 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // מ"ר
                        if (pendingCustom.squareMeters !== undefined && pendingCustom.squareMeters !== currentCustom.squareMeters) {
                          changedFields.push(
                            <div key="squareMeters">
                              {renderFieldComparison('📐 מ"ר', 
                                currentCustom.squareMeters ? `${currentCustom.squareMeters} מ"ר` : 'לא צוין', 
                                pendingCustom.squareMeters ? `${pendingCustom.squareMeters} מ"ר` : 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // תאריך כניסה
                        if (pendingCustom.entryDate !== undefined && pendingCustom.entryDate !== currentCustom.entryDate) {
                          changedFields.push(
                            <div key="entryDate">
                              {renderFieldComparison('📅 תאריך כניסה', 
                                currentCustom.entryDate ? new Date(currentCustom.entryDate).toLocaleDateString('he-IL') : 'לא צוין',
                                pendingCustom.entryDate ? new Date(pendingCustom.entryDate).toLocaleDateString('he-IL') : 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // מספר בית
                        if (pendingCustom.houseNumber !== undefined && pendingCustom.houseNumber !== currentCustom.houseNumber) {
                          changedFields.push(
                            <div key="houseNumber">
                              {renderFieldComparison('🏠 מספר בית', 
                                currentCustom.houseNumber || 'לא צוין', 
                                pendingCustom.houseNumber || 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // מצב הנכס
                        if (pendingCustom.condition !== undefined && pendingCustom.condition !== currentCustom.condition) {
                          const conditionLabels: Record<string, string> = {
                            'NEW': 'חדש',
                            'EXCELLENT': 'מצוין',
                            'GOOD': 'טוב',
                            'MAINTAINED': 'מתוחזק',
                            'RENOVATED': 'משופץ',
                            'NEEDS_RENOVATION': 'דרוש שיפוץ',
                            'OLD': 'ישן'
                          };
                          changedFields.push(
                            <div key="condition">
                              {renderFieldComparison('🔧 מצב הנכס', 
                                conditionLabels[currentCustom.condition] || 'לא צוין', 
                                conditionLabels[pendingCustom.condition] || 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // סוג נכס
                        if (pendingCustom.propertyType !== undefined && pendingCustom.propertyType !== currentCustom.propertyType) {
                          const propertyTypeLabels: Record<string, string> = {
                            'APARTMENT': 'דירה',
                            'HOUSE': 'בית פרטי',
                            'GARDEN_APARTMENT': 'דירת גן',
                            'PENTHOUSE': 'פנטהאוז',
                            'DUPLEX': 'דופלקס',
                            'STUDIO': 'סטודיו',
                            'COTTAGE': 'קוטג\'',
                            'VILLA': 'וילה',
                            'TOWNHOUSE': 'בית טורי'
                          };
                          changedFields.push(
                            <div key="propertyType">
                              {renderFieldComparison('🏘️ סוג נכס', 
                                propertyTypeLabels[currentCustom.propertyType] || 'לא צוין', 
                                propertyTypeLabels[pendingCustom.propertyType] || 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // ריהוט
                        if (pendingCustom.furniture !== undefined && pendingCustom.furniture !== currentCustom.furniture) {
                          const furnitureLabels: Record<string, string> = {
                            'NONE': 'ללא',
                            'PARTIAL': 'חלקי',
                            'FULL': 'מלא',
                            'FURNISHED': 'מרוהט',
                            'UNFURNISHED': 'לא מרוהט'
                          };
                          changedFields.push(
                            <div key="furniture">
                              {renderFieldComparison('🛋️ ריהוט', 
                                furnitureLabels[currentCustom.furniture] || 'לא צוין', 
                                furnitureLabels[pendingCustom.furniture] || 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // ארנונה
                        if (pendingCustom.arnona !== undefined && pendingCustom.arnona !== currentCustom.arnona) {
                          changedFields.push(
                            <div key="arnona">
                              {renderFieldComparison('💵 ארנונה', 
                                currentCustom.arnona ? `₪${currentCustom.arnona}` : 'לא צוין', 
                                pendingCustom.arnona ? `₪${pendingCustom.arnona}` : 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // ועד בית
                        if (pendingCustom.vaad !== undefined && pendingCustom.vaad !== currentCustom.vaad) {
                          changedFields.push(
                            <div key="vaad">
                              {renderFieldComparison('🏢 ועד בית', 
                                currentCustom.vaad ? `₪${currentCustom.vaad}` : 'לא צוין', 
                                pendingCustom.vaad ? `₪${pendingCustom.vaad}` : 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // שם איש קשר מ-customFields
                        if (pendingCustom.contactName !== undefined && pendingCustom.contactName !== currentCustom.contactName) {
                          changedFields.push(
                            <div key="customContactName">
                              {renderFieldComparison('👤 שם איש קשר (מפרטי נכס)', 
                                currentCustom.contactName || 'לא צוין', 
                                pendingCustom.contactName || 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // טלפון מ-customFields
                        if (pendingCustom.contactPhone !== undefined && pendingCustom.contactPhone !== currentCustom.contactPhone) {
                          changedFields.push(
                            <div key="customContactPhone">
                              {renderFieldComparison('📱 טלפון (מפרטי נכס)', 
                                currentCustom.contactPhone || 'לא צוין', 
                                pendingCustom.contactPhone || 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // תוספת כתובת
                        if (pendingCustom.addressSupplement !== undefined && pendingCustom.addressSupplement !== currentCustom.addressSupplement) {
                          changedFields.push(
                            <div key="addressSupplement">
                              {renderFieldComparison('📍 תוספת לכתובת', 
                                currentCustom.addressSupplement || 'לא צוין', 
                                pendingCustom.addressSupplement || 'לא צוין'
                              )}
                            </div>
                          );
                        }

                        // מאפיינים (features)
                        if (pendingCustom.features && currentCustom.features) {
                          const currentFeatures = currentCustom.features as Record<string, boolean>;
                          const pendingFeatures = pendingCustom.features as Record<string, boolean>;
                          
                          const featureLabels: Record<string, string> = {
                            elevator: 'מעלית',
                            parking: 'חניה',
                            storage: 'מחסן',
                            balcony: 'מרפסת',
                            yard: 'חצר',
                            airConditioning: 'מיזוג אוויר',
                            view: 'נוף',
                            housingUnit: 'יחידת דיור',
                            safeRoom: 'ממ"ד',
                            parentalUnit: 'יחידת הורים',
                            sukkaBalcony: 'מרפסת סוכה',
                            plata: 'פלטה',
                            urn: 'מיחם',
                            linens: 'מצעים',
                            pool: 'בריכה',
                            kidsGames: 'משחקי ילדים',
                            babyBed: 'מיטת תינוק',
                            masterUnit: 'יחידת הורים',
                            sleepingOnly: 'לינה בלבד',
                            hasOption: 'אופציה',
                            mamad: 'ממ"ד'
                          };

                          // בדיקה של כל השדות שקיימים
                          const allFeatureKeys = new Set([...Object.keys(currentFeatures), ...Object.keys(pendingFeatures)]);

                          allFeatureKeys.forEach(feature => {
                            const label = featureLabels[feature] || feature;
                            const currentValue = currentFeatures[feature] ?? false;
                            const pendingValue = pendingFeatures[feature] ?? false;
                            
                            if (pendingValue !== currentValue) {
                              changedFields.push(
                                <div key={`feature-${feature}`}>
                                  {renderFieldComparison(
                                    `✨ ${label}`, 
                                    currentValue ? '✓ כן' : '✗ לא',
                                    pendingValue ? '✓ כן' : '✗ לא'
                                  )}
                                </div>
                              );
                            }
                          });
                        }
                      }

                      if (changedFields.length === 0) {
                        return (
                          <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">לא זוהו שינויים בשדות הבסיסיים</p>
                            <p className="text-sm mt-2">ייתכן ששדות מתקדמים אחרים השתנו (customFields, קטגוריה, עיר וכו')</p>
                            <details className="mt-4">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                                הצג נתונים גולמיים
                              </summary>
                              <pre className="text-xs mt-2 text-right bg-white p-3 rounded border overflow-auto max-h-60">
                                {JSON.stringify(changes, null, 2)}
                              </pre>
                            </details>
                          </div>
                        );
                      }

                      return changedFields;
                    })()}
                  </div>
                </div>

                {/* Rejection Reason Input */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סיבת דחייה (אופציונלי)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="הוסף הסבר למה השינויים נדחו..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    maxLength={250}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {rejectionReason.length}/250 תווים
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedAd.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold text-lg disabled:bg-gray-400"
                  >
                    <CheckCircle className="w-6 h-6" />
                    אשר והחל שינויים
                  </button>
                  <button
                    onClick={() => handleReject(selectedAd.id)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold text-lg disabled:bg-gray-400"
                  >
                    <XCircle className="w-6 h-6" />
                    דחה שינויים
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedAd(null);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold text-lg"
                  >
                    ביטול
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
