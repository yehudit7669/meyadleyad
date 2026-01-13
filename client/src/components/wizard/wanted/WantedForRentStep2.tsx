import React, { useState } from 'react';
import { WantedForRentStep2Data, wantedForRentStep2Schema } from '../../../types/wizard';

interface Props {
  data?: WantedForRentStep2Data;
  onNext: (data: WantedForRentStep2Data) => void;
  onPrev: () => void;
}

const WantedForRentStep2: React.FC<Props> = ({ data, onNext, onPrev }) => {
  const [desiredStreet, setDesiredStreet] = useState(data?.desiredStreet || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData: WantedForRentStep2Data = {
      desiredStreet: desiredStreet.trim(),
    };

    try {
      wantedForRentStep2Schema.parse(formData);
      onNext(formData);
    } catch (error: any) {
      setError(error.errors?.[0]?.message || 'שגיאה בנתונים');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">
          רחוב או אזור מבוקש
        </h2>
        <p className="text-gray-600 mb-6">
          הזן את הרחוב או האזור המבוקש (טקסט חופשי)
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            רחוב/אזור מבוקש <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={desiredStreet}
            onChange={(e) => setDesiredStreet(e.target.value)}
            placeholder='למשל: "רחוב הרצל" או "אזור גבעת שרת"'
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
            dir="rtl"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <p className="text-sm text-gray-500">
            💡 ניתן להזין כל רחוב או אזור, לא מוגבל לרשימה מסוימת
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onPrev}
          className="px-8 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-gray-50 transition-all"
        >
          ← חזרה
        </button>
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

export default WantedForRentStep2;
