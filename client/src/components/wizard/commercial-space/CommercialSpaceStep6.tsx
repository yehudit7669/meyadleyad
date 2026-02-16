import React, { useState } from 'react';
import { WizardStepProps } from '../../../types/wizard';

export interface CommercialSpaceStep6Data {
  contactName: string;
  contactPhone: string;
  agreeToTerms: boolean;
  weeklyDigestOptIn: boolean;
}

const CommercialSpaceStep6: React.FC<WizardStepProps> = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState<CommercialSpaceStep6Data>(
    data || {
      contactName: '',
      contactPhone: '',
      agreeToTerms: true,
      weeklyDigestOptIn: false,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CommercialSpaceStep6Data, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^0(5[0-9]|7[0-9]|[2-4]|[8-9])[0-9]{7,8}$/;
    return phoneRegex.test(phone);
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'יש להזין מספר טלפון';
    } else if (!validatePhone(formData.contactPhone)) {
      newErrors.contactPhone = 'מספר טלפון לא תקין';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onNext(formData);
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">פרטי התקשרות</h2>
        <p className="text-gray-600">מלא את פרטי יצירת הקשר שלך</p>
      </div>

      <div className="space-y-6">
        {/* Contact Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם (אופציונלי)
          </label>
          <input
            type="text"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
              errors.contactName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="לדוגמה: יוסי כהן"
            value={formData.contactName}
            onChange={(e) => handleChange('contactName', e.target.value)}
          />
          {errors.contactName && (
            <p className="mt-1 text-sm text-red-500">{errors.contactName}</p>
          )}
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            טלפון <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
              errors.contactPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="לדוגמה: 0501234567"
            dir="ltr"
            value={formData.contactPhone}
            onChange={(e) => handleChange('contactPhone', e.target.value)}
          />
          {errors.contactPhone && (
            <p className="mt-1 text-sm text-red-500">{errors.contactPhone}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            מספר טלפון ישראלי תקין (נייד או קווי)
          </p>
        </div>

        {/* Weekly Digest Opt-in */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.weeklyDigestOptIn || false}
              onChange={(e) => handleChange('weeklyDigestOptIn', e.target.checked)}
              className="mt-1 w-5 h-5 text-[#C9A24D] border-gray-300 rounded focus:ring-[#C9A24D] cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium text-[#1F3F3A]">
                שלח לי את הלוח השבועי באימייל לאחר הפרסום
              </div>
              <p className="text-sm text-gray-600 mt-1">
                קובץ PDF מסודר עם כל פרטי המודעה כפי שתפורסם באתר
              </p>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-amber-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">הגנת הפרטיות שלך:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>מספר הטלפון שלך יוצג רק למשתמשים מעוניינים</li>
                <li>ניתן לערוך או להסיר את המודעה בכל עת</li>
                <li>המערכת לא תשתף את הפרטים שלך עם גורמי צד שלישי</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
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
          className="px-8 py-3 bg-[#C9A24D] text-[#1F3F3A] hover:bg-[#B08C3C] shadow-lg hover:shadow-xl rounded-lg font-bold transition-all"
        >
          המשך לתצוגה מקדימה →
        </button>
      </div>
    </div>
  );
};

export default CommercialSpaceStep6;
