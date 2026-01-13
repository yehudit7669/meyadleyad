import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/api';
import NewsletterFilters from './NewsletterFilters';

export default function CommunicationPrefsTab() {
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: profileService.getPreferences,
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
      <h2 className="text-lg font-semibold mb-6">העדפות תקשורת</h2>

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
            className="w-5 h-5 text-blue-600 rounded mt-1"
          />
          <div className="flex-1">
            <label htmlFor="notifyNewMatches" className="block font-medium text-gray-900 cursor-pointer">
              קבלת התראות על נכסים חדשים
            </label>
            <p className="text-sm text-gray-600 mt-1">
              קבל התראות מיידיות בדוא״ל כשמתפרסמות מודעות התואמות להעדפות שלך
            </p>
            {preferences?.notifyNewMatches && !preferences?.weeklyDigest && (
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
              {preferences.filters.categories && preferences.filters.categories.length > 0 && (
                <div>
                  <span className="font-medium">קטגוריות:</span> {preferences.filters.categories.length} נבחרו
                </div>
              )}
              {preferences.filters.regions && preferences.filters.regions.length > 0 && (
                <div>
                  <span className="font-medium">אזורים:</span> {preferences.filters.regions.length} נבחרו
                </div>
              )}
              {preferences.filters.priceRange && (
                <div>
                  <span className="font-medium">טווח מחירים:</span>{' '}
                  {preferences.filters.priceRange.min || 'ללא'} - {preferences.filters.priceRange.max || 'ללא'}
                </div>
              )}
              {preferences.filters.publisherType && (
                <div>
                  <span className="font-medium">סוג מפרסם:</span>{' '}
                  {preferences.filters.publisherType === 'OWNER' ? 'בעלים בלבד' : 'מתווכים בלבד'}
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
