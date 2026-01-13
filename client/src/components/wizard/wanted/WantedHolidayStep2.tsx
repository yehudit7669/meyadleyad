import React, { useState } from 'react';
import { WantedHolidayStep2Data, wantedHolidayStep2Schema } from '../../../types/wizard';

interface Props {
  data?: WantedHolidayStep2Data;
  onNext: (data: WantedHolidayStep2Data) => void;
  onPrev: () => void;
}

const WantedHolidayStep2: React.FC<Props> = ({ data, onNext, onPrev }) => {
  const [isPaid, setIsPaid] = useState<boolean | null>(
    data?.isPaid !== undefined ? data.isPaid : null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isPaid === null) {
      alert('יש לבחור אחת מהאפשרויות');
      return;
    }

    const formData: WantedHolidayStep2Data = { isPaid };

    try {
      wantedHolidayStep2Schema.parse(formData);
      onNext(formData);
    } catch (error: any) {
      alert(error.errors?.[0]?.message || 'שגיאה בנתונים');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-6">
          בתשלום או ללא תשלום?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => setIsPaid(true)}
            className={`
              p-8 rounded-lg border-2 transition-all text-center
              ${isPaid === true
                ? 'border-[#C9A24D] bg-[#C9A24D]/10 shadow-lg'
                : 'border-gray-300 hover:border-[#C9A24D]/50'
              }
            `}
          >
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-xl font-bold text-[#1F3F3A] mb-2">בתשלום</h3>
            <p className="text-gray-600">אני מוכן לשלם עבור הדירה</p>
          </button>

          <button
            type="button"
            onClick={() => setIsPaid(false)}
            className={`
              p-8 rounded-lg border-2 transition-all text-center
              ${isPaid === false
                ? 'border-[#C9A24D] bg-[#C9A24D]/10 shadow-lg'
                : 'border-gray-300 hover:border-[#C9A24D]/50'
              }
            `}
          >
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-xl font-bold text-[#1F3F3A] mb-2">ללא תשלום</h3>
            <p className="text-gray-600">מחפש דירה בהתנדבות</p>
          </button>
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
          className="px-8 py-3 bg-[#C9A24D] text-white rounded-lg font-bold hover:bg-[#B08C3C] transition-all disabled:opacity-50"
          disabled={isPaid === null}
        >
          המשך →
        </button>
      </div>
    </form>
  );
};

export default WantedHolidayStep2;
