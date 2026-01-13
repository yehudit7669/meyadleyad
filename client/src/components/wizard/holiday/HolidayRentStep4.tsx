import React, { useState } from 'react';
import { HolidayRentStep4Data, holidayRentStep4Schema } from '../../../types/wizard';

interface HolidayRentStep4Props {
  data: Partial<HolidayRentStep4Data>;
  onNext: (data: HolidayRentStep4Data) => void;
  onBack: () => void;
}

const HolidayRentStep4: React.FC<HolidayRentStep4Props> = ({ data, onNext, onBack }) => {
  const [formData, setFormData] = useState<Partial<HolidayRentStep4Data>>({
    contactName: data.contactName || '',
    contactPhone: data.contactPhone || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof HolidayRentStep4Data, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleNext = () => {
    try {
      const validated = holidayRentStep4Schema.parse(formData);
      setErrors({});
      onNext(validated);
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setErrors(fieldErrors);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1F3F3A]">פרטי התקשרות</h2>
      <p className="text-gray-600">מלאו את פרטי הקשר שלכם</p>

      {/* Contact Name */}
      <div>
        <label className="block text-sm font-medium text-[#1F3F3A] mb-2">שם (אופציונלי)</label>
        <input
          type="text"
          value={formData.contactName}
          onChange={(e) => handleInputChange('contactName', e.target.value)}
          placeholder="הזן שם מלא"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
            errors.contactName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
      </div>

      {/* Contact Phone */}
      <div>
        <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
          טלפון <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formData.contactPhone}
          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
          placeholder="050-1234567"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
            errors.contactPhone ? 'border-red-500' : 'border-gray-300'
          }`}
          dir="ltr"
        />
        {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}
        <p className="text-sm text-gray-500 mt-1">הזן מספר טלפון ישראלי תקין (10 ספרות)</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-[#1F3F3A] mb-1">לתשומת לבך</h3>
            <p className="text-sm text-gray-700">
              פרטי הקשר שלך יוצגו במודעה כדי שמעוניינים יוכלו ליצור איתך קשר בנוגע לאירוח לשבת.
              אנא וודא שהפרטים נכונים.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          חזור
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-[#C9A24D] text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
        >
          פרסם דירה לשבת
        </button>
      </div>
    </div>
  );
};

export default HolidayRentStep4;
