import React, { useState } from 'react';
import { WantedHolidayStep1Data, wantedHolidayStep1Schema } from '../../../types/wizard';

interface Props {
  data?: WantedHolidayStep1Data;
  onNext: (data: WantedHolidayStep1Data) => void;
  onPrev: () => void;
  isFirst?: boolean;
}

const WantedHolidayStep1: React.FC<Props> = ({ data, onNext }) => {
  const [desiredArea, setDesiredArea] = useState(data?.desiredArea || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData: WantedHolidayStep1Data = {
      desiredArea: desiredArea.trim(),
    };

    try {
      wantedHolidayStep1Schema.parse(formData);
      onNext(formData);
    } catch (error: any) {
      setError(error.errors?.[0]?.message || 'שגיאה בנתונים');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">
          כתובת/אזור רצוי
        </h2>
        <p className="text-gray-600 mb-6">
          הזן את האזור, השכונה או הרחוב המבוקש (טקסט חופשי)
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            אזור/שכונה/רחוב מבוקש <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={desiredArea}
            onChange={(e) => setDesiredArea(e.target.value)}
            placeholder='למשל: "שכונת הר נוף" או "רחוב בר אילן" או "קרית משה"'
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
            dir="rtl"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <p className="text-sm text-gray-500">
            💡 ניתן להזין כל אזור או שכונה, לא מוגבל לרשימה מסוימת
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <div></div>
        <button
          type="submit"
          className="px-8 py-3 bg-[#C9A24D] text-white rounded-lg font-bold hover:bg-[#B08C3C] transition-all"
        >
          המשך →
        </button>
      </div>
    </form>
  );
};

export default WantedHolidayStep1;
