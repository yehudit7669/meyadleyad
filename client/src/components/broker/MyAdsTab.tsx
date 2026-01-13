import React from 'react';
import { useBrokerAds } from '../../hooks/useBroker';
import { Link } from 'react-router-dom';

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'פעילה', color: 'bg-green-100 text-green-800' },
  PENDING: { label: 'ממתינה', color: 'bg-yellow-100 text-yellow-800' },
  DRAFT: { label: 'טיוטה', color: 'bg-gray-100 text-gray-800' },
  REMOVED: { label: 'הוסרה', color: 'bg-red-100 text-red-800' },
  REJECTED: { label: 'נדחתה', color: 'bg-red-100 text-red-800' },
};

const MyAdsTab: React.FC = () => {
  const { data: ads = [], isLoading } = useBrokerAds();

  if (isLoading) {
    return <div className="text-center py-8">טוען מודעות...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">המודעות שלי</h2>
        <Link
          to="/post-ad"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + פרסם מודעה חדשה
        </Link>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">אין לך מודעות עדיין</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ads.map((ad: any) => (
            <div
              key={ad.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {ad.AdImage?.[0] && (
                  <img
                    src={ad.AdImage[0].url}
                    alt={ad.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{ad.title}</h3>
                      <p className="text-sm text-gray-600">
                        מס׳ סידורי: #{ad.adNumber}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${statusLabels[ad.status]?.color || 'bg-gray-100 text-gray-800'}`}
                    >
                      {statusLabels[ad.status]?.label || ad.status}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    {ad.Category && <span>📁 {ad.Category.nameHe}</span>}
                    {ad.City && <span>📍 {ad.City.nameHe}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/ad/${ad.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      צפה במודעה
                    </Link>
                    {(ad.status === 'ACTIVE' || ad.status === 'PENDING') && (
                      <Link
                        to={`/edit-ad/${ad.id}`}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        ערוך
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAdsTab;