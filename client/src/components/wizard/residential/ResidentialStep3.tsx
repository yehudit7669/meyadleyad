import React, { useState } from 'react';
import { ResidentialStep3Data, PropertyType, PropertyCondition, FurnitureStatus } from '../../../types/wizard';
import { residentialStep3Schema } from '../../../types/wizard';
import { WizardStepProps } from '../../../types/wizard';
import {
  PROPERTY_TYPE_OPTIONS,
  CONDITION_OPTIONS,
  FURNITURE_OPTIONS,
} from '../../../constants/adTypes';

interface ResidentialStep3Props extends WizardStepProps {
  adType?: string;
}

const ResidentialStep3: React.FC<ResidentialStep3Props> = ({ data, onNext, onPrev, adType }) => {
  const [formData, setFormData] = useState<ResidentialStep3Data>(
    data || {
      propertyType: PropertyType.APARTMENT,
      rooms: 3,
      squareMeters: undefined,
      condition: undefined,
      floor: undefined,
      balconies: 0,
      furniture: undefined,
      entryDate: undefined,
      price: undefined,
      arnona: undefined,
      vaad: undefined,
      features: {
        parking: false,
        storage: false,
        safeRoom: false,
        sukkaBalcony: false,
        elevator: false,
        view: false,
        parentalUnit: false,
        housingUnit: false,
        yard: false,
        airConditioning: false,
        hasOption: false,
        garden: false,
        frontFacing: false,
        upgradedKitchen: false,
        accessibleForDisabled: false,
      },
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ResidentialStep3Data, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFeatureToggle = (feature: keyof ResidentialStep3Data['features']) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature],
      },
    }));
  };

  const handleNext = () => {
    try {
      residentialStep3Schema.parse(formData);
      onNext(formData);
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
      }
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">פרטי הנכס</h2>
        <p className="text-gray-600">מלא את כל פרטי הנכס</p>
      </div>

      <div className="space-y-6">
        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            סוג הנכס <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange('propertyType', option.value as PropertyType)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  formData.propertyType === option.value
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 text-[#1F3F3A] font-bold'
                    : 'border-gray-300 hover:border-[#C9A24D] text-gray-700'
                }`}
              >
                <div>{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Rooms and Square Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מספר חדרים <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.rooms}
              onChange={(e) => handleChange('rooms', e.target.value ? parseFloat(e.target.value) : 0)}
              onWheel={(e) => e.currentTarget.blur()}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
                errors.rooms ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="לדוגמה: 3.5"
              min="0.5"
            />
            {errors.rooms && <p className="mt-1 text-sm text-red-500">{errors.rooms}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שטח במ״ר (אופציונלי)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.squareMeters || ''}
              onChange={(e) => handleChange('squareMeters', e.target.value ? parseFloat(e.target.value) : undefined)}
              onWheel={(e) => e.currentTarget.blur()}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
                errors.squareMeters ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="לדוגמה: 90.5"
              min="1"
            />
            {errors.squareMeters && (
              <p className="mt-1 text-sm text-red-500">{errors.squareMeters}</p>
            )}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מצב הנכס (אופציונלי)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CONDITION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  handleChange('condition', option.value as PropertyCondition)
                }
                className={`p-4 rounded-lg border-2 transition-all text-center text-sm ${
                  formData.condition === option.value
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 text-[#1F3F3A] font-bold'
                    : 'border-gray-300 hover:border-[#C9A24D] text-gray-700'
                }`}
              >
                <div>{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Floor and Balconies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קומה (אופציונלי)
            </label>
            <input
              type="text"
              value={formData.floor !== undefined ? formData.floor : ''}
              onChange={(e) => {
                const value = e.target.value;
                // Try to parse as number, otherwise keep as string
                const numValue = parseFloat(value);
                if (value === '' || value === 'ללא') {
                  handleChange('floor', value === '' ? undefined : 'ללא');
                } else if (!isNaN(numValue)) {
                  handleChange('floor', numValue);
                } else {
                  handleChange('floor', value);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
              placeholder="לדוגמה: 2, 0 לקרקע, ללא"
            />
            <p className="mt-1 text-sm text-gray-500">מספר (כולל 0 לקרקע) או \"ללא\"</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מספר מרפסות
            </label>
            <select
              value={formData.balconies}
              onChange={(e) => handleChange('balconies', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        </div>

        {/* Furniture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ריהוט (אופציונלי)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {FURNITURE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange('furniture', option.value as FurnitureStatus)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  formData.furniture === option.value
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 text-[#1F3F3A] font-bold'
                    : 'border-gray-300 hover:border-[#C9A24D] text-gray-700'
                }`}
              >
                <div>{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Entry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תאריך כניסה (אופציונלי)
          </label>
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChange('entryDate', 'גמיש')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  formData.entryDate === 'גמיש'
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 text-[#1F3F3A] font-bold'
                    : 'border-gray-300 hover:border-[#C9A24D] text-gray-700'
                }`}
              >
                גמיש
              </button>
              <button
                type="button"
                onClick={() => handleChange('entryDate', 'מיידי')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  formData.entryDate === 'מיידי'
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 text-[#1F3F3A] font-bold'
                    : 'border-gray-300 hover:border-[#C9A24D] text-gray-700'
                }`}
              >
                מיידי
              </button>
            </div>
            <input
              type="date"
              value={formData.entryDate && formData.entryDate !== 'גמיש' && formData.entryDate !== 'מיידי' ? formData.entryDate : ''}
              onChange={(e) => handleChange('entryDate', e.target.value || undefined)}
              min={new Date().toISOString().split('T')[0]}
              max="2030-12-31"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
                errors.entryDate ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="או בחר תאריך ספציפי"
            />
          </div>
          {errors.entryDate && (
            <p className="mt-1 text-sm text-red-500">{errors.entryDate}</p>
          )}
        </div>

        {/* Price and Payments */}
        <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-bold text-lg text-[#1F3F3A]">מחיר ותשלומים</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מחיר מבוקש (אופציונלי)
            </label>
            <input
              type="number"
              value={formData.price || ''}
              onChange={(e) => handleChange('price', e.target.value ? parseInt(e.target.value, 10) : undefined)}
              onWheel={(e) => e.currentTarget.blur()}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="לדוגמה: 1500000"
              min="1"
            />
            {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ארנונה (₪ לחודשיים, אופציונלי)
              </label>
              <input
                type="number"
                value={formData.arnona || ''}
                onChange={(e) => handleChange('arnona', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
                placeholder="לדוגמה: 500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ועד בית (₪ לחודש, אופציונלי)
              </label>
              <input
                type="number"
                value={formData.vaad || ''}
                onChange={(e) => handleChange('vaad', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
                placeholder="לדוגמה: 300"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">מאפיינים</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries({
              parking: 'חניה',
              storage: 'מחסן',
              safeRoom: 'ממ״ד',
              sukkaBalcony: 'מרפסת סוכה',
              elevator: 'מעלית',
              view: 'נוף',
              parentalUnit: 'יחידת הורים',
              housingUnit: 'יחידת דיור',
              yard: 'חצר',
              airConditioning: 'מיזוג',
              garden: 'גינה',
              frontFacing: 'חזית',
              upgradedKitchen: 'מטבח משודרג',
              accessibleForDisabled: 'נגיש לנכים',
              ...(adType === 'for_sale' ? { hasOption: 'אופציה' } : {}),
            }).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  handleFeatureToggle(key as keyof ResidentialStep3Data['features'])
                }
                className={`p-3 rounded-lg border-2 transition-all text-center text-sm ${
                  formData.features[key as keyof ResidentialStep3Data['features']]
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 text-[#1F3F3A] font-bold'
                    : 'border-gray-300 hover:border-[#C9A24D] text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
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
          className="px-8 py-3 bg-[#C9A24D] text-[#1F3F3A] rounded-lg font-bold hover:bg-[#B08C3C] transition-all shadow-lg hover:shadow-xl"
        >
          הבא →
        </button>
      </div>
    </div>
  );
};

export default ResidentialStep3;
