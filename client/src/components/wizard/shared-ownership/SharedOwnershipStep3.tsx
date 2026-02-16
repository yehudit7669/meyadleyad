import React, { useState } from 'react';
import { SharedOwnershipStep3Data, PropertyType, PropertyCondition } from '../../../types/wizard';
import { sharedOwnershipStep3Schema } from '../../../types/wizard';
import { WizardStepProps } from '../../../types/wizard';
import { CONDITION_OPTIONS } from '../../../constants/adTypes';

// סוגי נכס לטאבו משותף
const SHARED_OWNERSHIP_PROPERTY_TYPES = [
  { value: 'PRIVATE_HOUSE', label: 'בית פרטי' },
  { value: 'GARDEN_APARTMENT', label: 'דירת גן' },
  { value: 'DUPLEX', label: 'דופלקס' },
  { value: 'APARTMENT', label: 'דירה' },
  { value: 'UNIT', label: 'יחידת דיור' },
  { value: 'TWO_STORY', label: 'דו קומתי' },
  { value: 'SEMI_DETACHED', label: 'דו משפחתי' },
];

const SharedOwnershipStep3: React.FC<WizardStepProps> = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState<SharedOwnershipStep3Data>(
    data || {
      propertyType: PropertyType.APARTMENT,
      rooms: 3,
      squareMeters: undefined,
      condition: undefined,
      floor: undefined,
      balconies: 0,
      priceRequested: undefined,
      arnona: undefined,
      vaad: undefined,
      requiredEquity: undefined,
      numberOfPartners: undefined,
      entryDate: undefined,
      features: {
        parking: false,
        storage: false,
        view: false,
        airConditioning: false,
        sukkaBalcony: false,
        safeRoom: false,
        parentalUnit: false,
        elevator: false,
        yard: false,
        garden: false,
        frontFacing: false,
        upgradedKitchen: false,
        accessibleForDisabled: false,
      },
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof SharedOwnershipStep3Data, value: any) => {
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

  const handleFeatureToggle = (feature: keyof SharedOwnershipStep3Data['features']) => {
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
      sharedOwnershipStep3Schema.parse(formData);
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
            סוג נכס <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SHARED_OWNERSHIP_PROPERTY_TYPES.map((option) => (
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
              step="0.5"
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

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">מה בנכס?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries({
              parking: 'חניה',
              storage: 'מחסן',
              view: 'נוף',
              airConditioning: 'מיזוג',
              sukkaBalcony: 'מרפסת סוכה',
              safeRoom: 'ממ״ד',
              parentalUnit: 'יחידת הורים',
              elevator: 'מעלית',
              yard: 'חצר',
              garden: 'גינה',
              frontFacing: 'חזית',
              upgradedKitchen: 'מטבח משודרג',
              accessibleForDisabled: 'נגישות לנכים',
            }).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  handleFeatureToggle(key as keyof SharedOwnershipStep3Data['features'])
                }
                className={`p-3 rounded-lg border-2 transition-all text-center text-sm ${
                  formData.features[key as keyof SharedOwnershipStep3Data['features']]
                    ? 'border-[#C9A24D] bg-[#C9A24D] bg-opacity-10 text-[#1F3F3A] font-bold'
                    : 'border-gray-300 hover:border-[#C9A24D] text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Price, Arnona, Vaad */}
        <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-bold text-lg text-[#1F3F3A]">מחיר ותשלומים</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מחיר מבוקש (אופציונלי)
            </label>
            <input
              type="number"
              value={formData.priceRequested || ''}
              onChange={(e) => handleChange('priceRequested', e.target.value ? parseInt(e.target.value, 10) : undefined)}
              onWheel={(e) => e.currentTarget.blur()}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
                errors.priceRequested ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="לדוגמה: 1500000"
              min="1"
            />
            {errors.priceRequested && <p className="mt-1 text-sm text-red-500">{errors.priceRequested}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ארנונה ועד בית (₪ לחודש, אופציונלי)
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

          {/* Required Equity and Number of Partners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הון עצמי דרוש (₪, אופציונלי)
              </label>
              <input
                type="number"
                value={formData.requiredEquity || ''}
                onChange={(e) => handleChange('requiredEquity', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                onWheel={(e) => e.currentTarget.blur()}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
                  errors.requiredEquity ? 'border-red-500' : ''
                }`}
                placeholder="לדוגמה: 200000"
                min="0"
              />
              {errors.requiredEquity && <p className="mt-1 text-sm text-red-500">{errors.requiredEquity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מספר שותפים (אופציונלי)
              </label>
              <input
                type="number"
                value={formData.numberOfPartners || ''}
                onChange={(e) => handleChange('numberOfPartners', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                onWheel={(e) => e.currentTarget.blur()}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
                  errors.numberOfPartners ? 'border-red-500' : ''
                }`}
                placeholder="לדוגמה: 3"
                min="1"
              />
              {errors.numberOfPartners && <p className="mt-1 text-sm text-red-500">{errors.numberOfPartners}</p>}
            </div>
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

export default SharedOwnershipStep3;
