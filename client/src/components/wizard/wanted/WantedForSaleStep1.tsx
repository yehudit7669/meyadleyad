import React, { useState } from 'react';
import { WantedForSaleStep1Data, wantedForSaleStep1Schema } from '../../../types/wizard';

interface Props {
  data?: WantedForSaleStep1Data;
  onNext: (data: WantedForSaleStep1Data) => void;
  onPrev: () => void;
  isFirst?: boolean;
}

const WantedForSaleStep1: React.FC<Props> = ({ data, onNext }) => {
  const [hasBroker, setHasBroker] = useState<boolean | null>(
    data?.hasBroker !== undefined ? data.hasBroker : null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasBroker === null) {
      alert('יש לבחור אחת מהאפשרויות');
      return;
    }

    const formData: WantedForSaleStep1Data = {
      hasBroker,
    };

    try {
      wantedForSaleStep1Schema.parse(formData);
      onNext(formData);
    } catch (error: any) {
      alert(error.errors?.[0]?.message || 'שגיאה בנתונים');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-6">
          עם תיווך או ללא תיווך?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => setHasBroker(true)}
            className={`
              p-8 rounded-lg border-2 transition-all text-center
              ${hasBroker === true
                ? 'border-[#C9A24D] bg-[#C9A24D]/10 shadow-lg'
                : 'border-gray-300 hover:border-[#C9A24D]/50'
              }
            `}
          >
            <div className="text-4xl mb-3">🤝</div>
            <h3 className="text-xl font-bold text-[#1F3F3A] mb-2">עם תיווך</h3>
            <p className="text-gray-600">אני מעוניין בשירותי תיווך</p>
          </button>

          <button
            type="button"
            onClick={() => setHasBroker(false)}
            className={`
              p-8 rounded-lg border-2 transition-all text-center
              ${hasBroker === false
                ? 'border-[#C9A24D] bg-[#C9A24D]/10 shadow-lg'
                : 'border-gray-300 hover:border-[#C9A24D]/50'
              }
            `}
          >
            <div className="text-4xl mb-3">🏠</div>
            <h3 className="text-xl font-bold text-[#1F3F3A] mb-2">ללא תיווך</h3>
            <p className="text-gray-600">אני מחפש ישירות מבעלים</p>
          </button>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <div></div>
        <button
          type="submit"
          className="px-8 py-3 bg-[#C9A24D] text-white rounded-lg font-bold hover:bg-[#B08C3C] transition-all disabled:opacity-50"
          disabled={hasBroker === null}
        >
          המשך →
        </button>
      </div>
    </form>
  );
};

export default WantedForSaleStep1;
