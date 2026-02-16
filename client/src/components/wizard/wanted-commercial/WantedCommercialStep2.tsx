import React, { useState } from 'react';
import { WizardStepProps } from '../../../types/wizard';

export interface WantedCommercialStep2Data {
  brokerType: 'WITH_BROKER' | 'WITHOUT_BROKER';
}

const WantedCommercialStep2: React.FC<WizardStepProps> = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState<WantedCommercialStep2Data>(
    data || {
      brokerType: 'WITHOUT_BROKER',
    }
  );

  const handleChange = (type: 'WITH_BROKER' | 'WITHOUT_BROKER') => {
    setFormData({ brokerType: type });
  };

  const handleNext = () => {
    onNext(formData);
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">האם יש תיווך?</h2>
        <p className="text-gray-600">בחר האם החיפוש דרך מתווך או ישירות</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => handleChange('WITHOUT_BROKER')}
          className={`p-8 rounded-xl border-2 transition-all transform hover:scale-105 ${
            formData.brokerType === 'WITHOUT_BROKER'
              ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30 shadow-lg'
              : 'border-gray-300 hover:border-[#C9A24D] hover:shadow-md'
          }`}
        >
          <div className="text-6xl mb-4">👤</div>
          <div className="text-xl font-bold text-[#1F3F3A] mb-2">ללא תיווך</div>
          <div className="text-sm text-gray-600">חיפוש ישיר</div>
        </button>

        <button
          type="button"
          onClick={() => handleChange('WITH_BROKER')}
          className={`p-8 rounded-xl border-2 transition-all transform hover:scale-105 ${
            formData.brokerType === 'WITH_BROKER'
              ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30 shadow-lg'
              : 'border-gray-300 hover:border-[#C9A24D] hover:shadow-md'
          }`}
        >
          <div className="text-6xl mb-4">🤝</div>
          <div className="text-xl font-bold text-[#1F3F3A] mb-2">עם תיווך</div>
          <div className="text-sm text-gray-600">דרך סוכן/משרד תיווך</div>
        </button>
      </div>

      <div className="flex items-center justify-between pt-6">
        <button
          type="button"
          onClick={onPrev}
          className="px-6 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-[#1F3F3A] hover:text-white transition-all"
        >
          ← הקודם
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-8 py-3 bg-[#C9A24D] text-[#1F3F3A] rounded-lg font-bold hover:bg-[#B08C3C] transition-all shadow-lg hover:shadow-xl"
        >
          הבא →
        </button>
      </div>
    </div>
  );
};

export default WantedCommercialStep2;
