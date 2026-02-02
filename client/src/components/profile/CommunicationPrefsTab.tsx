import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/api';
import NewsletterFilters from './NewsletterFilters';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface NotificationStatus {
  canReceive: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  globalEnabled: boolean;
  override: any;
}

export default function CommunicationPrefsTab() {
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: profileService.getPreferences,
  });

  // Get notification status (blocking info)
  const { data: notificationStatus } = useQuery<NotificationStatus>({
    queryKey: ['notificationStatus'],
    queryFn: async (): Promise<NotificationStatus> => {
      const res = await axios.get(`${API_URL}/notifications/my-status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data as NotificationStatus;
    },
  });

  const updateMutation = useMutation({
    mutationFn: profileService.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  const handleToggle = (field: 'weeklyDigest' | 'notifyNewMatches', value: boolean) => {
    updateMutation.mutate({ [field]: value });
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold mb-6 text-gray-900">העדפות תקשורת</h2>

      <div className="bg-white border rounded-lg p-6 space-y-6">
        {/* Weekly Digest */}
        <div className="flex items-start gap-4 pb-6 border-b">
          <input
            type="checkbox"
            id="weeklyDigest"
            checked={preferences?.weeklyDigest || false}
            onChange={(e) => handleToggle('weeklyDigest', e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded mt-1"
          />
          <div className="flex-1">
            <label htmlFor="weeklyDigest" className="block font-medium text-gray-900 cursor-pointer">
              קבלת קובץ התוכן השבועי
            </label>
            <p className="text-sm text-gray-600 mt-1">
              קבל עדכון שבועי עם מודעות חדשות המתאימות להעדפות שלך
            </p>
            {preferences?.weeklyDigest && (
              <button
                onClick={() => setShowFilters(true)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ⚙️ הגדר מסננים
              </button>
            )}
          </div>
        </div>

        {/* New Matches Notifications */}
        <div className="flex items-start gap-4 pb-6 border-b">
          <input
            type="checkbox"
            id="notifyNewMatches"
            checked={preferences?.notifyNewMatches || false}
            onChange={(e) => handleToggle('notifyNewMatches', e.target.checked)}
            disabled={!notificationStatus?.canReceive}
            className="w-5 h-5 text-blue-600 rounded mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex-1">
            <label htmlFor="notifyNewMatches" className="block font-medium text-gray-900 cursor-pointer">
              קבלת התראות על נכסים חדשים
            </label>
            <p className="text-sm text-gray-600 mt-1">
              קבל התראות מיידיות בדוא״ל כשמתפרסמות מודעות התואמות להעדפות שלך
            </p>
            
            {/* Blocked by Admin (BLOCK override) */}
            {notificationStatus?.isBlocked && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 text-lg">🚫</span>
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      אינך יכול לקבל התראות על נכסים חדשים
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {notificationStatus.blockReason}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Disabled Globally (but user doesn't have ALLOW override) */}
            {!notificationStatus?.isBlocked && !notificationStatus?.canReceive && !notificationStatus?.globalEnabled && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      התראות מושבתות כרגע על ידי מנהל המערכת
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      לא ניתן להפעיל התראות עד שהמנהל יפעיל אותן מחדש
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {notificationStatus?.canReceive && preferences?.notifyNewMatches && !preferences?.weeklyDigest && (
              <button
                onClick={() => setShowFilters(true)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ⚙️ הגדר מסננים
              </button>
            )}
          </div>
        </div>

        {/* Current Filters Summary */}
        {(preferences?.weeklyDigest || preferences?.notifyNewMatches) && preferences?.filters && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">המסננים הנוכחיים שלך:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              {preferences.filters.categoryIds && preferences.filters.categoryIds.length > 0 && (
                <div>
                  <span className="font-medium">קטגוריות:</span> {preferences.filters.categoryIds.length} נבחרו
                </div>
              )}
              {preferences.filters.cityIds && preferences.filters.cityIds.length > 0 && (
                <div>
                  <span className="font-medium">ערים:</span> {preferences.filters.cityIds.length} נבחרו
                </div>
              )}
              {(preferences.filters.minPrice || preferences.filters.maxPrice) && (
                <div>
                  <span className="font-medium">טווח מחירים:</span>{' '}
                  {preferences.filters.minPrice ? `מ-₪${preferences.filters.minPrice.toLocaleString()}` : 'ללא מינימום'} - {preferences.filters.maxPrice ? `עד ₪${preferences.filters.maxPrice.toLocaleString()}` : 'ללא מקסימום'}
                </div>
              )}
              {preferences.filters.propertyTypes && preferences.filters.propertyTypes.length > 0 && (
                <div>
                  <span className="font-medium">סוגי נכס:</span> {preferences.filters.propertyTypes.length} נבחרו
                </div>
              )}
              {preferences.filters.publisherTypes && preferences.filters.publisherTypes.length > 0 && (
                <div>
                  <span className="font-medium">סוג מפרסם:</span>{' '}
                  {preferences.filters.publisherTypes.map((t: string) => t === 'OWNER' ? 'בעלים' : 'מתווכים').join(', ')}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ערוך מסננים
            </button>
          </div>
        )}

        {updateMutation.isSuccess && (
          <div className="text-sm text-green-600">
            ✓ ההעדפות שלך נשמרו בהצלחה
          </div>
        )}

        {updateMutation.isError && (
          <div className="text-sm text-red-600">
            ✗ שגיאה בשמירת ההעדפות
          </div>
        )}
      </div>

      {showFilters && (
        <NewsletterFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          currentFilters={preferences?.filters || {}}
        />
      )}
    </div>
  );
}
