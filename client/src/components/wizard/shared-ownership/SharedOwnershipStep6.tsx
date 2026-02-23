import React from 'react';
import { SharedOwnershipWizardData } from '../../../types/wizard';

interface Props {
  wizardData: Partial<SharedOwnershipWizardData>;
  onSubmit: (sendCopyToEmail: boolean) => void;
  onPrev: () => void;
  isLoading?: boolean;
}

const SharedOwnershipStep6: React.FC<Props> = ({ wizardData, onSubmit, onPrev, isLoading }) => {
  const step1 = wizardData.step1;
  const step2 = wizardData.step2;
  const step3 = wizardData.step3;
  const step4 = wizardData.step4;
  const step5 = wizardData.step5;

  const [sendCopyToEmail, setSendCopyToEmail] = React.useState(false);

  const handleSubmit = () => {
    console.log('🎯 Step6 handleSubmit called');
    console.log('Wizard data:', wizardData);
    onSubmit(sendCopyToEmail);
  };

  const getPropertyTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      APARTMENT: 'דירה',
      DUPLEX: 'דופלקס',
      TWO_STORY: 'דו קומתי',
      SEMI_DETACHED: 'דו משפחתי',
      GARDEN_APARTMENT: 'דירת גן',
      PRIVATE_HOUSE: 'בית פרטי',
      UNIT: 'יחידת דיור',
    };
    return types[type || ''] || type || '';
  };

  const getConditionLabel = (condition?: string) => {
    const conditions: Record<string, string> = {
      NEW_FROM_CONTRACTOR: 'חדש מקבלן',
      NEW: 'חדש',
      RENOVATED: 'משופץ',
      MAINTAINED: 'מתוחזק',
      OLD: 'ישן',
    };
    return conditions[condition || ''] || condition || '';
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1F3F3A] mb-2">תצוגה מקדימה</h2>
        <p className="text-gray-600">בדוק את הפרטים לפני פרסום המודעה</p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
        {step4?.images && step4.images.length > 0 && (
          <div className="relative h-64 bg-gray-100">
            <img 
              src={step4.images[0].url} 
              alt="תמונה ראשית" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
              📷 {step4.images.length} תמונות
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>📍</span> כתובת הנכס
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-lg font-semibold text-gray-900">
                {step2?.streetName 
                  ? `${step2.streetName} ${step2.houseNumber || ''}`
                  : step2?.neighborhoodName || 'לא צוין'}
                {step2?.addressSupplement ? `, ${step2.addressSupplement}` : ''}
              </p>
              <p className="text-gray-600 mt-1">
                {step2?.neighborhoodName && step2.streetName ? `שכונת ${step2.neighborhoodName}, ` : ''}
                {step2?.cityName || 'לא צוין'}
              </p>
            </div>
          </div>

          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>🏠</span> פרטי הנכס
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-900">{step3?.rooms || 'לא צוין'}</div>
                <div className="text-sm text-gray-600">חדרים</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-900">{step3?.squareMeters !== undefined ? step3.squareMeters : 'לא צוין'}</div>
                <div className="text-sm text-gray-600">מ"ר</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-900">
                  {step3?.floor !== undefined && step3.floor !== null
                    ? (step3.floor === 0 
                        ? 'קרקע' 
                        : step3.floor === 'ללא' 
                          ? 'ללא' 
                          : step3.floor)
                    : 'לא צוין'}
                </div>
                <div className="text-sm text-gray-600">קומה</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">סוג נכס:</span>
                <span className="font-semibold text-gray-900">{getPropertyTypeLabel(step3?.propertyType)}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">מצב:</span>
                <span className="font-semibold text-gray-900">{getConditionLabel(step3?.condition)}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">מרפסות:</span>
                <span className="font-semibold text-gray-900">{step3?.balconies !== undefined ? step3.balconies : 'לא צוין'}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">תאריך כניסה:</span>
                <span className="font-semibold text-gray-900">{step3?.entryDate || 'לא צוין'}</span>
              </div>
            </div>
          </div>

          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>💰</span> מחיר ותשלומים
            </h3>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 mb-3">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">מחיר מבוקש</div>
                <div className="text-3xl font-bold text-green-700">
                  ₪{step3?.priceRequested?.toLocaleString('he-IL') || ''}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">ארנונה ועד בית:</span>
                <span className="font-semibold text-gray-900">₪{step3?.arnona?.toLocaleString('he-IL') || '0'}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">ועד בית:</span>
                <span className="font-semibold text-gray-900">₪{step3?.vaad?.toLocaleString('he-IL') || '0'}</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 rounded">
                <span className="text-gray-600">הון עצמי דרוש:</span>
                <span className="font-semibold text-gray-900">₪{step3?.requiredEquity?.toLocaleString('he-IL') || ''}</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 rounded">
                <span className="text-gray-600">מספר שותפים:</span>
                <span className="font-semibold text-gray-900">{step3?.numberOfPartners || 'לא צוין'}</span>
              </div>
            </div>
          </div>

          {step3?.features && Object.values(step3.features).some(value => value) && (
            <div className="border-b pb-4">
              <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
                <span>✨</span> מאפיינים
              </h3>
              <div className="flex flex-wrap gap-2">
                {step3.features.parking && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🚗 חניה</span>
                )}
                {step3.features.elevator && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🛗 מעלית</span>
                )}
                {step3.features.safeRoom && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🏠 ממ״ד</span>
                )}
                {step3.features.storage && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">📦 מחסן</span>
                )}
                {step3.features.view && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🌄 נוף</span>
                )}
                {step3.features.airConditioning && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">❄️ מיזוג</span>
                )}
                {step3.features.sukkaBalcony && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🏠 מרפסת סוכה</span>
                )}
                {step3.features.parentalUnit && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">👨‍👩‍👧 יחידת הורים</span>
                )}
                {step3.features.yard && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🌳 חצר</span>
                )}
                {step3.features.garden && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🌺 גינה</span>
                )}
                {step3.features.frontFacing && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🏢 חזית</span>
                )}
                {step3.features.upgradedKitchen && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">👨‍🍳 מטבח משודרג</span>
                )}
                {step3.features.accessibleForDisabled && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">♿ נגיש לנכים</span>
                )}
              </div>
            </div>
          )}

          {step4?.description && (
            <div className="border-b pb-4">
              <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
                <span>📝</span> תיאור
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{step4.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>📞</span> פרטי התקשרות
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {step5?.contactName && (
                <p className="text-gray-900 font-medium mb-1">👤 {step5.contactName}</p>
              )}
              <p className="text-gray-900 font-medium">📱 {step5?.contactPhone || 'לא צוין'}</p>
              <p className="text-sm text-gray-600 mt-2">
                {step1?.hasBroker ? '🤝 דרך תיווך' : '🏠 ללא תיווך'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Send Copy to Email Checkbox */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={sendCopyToEmail}
            onChange={(e) => setSendCopyToEmail(e.target.checked)}
            className="mt-1 ml-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex-1">
            <span className="font-medium text-gray-900">
              שלח לי את המודעה שלי במייל כקובץ PDF
            </span>
            <p className="text-sm text-gray-600 mt-1">
              קבל עותק דיגיטלי של המודעה שפרסמת - נוח לשמירה ושיתוף
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrev}
          disabled={isLoading}
          className="px-6 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-[#1F3F3A] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← הקודם
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-8 py-3 bg-[#C9A24D] text-[#1F3F3A] rounded-lg font-bold hover:bg-[#B08C3C] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'מפרסם...' : 'פרסם מודעה 🚀'}
        </button>
      </div>
    </div>
  );
};

export default SharedOwnershipStep6;
