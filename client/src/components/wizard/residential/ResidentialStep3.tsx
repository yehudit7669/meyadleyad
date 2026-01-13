import React, { useState } from 'react';
import { ResidentialStep3Data, PropertyType, PropertyCondition, FurnitureStatus } from '../../../types/wizard';
import { residentialStep3Schema } from '../../../types/wizard';
import { WizardStepProps } from '../../../types/wizard';
import {
  PROPERTY_TYPE_OPTIONS,
  ROOMS_OPTIONS,
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
      squareMeters: 0,
      condition: PropertyCondition.MAINTAINED,
      floor: 0,
      balconies: 0,
      furniture: FurnitureStatus.NONE,
      entryDate: '',
      price: 0,
      arnona: 0,
      vaad: 0,
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
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30'
                    : 'border-gray-300 hover:border-[#C9A24D]'
                }`}
              >
                <div className="font-medium">{option.label}</div>
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
            <select
              value={formData.rooms}
              onChange={(e) => handleChange('rooms', parseFloat(e.target.value))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
                errors.rooms ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {ROOMS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.rooms && <p className="mt-1 text-sm text-red-500">{errors.rooms}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שטח במ״ר <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.squareMeters ?? ''}
              onChange={(e) => handleChange('squareMeters', e.target.value ? parseInt(e.target.value, 10) : 0)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
                errors.squareMeters ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="לדוגמה: 90"
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
            מצב הנכס <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CONDITION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  handleChange('condition', option.value as PropertyCondition)
                }
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  formData.condition === option.value
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30'
                    : 'border-gray-300 hover:border-[#C9A24D]'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Floor and Balconies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קומה <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.floor}
              onChange={(e) => handleChange('floor', e.target.value ? Number(e.target.value) : 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
              placeholder="לדוגמה: 2 (מספר שלילי למרתף)"
            />
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
            ריהוט <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {FURNITURE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange('furniture', option.value as FurnitureStatus)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  formData.furniture === option.value
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 ring-2 ring-[#C9A24D] ring-opacity-30'
                    : 'border-gray-300 hover:border-[#C9A24D]'
                }`}
              >
                <div className="font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Entry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תאריך כניסה <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.entryDate}
            onChange={(e) => handleChange('entryDate', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
              errors.entryDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.entryDate && (
            <p className="mt-1 text-sm text-red-500">{errors.entryDate}</p>
          )}
        </div>

        {/* Price and Payments */}
        <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-bold text-lg text-[#1F3F3A]">מחיר ותשלומים</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מחיר מבוקש (₪) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price ?? ''}
              onChange={(e) => handleChange('price', e.target.value ? parseInt(e.target.value, 10) : 0)}
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
                ארנונה (₪ לחודשיים)
              </label>
              <input
                type="number"
                value={formData.arnona ?? ''}
                onChange={(e) => handleChange('arnona', e.target.value ? parseInt(e.target.value, 10) : 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
                placeholder="לדוגמה: 500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ועד בית (₪ לחודש)
              </label>
              <input
                type="number"
                value={formData.vaad ?? ''}
                onChange={(e) => handleChange('vaad', e.target.value ? parseInt(e.target.value, 10) : 0)}
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
