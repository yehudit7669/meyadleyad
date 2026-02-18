import React from 'react';

interface WantedCommercialWizardData {
  step1?: any;
  step2?: any;
  step3?: any;
  step4?: any;
  step5?: any;
}

interface Props {
  wizardData: Partial<WantedCommercialWizardData>;
  onSubmit: (sendCopyToEmail: boolean) => void;
  onPrev: () => void;
  isLoading?: boolean;
}

const WantedCommercialPreview: React.FC<Props> = ({ wizardData, onSubmit, onPrev, isLoading }) => {
  const step1 = wizardData.step1;
  const step2 = wizardData.step2;
  const step3 = wizardData.step3;
  const step4 = wizardData.step4;
  const step5 = wizardData.step5;

  const [sendCopyToEmail, setSendCopyToEmail] = React.useState(false);

  const handleSubmit = () => {
    console.log('🎯 Preview handleSubmit called');
    console.log('Wizard data:', wizardData);
    onSubmit(sendCopyToEmail);
  };

  const getTransactionTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      FOR_RENT: 'להשכרה',
      FOR_SALE: 'למכירה',
    };
    return types[type || ''] || type || '';
  };

  const getBrokerTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      WITH_BROKER: 'עם תיווך',
      WITHOUT_BROKER: 'ללא תיווך',
    };
    return types[type || ''] || type || '';
  };

  const getCommercialTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      STORE: 'חנות',
      CLINIC: 'קליניקה',
      WAREHOUSE: 'מחסן',
      GALLERY: 'גלריה',
      OFFICE: 'משרד',
      OPERATIONAL_SPACE: 'שטח תפעולי',
      HANGAR: 'האנגר',
      SHOWROOM: 'אולם תצוגה',
    };
    return types[type || ''] || type || '';
  };

  const getEntryDateLabel = (entryDate?: any) => {
    if (!entryDate) return 'לא צוין';
    if (entryDate.type === 'immediate') return 'מיידי';
    if (entryDate.type === 'flexible') return 'גמיש';
    if (entryDate.type === 'specific' && entryDate.specificDate) {
      return new Date(entryDate.specificDate).toLocaleDateString('he-IL');
    }
    return 'לא צוין';
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1F3F3A] mb-2">תצוגה מקדימה</h2>
        <p className="text-gray-600">בדוק את הפרטים לפני פרסום המודעה</p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Transaction & Broker Type */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>📋</span> סוג עסקה
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">עסקה:</span>
                <span className="font-semibold text-gray-900">{getTransactionTypeLabel(step1?.transactionType)}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">תיווך:</span>
                <span className="font-semibold text-gray-900">{getBrokerTypeLabel(step2?.brokerType)}</span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>📍</span> כתובת הנכס
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-lg font-semibold text-gray-900">
                {step3?.streetName 
                  ? `${step3.streetName} ${step3.houseNumber || ''}`
                  : step3?.neighborhoodName || 'לא צוין'}
                {step3?.addressSupplement ? `, ${step3.addressSupplement}` : ''}
              </p>
              <p className="text-gray-600 mt-1">
                {step3?.neighborhoodName && step3.streetName ? `שכונת ${step3.neighborhoodName}, ` : ''}
                {step3?.cityName || 'לא צוין'}
              </p>
            </div>
          </div>

          {/* Property Details */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>🏢</span> פרטי הנכס
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-900">{getCommercialTypeLabel(step4?.commercialType)}</div>
                <div className="text-sm text-gray-600">סוג נכס</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-900">{step4?.area !== undefined ? step4.area : 'לא צוין'}</div>
                <div className="text-sm text-gray-600">מ"ר</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-900">
                  {step4?.floor !== undefined && step4.floor !== null
                    ? (step4.floor === 0 
                        ? 'קרקע' 
                        : step4.floor)
                    : 'לא צוין'}
                </div>
                <div className="text-sm text-gray-600">קומה</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">תאריך כניסה:</span>
                <span className="font-semibold text-gray-900">{getEntryDateLabel(step4?.entryDate)}</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>💰</span> מחיר ותשלומים
            </h3>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 mb-3">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">מחיר</div>
                <div className="text-3xl font-bold text-green-700">
                  {step4?.price ? `₪${step4.price.toLocaleString('he-IL')}` : 'לא צוין'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">ארנונה:</span>
                <span className="font-semibold text-gray-900">
                  {step4?.arnona ? `₪${step4.arnona.toLocaleString('he-IL')}` : 'לא צוין'}
                </span>
              </div>
            </div>
          </div>

          {/* Features */}
          {step4?.features && Object.values(step4.features).some(value => value) && (
            <div className="border-b pb-4">
              <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
                <span>✨</span> מאפיינים
              </h3>
              <div className="flex flex-wrap gap-2">
                {step4.features.parking && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🚗 חניה</span>
                )}
                {step4.features.warehouse && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">📦 מחסן</span>
                )}
                {step4.features.gallery && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🖼️ גלריה</span>
                )}
                {step4.features.airConditioning && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">❄️ מיזוג</span>
                )}
                {step4.features.kitchenette && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🍽️ מטבחון</span>
                )}
                {step4.features.mamad && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🏠 ממ״ד</span>
                )}
                {step4.features.restrooms && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🚻 שירותים</span>
                )}
                {step4.features.yard && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🌳 חצר</span>
                )}
                {step4.features.elevator && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🛗 מעלית</span>
                )}
                {step4.features.accessibility && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">♿ נגישות</span>
                )}
                {step4.features.streetDisplay && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🪟 ויטרינה</span>
                )}
                {step4.features.internet && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🌐 אינטרנט</span>
                )}
                {step4.features.renovated && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">✨ משופץ</span>
                )}
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>📞</span> פרטי התקשרות
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {step5?.contactName && (
                <p className="text-gray-900 font-medium mb-1">👤 {step5.contactName}</p>
              )}
              <p className="text-gray-900 font-medium">📱 {step5?.contactPhone || 'לא צוין'}</p>
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

      {/* Navigation */}
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

export default WantedCommercialPreview;
