import React, { useState } from 'react';
import { useBrokerAds } from '../../hooks/useBroker';
import { useAuth } from '../../hooks/useAuth';

const ShareTab: React.FC = () => {
  const { data: ads, isLoading } = useBrokerAds();
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const baseUrl = window.location.origin;
  const brokerPageUrl = `${baseUrl}/brokers/${user?.id}`;

  const handleCopyBrokerLink = async () => {
    try {
      await navigator.clipboard.writeText(brokerPageUrl);
      setCopiedId('broker-page');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (adId: number, method: 'whatsapp' | 'email' | 'copy') => {
    const adUrl = `${baseUrl}/ads/${adId}`;
    
    switch (method) {
      case 'whatsapp':
        const whatsappText = encodeURIComponent(`בוא לראות את המודעה הזו: ${adUrl}`);
        window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
        break;
      
      case 'email':
        const subject = encodeURIComponent('מודעה מעניינת');
        const body = encodeURIComponent(`היי,\n\nמצאתי מודעה שעשויה לעניין אותך:\n${adUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        break;
      
      case 'copy':
        navigator.clipboard.writeText(adUrl).then(() => {
          setCopiedId(adId.toString());
          setTimeout(() => setCopiedId(null), 2000);
        });
        break;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">שיתוף קל</h2>

      {/* Broker Page Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          🔗 קישור קבוע לעמוד האישי שלך
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={brokerPageUrl}
            readOnly
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm"
          />
          <button
            onClick={handleCopyBrokerLink}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            {copiedId === 'broker-page' ? '✓ הועתק!' : 'העתק קישור'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          שתף קישור זה כדי להציג את כל המודעות שלך ופרטי העסק
        </p>
      </div>

      {/* Ads List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">שתף מודעות</h3>
        
        {!ads || ads.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">אין מודעות פעילות לשיתוף</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {ad.AdImage && ad.AdImage[0] && (
                        <img
                          src={ad.AdImage[0].url}
                          alt={ad.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">{ad.title}</h4>
                        <div className="text-sm text-gray-500 space-x-2 space-x-reverse">
                          <span>#{ad.adNumber}</span>
                          {ad.Category && <span>• {ad.Category.nameHe}</span>}
                          {ad.City && <span>• {ad.City.nameHe}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShare(parseInt(ad.id), 'whatsapp')}
                      title="שתף בוואטסאפ"
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </button>

                    <button
                      onClick={() => handleShare(parseInt(ad.id), 'email')}
                      title="שתף במייל"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleShare(parseInt(ad.id), 'copy')}
                      title="העתק קישור"
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      {copiedId === ad.id ? (
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareTab;
