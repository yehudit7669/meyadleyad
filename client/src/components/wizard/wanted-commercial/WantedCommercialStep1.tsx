import React, { useState } from 'react';
import { WizardStepProps } from '../../../types/wizard';

export interface WantedCommercialStep1Data {
  transactionType: 'FOR_RENT' | 'FOR_SALE';
}

const WantedCommercialStep1: React.FC<WizardStepProps> = ({ data, onNext }) => {
  const [formData, setFormData] = useState<WantedCommercialStep1Data>(
    data || {
      transactionType: 'FOR_RENT',
    }
  );

  const handleChange = (type: 'FOR_RENT' | 'FOR_SALE') => {
    setFormData({ transactionType: type });
  };

  const handleNext = () => {
    onNext(formData);
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">מה אתה מחפש?</h2>
        <p className="text-gray-600">בחר האם אתה מחפש להשכיר או לקנות נכס מסחרי</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => handleChange('FOR_RENT')}
          className={`p-8 rounded-xl border-2 transition-all transform hover:scale-105 ${
            formData.transactionType === 'FOR_RENT'
              ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30 shadow-lg'
              : 'border-gray-300 hover:border-[#C9A24D] hover:shadow-md'
          }`}
        >
          <div className="text-6xl mb-4">🏢</div>
          <div className="text-xl font-bold text-[#1F3F3A] mb-2">מחפש להשכיר</div>
          <div className="text-sm text-gray-600">מחפש נכס מסחרי להשכרה</div>
        </button>

        <button
          type="button"
          onClick={() => handleChange('FOR_SALE')}
          className={`p-8 rounded-xl border-2 transition-all transform hover:scale-105 ${
            formData.transactionType === 'FOR_SALE'
              ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30 shadow-lg'
              : 'border-gray-300 hover:border-[#C9A24D] hover:shadow-md'
          }`}
        >
          <div className="text-6xl mb-4">🏪</div>
          <div className="text-xl font-bold text-[#1F3F3A] mb-2">מחפש לקנות</div>
          <div className="text-sm text-gray-600">מחפש נכס מסחרי לקנייה</div>
        </button>
      </div>

      <div className="flex justify-end pt-6">
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

export default WantedCommercialStep1;
