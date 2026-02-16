import React, { useState } from 'react';
import { WizardStepProps } from '../../../types/wizard';

export type CommercialPropertyType = 
  | 'STORE' // חנות
  | 'CLINIC' // קליניקה
  | 'WAREHOUSE' // מחסן
  | 'GALLERY' // גלריה
  | 'OFFICE' // משרד
  | 'OPERATIONAL_SPACE' // שטח תפעולי
  | 'HANGAR' // האנגר
  | 'SHOWROOM'; // אולם תצוגה

export interface WantedCommercialStep4Data {
  commercialType: CommercialPropertyType;
  area?: number;
  floor?: number | string;
  features: string[];
  price?: number;
  arnona?: number;
  entryDate: string;
}

const COMMERCIAL_TYPE_OPTIONS = [
  { value: 'STORE', label: 'חנות', icon: '🏪' },
  { value: 'CLINIC', label: 'קליניקה', icon: '🏥' },
  { value: 'WAREHOUSE', label: 'מחסן', icon: '📦' },
  { value: 'GALLERY', label: 'גלריה', icon: '🖼️' },
  { value: 'OFFICE', label: 'משרד', icon: '🏢' },
  { value: 'OPERATIONAL_SPACE', label: 'שטח תפעולי', icon: '🏭' },
  { value: 'HANGAR', label: 'האנגר', icon: '🏗️' },
  { value: 'SHOWROOM', label: 'אולם תצוגה', icon: '🏛️' },
];

const FEATURE_OPTIONS = [
  { value: 'parking', label: 'חניה' },
  { value: 'warehouse', label: 'מחסן' },
  { value: 'gallery', label: 'גלריה' },
  { value: 'airConditioning', label: 'מיזוג' },
  { value: 'kitchenette', label: 'מטבחון' },
  { value: 'mamad', label: 'ממ״ד' },
  { value: 'restrooms', label: 'שירותים' },
  { value: 'yard', label: 'חצר' },
  { value: 'elevator', label: 'מעלית' },
  { value: 'accessibility', label: 'נגישות לנכים' },
  { value: 'streetDisplay', label: 'חלון ראווה לרחוב' },
  { value: 'internet', label: 'אינטרנט' },
  { value: 'renovated', label: 'משופץ' },
];

const ENTRY_DATE_OPTIONS = [
  { value: 'immediate', label: 'מיידי' },
  { value: 'flexible', label: 'גמיש' },
  { value: 'specific', label: 'תאריך מדויק' },
];

const WantedCommercialStep4: React.FC<WizardStepProps> = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState<WantedCommercialStep4Data>(
    data || {
      commercialType: 'STORE',
      area: undefined,
      floor: undefined,
      features: [],
      price: undefined,
      arnona: undefined,
      entryDate: 'flexible',
    }
  );

  const [specificDate, setSpecificDate] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof WantedCommercialStep4Data, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.commercialType) {
      newErrors.commercialType = 'יש לבחור סוג נכס';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalData = {
      ...formData,
      entryDate: formData.entryDate === 'specific' ? specificDate : formData.entryDate,
    };

    onNext(finalData);
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">פרטי הנכס</h2>
        <p className="text-gray-600">ספר לנו עוד על הנכס המסחרי</p>
      </div>

      <div className="space-y-6">
        {/* Commercial Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            סוג הנכס <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COMMERCIAL_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange('commercialType', option.value)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  formData.commercialType === option.value
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 text-[#1F3F3A] font-bold'
                    : 'border-gray-300 hover:border-[#C9A24D] text-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="text-sm">{option.label}</div>
              </button>
            ))}
          </div>
          {errors.commercialType && (
            <p className="mt-1 text-sm text-red-500">{errors.commercialType}</p>
          )}
        </div>

        {/* Area and Floor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שטח במ"ר (אופציונלי)
            </label>
            <input
              type="number"
              step="0.5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
              placeholder="לדוגמה: 100"
              value={formData.area || ''}
              onChange={(e) => handleChange('area', e.target.value ? Number(e.target.value) : undefined)}
              onWheel={(e) => e.currentTarget.blur()}
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קומה (אופציונלי)
            </label>
            <input
              type="number"
              step="0.5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
              placeholder="לדוגמה: 2, 0 לקרקע"
              value={formData.floor !== undefined ? formData.floor : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  handleChange('floor', undefined);
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    handleChange('floor', numValue);
                  }
                }
              }}
              onWheel={(e) => e.currentTarget.blur()}
            />
            <p className="mt-1 text-sm text-gray-500">מספר (כולל חצאים, 0 לקרקע)</p>
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">מה בנכס?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {FEATURE_OPTIONS.map((feature) => (
              <button
                key={feature.value}
                type="button"
                onClick={() => toggleFeature(feature.value)}
                className={`p-3 rounded-lg border-2 transition-all text-center text-sm ${
                  formData.features.includes(feature.value)
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 text-[#1F3F3A] font-bold'
                    : 'border-gray-300 hover:border-[#C9A24D] text-gray-700'
                }`}
              >
                {feature.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price and Arnona */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מחיר (אופציונלי)
            </label>
            <input
              type="number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
              placeholder="לדוגמה: 10000"
              value={formData.price || ''}
              onChange={(e) => handleChange('price', e.target.value ? Number(e.target.value) : undefined)}
              onWheel={(e) => e.currentTarget.blur()}
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ארנונה (אופציונלי)
            </label>
            <input
              type="number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
              placeholder="לדוגמה: 500"
              value={formData.arnona || ''}
              onChange={(e) => handleChange('arnona', e.target.value ? Number(e.target.value) : undefined)}
              onWheel={(e) => e.currentTarget.blur()}
              min="0"
            />
          </div>
        </div>

        {/* Entry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תאריך כניסה (אופציונלי)
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
            value={formData.entryDate}
            onChange={(e) => handleChange('entryDate', e.target.value)}
          >
            {ENTRY_DATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {formData.entryDate === 'specific' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              בחר תאריך
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
              value={specificDate}
              onChange={(e) => {
                setSpecificDate(e.target.value);
                setErrors((prev) => ({ ...prev, specificDate: '' }));
              }}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onPrev}
          className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:border-gray-400 transition-all"
        >
          ← חזרה
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

export default WantedCommercialStep4;
