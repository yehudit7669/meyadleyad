import React, { useState } from 'react';
import { WantedHolidayStep4Data, wantedHolidayStep4Schema } from '../../../types/wizard';

interface Props {
  data?: WantedHolidayStep4Data;
  onNext: (data: WantedHolidayStep4Data) => void;
  onPrev: () => void;
  isLast?: boolean;
  isLoading?: boolean;
}

const WantedHolidayStep4: React.FC<Props> = ({ data, onNext, onPrev, isLoading }) => {
  const [contactName, setContactName] = useState(data?.contactName || '');
  const [contactPhone, setContactPhone] = useState(data?.contactPhone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData: WantedHolidayStep4Data = {
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim(),
    };

    try {
      wantedHolidayStep4Schema.parse(formData);
      onNext(formData);
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
      }
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">פרטי התקשרות</h2>
        <p className="text-gray-600">איך ניתן ליצור איתך קשר?</p>
      </div>

      <div className="space-y-4">
        {/* Contact Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם (אופציונלי)
          </label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="השם שלך"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            אם תשאיר ריק, המודעה תוצג כ"אנונימי"
          </p>
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            טלפון <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="050-1234567"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
              errors.contactPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            dir="ltr"
          />
          {errors.contactPhone && (
            <p className="text-sm text-red-500 mt-1">{errors.contactPhone}</p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-bold text-[#1F3F3A] mb-1">טיפ חשוב</h3>
            <p className="text-sm text-gray-700">
              ודא שמספר הטלפון תקין וזמין. מודעות עם פרטי התקשרות מדויקים מקבלות יותר פניות.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onPrev}
          disabled={isLoading}
          className="px-8 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          ← חזרה
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-[#C9A24D] text-white rounded-lg font-bold hover:bg-[#B08C3C] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              מפרסם...
            </>
          ) : (
            <>פרסם מודעה ✓</>
          )}
        </button>
      </div>
    </form>
  );
};

export default WantedHolidayStep4;
