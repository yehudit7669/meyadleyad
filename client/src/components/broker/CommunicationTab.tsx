import React from 'react';
import { useUpdateCommunication } from '../../hooks/useBroker';
import { BrokerProfile } from '../../services/brokerService';

interface Props {
  profile: BrokerProfile;
}

const CommunicationTab: React.FC<Props> = ({ profile }) => {
  const updateCommunication = useUpdateCommunication();

  const handleToggleDigest = async () => {
    await updateCommunication.mutateAsync({
      weeklyDigestOptIn: !profile.user.weeklyDigestOptIn,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">תקשורת ודיוור</h2>

      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">קובץ התוכן השבועי</h3>
            <p className="text-gray-700 mb-4">
              קבל עדכון שבועי במייל עם התכנים החדשים, טיפים ומידע שימושי למתווכים
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.user.weeklyDigestOptIn}
                onChange={handleToggleDigest}
                disabled={updateCommunication.isPending}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium">
                {profile.user.weeklyDigestOptIn
                  ? 'אני מקבל את הקובץ השבועי'
                  : 'אני רוצה לקבל את הקובץ השבועי'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {profile.user.weeklyDigestOptIn && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">ביטול מנוי</h3>
          <p className="text-gray-700 mb-4">
            לא רוצה לקבל יותר את הקובץ השבועי? תוכל לבטל בכל עת
          </p>
          <button
            onClick={handleToggleDigest}
            disabled={updateCommunication.isPending}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            הסירו אותי מרשימת התפוצה
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunicationTab;