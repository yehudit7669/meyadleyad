import React, { useState } from 'react';
import { WizardStepProps } from '../../../types/wizard';

export type TransactionType = 'FOR_RENT' | 'FOR_SALE';

export interface CommercialSpaceStep1Data {
  transactionType: TransactionType;
}

const CommercialSpaceStep1: React.FC<WizardStepProps> = ({ data, onNext }) => {
  const [formData, setFormData] = useState<CommercialSpaceStep1Data>(
    data || {
      transactionType: 'FOR_RENT',
    }
  );

  const handleChange = (value: TransactionType) => {
    setFormData({ transactionType: value });
  };

  const handleNext = () => {
    onNext(formData);
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">מה אתה רוצה לעשות?</h2>
        <p className="text-gray-600">בחר את סוג העסקה</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleChange('FOR_RENT')}
            className={`p-6 rounded-xl border-2 transition-all ${
              formData.transactionType === 'FOR_RENT'
                ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30'
                : 'border-gray-300 hover:border-[#C9A24D]'
            }`}
          >
            <div className="text-4xl mb-2">🏢</div>
            <div className="font-bold text-lg">להשכרה</div>
            <div className="text-sm text-gray-600">שטח מסחרי להשכרה</div>
          </button>

          <button
            type="button"
            onClick={() => handleChange('FOR_SALE')}
            className={`p-6 rounded-xl border-2 transition-all ${
              formData.transactionType === 'FOR_SALE'
                ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30'
                : 'border-gray-300 hover:border-[#C9A24D]'
            }`}
          >
            <div className="text-4xl mb-2">🏪</div>
            <div className="font-bold text-lg">למכירה</div>
            <div className="text-sm text-gray-600">שטח מסחרי למכירה</div>
          </button>
        </div>
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

export default CommercialSpaceStep1;
