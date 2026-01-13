import React, { useState } from 'react';
import { useBrokerAds, useCreateFeaturedRequest } from '../../hooks/useBroker';

const FeaturedRequestTab: React.FC = () => {
  const { data: ads = [] } = useBrokerAds();
  const createRequest = useCreateFeaturedRequest();
  const [selectedAdId, setSelectedAdId] = useState('');
  const [notes, setNotes] = useState('');

  const activeAds = ads.filter((ad: any) => ad.status === 'ACTIVE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdId) {
      alert('נא לבחור מודעה');
      return;
    }

    await createRequest.mutateAsync({ adId: selectedAdId, notes });
    setSelectedAdId('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">בקשת הדגשה</h2>
        <p className="text-gray-600">
          בקש להדגיש אחת מהמודעות שלך. הבקשה תטופל על ידי מנהל.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            בחר מודעה להדגשה *
          </label>
          <select
            value={selectedAdId}
            onChange={(e) => setSelectedAdId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">-- בחר מודעה --</option>
            {activeAds.map((ad: any) => (
              <option key={ad.id} value={ad.id}>
                #{ad.adNumber} - {ad.title}
              </option>
            ))}
          </select>
          {activeAds.length === 0 && (
            <p className="text-sm text-red-600 mt-1">
              אין לך מודעות פעילות כרגע. פרסם מודעה תחילה.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הערות (אופציונלי)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="ספר למנהל מדוע מודעה זו ראויה להדגשה..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {notes.length}/500 תווים
          </p>
        </div>

        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            ⭐ <strong>שים לב:</strong> ניתן להדגיש מודעה אחת בלבד בכל פעם. המודעה המודגשת תקבל חשיפה מיוחדת בדף הבית ובתוצאות החיפוש.
          </p>
        </div>

        <button
          type="submit"
          disabled={createRequest.isPending || activeAds.length === 0}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 font-semibold"
        >
          {createRequest.isPending ? 'שולח בקשה...' : '⭐ שלח בקשה להדגשה'}
        </button>
      </form>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-3">מה כולל הדגשה?</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>הצגה בולטת בדף הבית</li>
          <li>סימון מיוחד בתוצאות החיפוש</li>
          <li>חשיפה מוגברת למעוניינים</li>
          <li>עדיפות בהודעות שבועיות</li>
        </ul>
      </div>
    </div>
  );
};

export default FeaturedRequestTab;
