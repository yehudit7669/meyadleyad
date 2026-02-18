import React, { useState } from 'react';
import { HolidayRentStep2Data, holidayRentStep2Schema } from '../../../types/wizard';

interface HolidayRentStep2Props {
  data: Partial<HolidayRentStep2Data>;
  onNext: (data: HolidayRentStep2Data) => void;
  onBack?: () => void;
}

const HolidayRentStep2: React.FC<HolidayRentStep2Props> = ({ data, onNext, onBack }) => {
  const [formData, setFormData] = useState<Partial<HolidayRentStep2Data>>({
    isPaid: data.isPaid ?? true,
  });

  const handlePaymentTypeSelect = (isPaid: boolean) => {
    setFormData({ isPaid });
  };

  const handleNext = () => {
    const validated = holidayRentStep2Schema.parse(formData);
    onNext(validated);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1F3F3A]">סוג הפרסום</h2>
      <p className="text-gray-600">האם האירוח בתשלום או ללא תשלום?</p>

      {/* Payment Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handlePaymentTypeSelect(true)}
          className={`p-6 border-2 rounded-lg text-center transition-all ${
            formData.isPaid
              ? 'border-[#C9A24D] bg-[#E6D3A3] bg-opacity-20'
              : 'border-gray-300 hover:border-[#C9A24D]'
          }`}
        >
          <div className="text-4xl mb-2">💰</div>
          <h3 className="text-lg font-semibold text-[#1F3F3A]">בתשלום</h3>
          <p className="text-sm text-gray-600 mt-1">אני משכיר את הדירה בתשלום</p>
        </button>

        <button
          type="button"
          onClick={() => handlePaymentTypeSelect(false)}
          className={`p-6 border-2 rounded-lg text-center transition-all ${
            formData.isPaid === false
              ? 'border-[#C9A24D] bg-[#E6D3A3] bg-opacity-20'
              : 'border-gray-300 hover:border-[#C9A24D]'
          }`}
        >
          <div className="text-4xl mb-2">🤝</div>
          <h3 className="text-lg font-semibold text-[#1F3F3A]">ללא תשלום</h3>
          <p className="text-sm text-gray-600 mt-1">אני מציע אירוח ללא תשלום</p>
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <button
            onClick={onBack}
            className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            חזור
          </button>
        )}
        <button
          onClick={handleNext}
          className={`px-8 py-3 bg-[#1F3F3A] text-white rounded-lg hover:bg-opacity-90 transition-colors ${!onBack ? 'mr-auto' : ''}`}
        >
          המשך לשלב הבא
        </button>
      </div>
    </div>
  );
};

export default HolidayRentStep2;
