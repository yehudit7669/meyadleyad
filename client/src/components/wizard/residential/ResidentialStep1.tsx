import React, { useState, useEffect } from 'react';
import { ResidentialStep1Data } from '../../../types/wizard';
import { residentialStep1Schema } from '../../../types/wizard';
import { WizardStepProps } from '../../../types/wizard';
import { useAuth } from '../../../hooks/useAuth';
import { isBroker } from '../../../utils/userHelpers';

const ResidentialStep1: React.FC<WizardStepProps> = ({ data, onNext }) => {
  const { user } = useAuth();
  const userIsBroker = isBroker(user);

  const [formData, setFormData] = useState<ResidentialStep1Data>(
    data || {
      hasBroker: userIsBroker ? true : false,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If user is a broker, automatically proceed to next step
  useEffect(() => {
    if (userIsBroker) {
      onNext({ hasBroker: true });
    }
  }, [userIsBroker, onNext]);

  const handleChange = (field: keyof ResidentialStep1Data, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user changes the field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    try {
      residentialStep1Schema.parse(formData);
      onNext(formData);
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message;
        });
      }
      setErrors(newErrors);
    }
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
            {/* Has Broker Choice */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleChange('hasBroker', false)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  !formData.hasBroker
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30'
                    : 'border-gray-300 hover:border-[#C9A24D]'
                }`}
              >
                <div className="text-4xl mb-2">🏠</div>
                <div className="font-bold text-lg">ללא תיווך</div>
                <div className="text-sm text-gray-600">פרסום ישיר מהבעלים</div>
              </button>

              <button
                type="button"
                onClick={() => handleChange('hasBroker', true)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  formData.hasBroker
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

          {/* Next Button */}
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

export default ResidentialStep1;
