import React, { useState, useEffect, useRef } from 'react';
import { WizardStepProps } from '../../../types/wizard';
import { useAuth } from '../../../hooks/useAuth';
import { isBroker } from '../../../utils/userHelpers';

export type BrokerType = 'WITH_BROKER' | 'WITHOUT_BROKER';

export interface CommercialSpaceStep2Data {
  brokerType: BrokerType;
}

const CommercialSpaceStep2: React.FC<WizardStepProps> = ({ data, onNext }) => {
  const { user } = useAuth();
  const userIsBroker = isBroker(user);
  const hasAutoAdvanced = useRef(false);

  const [formData, setFormData] = useState<CommercialSpaceStep2Data>(
    data || {
      brokerType: userIsBroker ? 'WITH_BROKER' : 'WITHOUT_BROKER',
    }
  );

  // If user is a broker, automatically proceed to next step (only once)
  useEffect(() => {
    if (userIsBroker && !hasAutoAdvanced.current) {
      hasAutoAdvanced.current = true;
      onNext({ brokerType: 'WITH_BROKER' });
    }
  }, [userIsBroker, onNext]);

  const handleChange = (value: BrokerType) => {
    setFormData({ brokerType: value });
  };

  const handleNext = () => {
    onNext(formData);
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {userIsBroker ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">מעביר אותך לשלב הבא...</p>
          <p className="text-sm text-gray-500 mt-2">כמתווך, המודעה שלך מסומנת אוטומטית כ"עם תיווך"</p>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">האם יש תיווך?</h2>
            <p className="text-gray-600">בחר האם המודעה מפורסמת דרך מתווך או ישירות מהבעלים</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleChange('WITHOUT_BROKER')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  formData.brokerType === 'WITHOUT_BROKER'
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30'
                    : 'border-gray-300 hover:border-[#C9A24D]'
                }`}
              >
                <div className="text-4xl mb-2">👤</div>
                <div className="font-bold text-lg">ללא תיווך</div>
                <div className="text-sm text-gray-600">פרסום ישיר מהבעלים</div>
              </button>

              <button
                type="button"
                onClick={() => handleChange('WITH_BROKER')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  formData.brokerType === 'WITH_BROKER'
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30'
                    : 'border-gray-300 hover:border-[#C9A24D]'
                }`}
              >
                <div className="text-4xl mb-2">🤝</div>
                <div className="font-bold text-lg">עם תיווך</div>
                <div className="text-sm text-gray-600">דרך סוכן/משרד תיווך</div>
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
        </>
      )}
    </div>
  );
};

export default CommercialSpaceStep2;
