import React from 'react';
import { HolidayRentWizardData } from '../../../types/wizard';

interface Props {
  wizardData: Partial<HolidayRentWizardData>;
  onSubmit: (sendCopyToEmail: boolean) => void;
  onPrev: () => void;
  isLoading?: boolean;
}

const HolidayRentStep5: React.FC<Props> = ({ wizardData, onSubmit, onPrev, isLoading }) => {
  const step1 = wizardData.step1;
  const step2 = wizardData.step2;
  const step3 = wizardData.step3;
  const step4 = wizardData.step4;

  const [sendCopyToEmail, setSendCopyToEmail] = React.useState(false);

  const handleSubmit = () => {
    onSubmit(sendCopyToEmail);
  };

  const getPropertyTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      APARTMENT: 'דירה',
      DUPLEX: 'דופלקס',
      PENTHOUSE: 'פנטהאוז',
      PRIVATE_HOUSE: 'בית פרטי',
      VILLA: 'וילה',
      COTTAGE: 'קוטג׳',
      STUDIO: 'סטודיו',
    };
    return types[type || ''] || type || '';
  };

  const getPurposeLabel = (purpose?: string) => {
    if (purpose === 'HOSTING') return 'אירוח מלא';
    if (purpose === 'SLEEPING_ONLY') return 'לינה בלבד';
    return 'לא צוין';
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1F3F3A] mb-2">תצוגה מקדימה</h2>
        <p className="text-gray-600">בדוק את הפרטים לפני פרסום המודעה</p>
      </div>

      {/* Preview Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
        
        {/* Location */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
            <span>📍</span> כתובת הנכס
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-lg font-semibold text-gray-900">
              {step1?.streetName 
                ? `${step1.streetName} ${step1.houseNumber || ''}`
                : step1?.neighborhoodName || 'לא צוין'}
            </p>
            <p className="text-gray-600 mt-1">
              {step1?.neighborhoodName && step1.streetName ? `שכונת ${step1.neighborhoodName}, ` : ''}
              {step1?.cityName || 'לא צוין'}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Payment Type */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>💰</span> סוג אירוח
            </h3>
            <div className={`rounded-lg p-4 text-center ${
              step2?.isPaid 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50' 
                : 'bg-gradient-to-br from-blue-50 to-sky-50'
            }`}>
              <div className="text-2xl mb-2">{step2?.isPaid ? '💰' : '🤝'}</div>
              <div className="text-xl font-bold text-gray-900">
                {step2?.isPaid ? 'בתשלום' : 'ללא תשלום'}
              </div>
              {step2?.isPaid && step3?.priceRequested && (
                <div className="text-2xl font-bold text-green-700 mt-2">
                  ₪{step3.priceRequested.toLocaleString('he-IL')}
                </div>
              )}
            </div>
          </div>

          {/* Parasha */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>📅</span> שבת פרשת
            </h3>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-900">{step3?.parasha || 'לא צוין'}</div>
            </div>
          </div>

          {/* Property Details */}
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
                <div className="text-2xl font-bold text-green-900">
                  {step3?.floor !== undefined && step3.floor !== null
                    ? (step3.floor === 0 ? 'קרקע' : step3.floor)
                    : 'לא צוין'}
                </div>
                <div className="text-sm text-gray-600">קומה</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-900">{step3?.balconiesCount || 0}</div>
                <div className="text-sm text-gray-600">מרפסות</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">סוג נכס:</span>
                <span className="font-semibold text-gray-900">{getPropertyTypeLabel(step3?.propertyType)}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">סוג אירוח:</span>
                <span className="font-semibold text-gray-900">{getPurposeLabel(step3?.purpose)}</span>
              </div>
            </div>
          </div>

          {/* Features */}
          {step3?.features && Object.values(step3.features).some(value => value) && (
            <div className="border-b pb-4">
              <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
                <span>✨</span> מאפיינים
              </h3>
              <div className="flex flex-wrap gap-2">
                {step3.features.plata && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">🔥 פלטה</span>
                )}
                {step3.features.urn && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">☕ מיחם</span>
                )}
                {step3.features.linens && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">🛏️ מצעים</span>
                )}
                {step3.features.pool && (
                  <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm">🏊 בריכה</span>
                )}
                {step3.features.kidsGames && (
                  <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">🎮 משחקי ילדים</span>
                )}
                {step3.features.babyBed && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">👶 מיטת תינוק</span>
                )}
                {step3.features.masterUnit && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">🚪 יחידת הורים</span>
                )}
                {step3.features.yard && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">🌳 חצר</span>
                )}
                {step3.features.view && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">🌄 נוף</span>
                )}
                {step3.features.sleepingOnly && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">😴 לינה בלבד</span>
                )}
                {step3.features.balcony && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">🌿 מרפסת</span>
                )}
                {step3.features.ac && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">❄️ מזגן</span>
                )}
                {step3.features.accessibleForDisabled && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">♿ נגישה לנכים</span>
                )}
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-bold text-[#1F3F3A] mb-3 flex items-center gap-2">
              <span>📞</span> פרטי התקשרות
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {step4?.contactName && (
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">שם:</span>
                  <span className="font-semibold text-gray-900">{step4.contactName}</span>
                </div>
              )}
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">טלפון:</span>
                <span className="font-semibold text-gray-900" dir="ltr">{step4?.contactPhone || 'לא צוין'}</span>
              </div>
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
          className="px-6 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-[#1F3F3A] hover:text-white transition-all disabled:opacity-50"
        >
          ← חזרה
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`px-8 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#C9A24D] text-[#1F3F3A] hover:bg-[#B08C3C]'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              מפרסם...
            </span>
          ) : (
            'פרסם דירה לשבת ✓'
          )}
        </button>
      </div>
    </div>
  );
};

export default HolidayRentStep5;
