import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/api';
import NewsletterFilters from './NewsletterFilters';

interface ProfileHeaderProps {
  userName?: string;
}

export default function ProfileHeader({ userName }: ProfileHeaderProps) {
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);

  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: profileService.getPreferences,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: profileService.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  const handleOptInChange = (optIn: boolean) => {
    updatePreferencesMutation.mutate({ weeklyDigest: optIn });
  };

  const greeting = userName ? `ברוך הבא, ${userName}` : 'ברוך הבא';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {greeting}
      </h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              רוצה לקבל את קובץ התוכן השבועי?
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              קבל עדכונים שבועיים על נכסים חדשים המתאימים להעדפות שלך
            </p>

            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="weeklyDigest"
                  checked={preferences?.weeklyDigest === true}
                  onChange={() => handleOptInChange(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">כן, שלחו לי עדכונים</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="weeklyDigest"
                  checked={preferences?.weeklyDigest === false}
                  onChange={() => handleOptInChange(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">אל תשלחו עדכונים</span>
              </label>
            </div>

            <button
              onClick={() => setShowFilters(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ⚙️ בחירת מסננים להתאמה אישית
            </button>
          </div>
        </div>

        {updatePreferencesMutation.isSuccess && (
          <div className="mt-3 text-sm text-green-600">
            ✓ ההעדפות שלך נשמרו בהצלחה
          </div>
        )}

        {updatePreferencesMutation.isError && (
          <div className="mt-3 text-sm text-red-600">
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
