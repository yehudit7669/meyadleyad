import React, { useState } from 'react';
import { useUpdateCommunication } from '../../hooks/useBroker';
import { BrokerProfile } from '../../services/brokerService';

interface Props {
  profile: BrokerProfile;
}

const CommunicationTab: React.FC<Props> = ({ profile }) => {
  const [weeklyDigest, setWeeklyDigest] = useState(profile.user.weeklyDigestOptIn || false);
  const updateCommunication = useUpdateCommunication();

  const handleSave = async () => {
    await updateCommunication.mutateAsync({
      weeklyDigestOptIn: weeklyDigest,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">תקשורת ודיוור</h2>

      <div className="space-y-6">
        {/* Weekly Digest */}
        <div className="border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              id="weeklyDigest"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
              className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="weeklyDigest" className="font-medium text-gray-900 cursor-pointer">
                אני רוצה לקבל את מאגר הדירות השבועי במייל
              </label>
              <p className="text-sm text-gray-600 mt-1">
                קבל סיכום שבועי של נכסים חדשים ומעניינים ישירות למייל
              </p>
            </div>
          </div>
        </div>

        {/* Unsubscribe */}
        <div className="border rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-2">ביטול מנוי</h3>
          <p className="text-sm text-gray-600 mb-4">
            אם ברצונך להסיר את עצמך מכל רשימות התפוצה, בטל את הסימון למעלה ושמור.
          </p>
          <p className="text-xs text-gray-500">
            שים לב: הסרה מרשימת התפוצה תמנע ממך לקבל עדכונים חשובים על המערכת.
          </p>
        </div>

        {/* Save Button */}
        {weeklyDigest !== profile.user.weeklyDigestOptIn && (
          <button
            onClick={handleSave}
            disabled={updateCommunication.isPending}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {updateCommunication.isPending ? 'שומר...' : 'שמור העדפות'}
          </button>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          📧 כתובת המייל שלך: <strong>{profile.user.email}</strong>
        </p>
      </div>
    </div>
  );
};

export default CommunicationTab;