import React, { useState } from 'react';
import {
  WantedForRentStep3Data,
  PropertyType,
  PropertyCondition,
  FurnitureStatus,
  wantedForRentStep3Schema,
} from '../../../types/wizard';
import {
  PROPERTY_TYPE_OPTIONS,
  CONDITION_OPTIONS,
  FURNITURE_OPTIONS,
} from '../../../constants/adTypes';

interface Props {
  data?: WantedForRentStep3Data;
  onNext: (data: WantedForRentStep3Data) => void;
  onPrev: () => void;
}

const WantedForRentStep3: React.FC<Props> = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState<WantedForRentStep3Data>(
    data || {
      propertyType: undefined,
      rooms: undefined,
      squareMeters: undefined,
      floor: undefined,
      balconies: undefined,
      condition: undefined,
      furniture: undefined,
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
        housingUnit: false,
        hasOption: false,
      },
      priceRequested: undefined,
      arnona: undefined,
      vaad: undefined,
      entryDate: undefined,
      description: undefined,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof WantedForRentStep3Data, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFeatureToggle = (feature: keyof WantedForRentStep3Data['features']) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature],
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      wantedForRentStep3Schema.parse(formData);
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
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">פרטי הנכס המבוקש</h2>
        <p className="text-gray-600">תאר את הנכס שאתה מחפש להשכרה</p>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          סוג הנכס
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PROPERTY_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('propertyType', option.value as PropertyType)}
              className={`p-4 rounded-lg border-2 transition-all text-center text-black ${
                formData.propertyType === option.value
                  ? 'border-[#C9A24D] bg-[#C9A24D]/10 ring-2 ring-[#C9A24D]/30'
                  : 'border-gray-300 hover:border-[#C9A24D]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms and Square Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מספר חדרים
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="10"
            value={formData.rooms ?? ''}
            onChange={(e) => handleChange('rooms', e.target.value ? parseFloat(e.target.value) : undefined)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
              errors.rooms ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="לדוגמה: 3.5"
          />
          {errors.rooms && <p className="text-sm text-red-500">{errors.rooms}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שטח במ״ר
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.squareMeters ?? ''}
            onChange={(e) => handleChange('squareMeters', e.target.value ? parseFloat(e.target.value) : undefined)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
              errors.squareMeters ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {errors.squareMeters && <p className="text-sm text-red-500">{errors.squareMeters}</p>}
        </div>
      </div>

      {/* Floor and Balconies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">קומה</label>
          <input
            type="number"
            step="0.5"
            value={formData.floor ?? ''}
            onChange={(e) => handleChange('floor', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
            placeholder="לדוגמה: 2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">מרפסות</label>
          <select
            value={formData.balconies ?? ''}
            onChange={(e) => handleChange('balconies', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
          >
            <option value="">בחר</option>
            <option value={0}>ללא</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          מצב הנכס
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CONDITION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('condition', formData.condition === option.value ? undefined : option.value as PropertyCondition)}
              className={`p-3 rounded-lg border-2 transition-all text-black ${
                formData.condition === option.value
                  ? 'border-[#C9A24D] bg-[#C9A24D]/10'
                  : 'border-gray-300 hover:border-[#C9A24D]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Furniture */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ריהוט</label>
        <div className="grid grid-cols-3 gap-3">
          {FURNITURE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('furniture', formData.furniture === option.value ? undefined : option.value as FurnitureStatus)}
              className={`p-3 rounded-lg border-2 transition-all text-black ${
                formData.furniture === option.value
                  ? 'border-[#C9A24D] bg-[#C9A24D]/10'
                  : 'border-gray-300 hover:border-[#C9A24D]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Features (without hasOption) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">מה בנכס?</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: 'parking', label: 'חניה' },
            { key: 'storage', label: 'מחסן' },
            { key: 'view', label: 'נוף' },
            { key: 'airConditioning', label: 'מיזוג' },
            { key: 'sukkaBalcony', label: 'מרפסת סוכה' },
            { key: 'safeRoom', label: 'ממ״ד' },
            { key: 'parentalUnit', label: 'יחידת הורים' },
            { key: 'elevator', label: 'מעלית' },
            { key: 'yard', label: 'חצר' },
            { key: 'garden', label: 'גינה' },
            { key: 'frontFacing', label: 'חזית' },
            { key: 'upgradedKitchen', label: 'מטבח משודרג' },
            { key: 'accessibleForDisabled', label: 'נגישה לנכים' },
            { key: 'housingUnit', label: 'יחידת דיור' },
            { key: 'hasOption', label: 'אופציה' },
          ].map((feature) => (
            <button
              key={feature.key}
              type="button"
              onClick={() => handleFeatureToggle(feature.key as keyof WantedForRentStep3Data['features'])}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.features[feature.key as keyof WantedForRentStep3Data['features']]
                  ? 'border-[#C9A24D] bg-[#C9A24D] text-white'
                  : 'border-gray-300 hover:border-[#C9A24D] text-black'
              }`}
            >
              {feature.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price, Arnona, Vaad */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מחיר מבוקש (שכירות חודשית)
          </label>
          <input
            type="number"
            value={formData.priceRequested ?? ''}
            onChange={(e) => handleChange('priceRequested', e.target.value ? parseInt(e.target.value) : undefined)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
              errors.priceRequested ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="₪"
          />
          {errors.priceRequested && <p className="text-sm text-red-500">{errors.priceRequested}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ארנונה</label>
          <input
            type="number"
            value={formData.arnona ?? ''}
            onChange={(e) => handleChange('arnona', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
            placeholder="₪"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ועד בית</label>
          <input
            type="number"
            value={formData.vaad ?? ''}
            onChange={(e) => handleChange('vaad', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
            placeholder="₪"
          />
        </div>
      </div>

      {/* Entry Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          תאריך כניסה רצוי
        </label>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <button
            type="button"
            onClick={() => handleChange('entryDate', formData.entryDate === 'גמיש' ? undefined : 'גמיש')}
            className={`p-3 rounded-lg border-2 transition-all text-black ${
              formData.entryDate === 'גמיש'
                ? 'border-[#C9A24D] bg-[#C9A24D]/10'
                : 'border-gray-300 hover:border-[#C9A24D]'
            }`}
          >
            גמיש
          </button>
          <button
            type="button"
            onClick={() => handleChange('entryDate', formData.entryDate === 'מיידי' ? undefined : 'מיידי')}
            className={`p-3 rounded-lg border-2 transition-all text-black ${
              formData.entryDate === 'מיידי'
                ? 'border-[#C9A24D] bg-[#C9A24D]/10'
                : 'border-gray-300 hover:border-[#C9A24D]'
            }`}
          >
            מיידי
          </button>
          <button
            type="button"
            onClick={() => handleChange('entryDate', '')}
            className={`p-3 rounded-lg border-2 transition-all text-black ${
              formData.entryDate !== 'גמיש' && formData.entryDate !== 'מיידי' && formData.entryDate !== undefined
                ? 'border-[#C9A24D] bg-[#C9A24D]/10'
                : 'border-gray-300 hover:border-[#C9A24D]'
            }`}
          >
            תאריך מדוייק
          </button>
        </div>
        {formData.entryDate !== 'גמיש' && formData.entryDate !== 'מיידי' && formData.entryDate !== undefined && (
          <input
            type="date"
            value={formData.entryDate || ''}
            onChange={(e) => handleChange('entryDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
              errors.entryDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        )}
        {errors.entryDate && <p className="text-sm text-red-500">{errors.entryDate}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          תיאור חופשי
        </label>
        <textarea
          value={formData.description ?? ''}
          onChange={(e) => handleChange('description', e.target.value || undefined)}
          maxLength={500}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] resize-none"
          placeholder="תאר את הנכס המבוקש בצורה חופשית (עד 500 תווים)"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.description?.length || 0}/500 תווים
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onPrev}
          className="px-8 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-gray-50 transition-all"
        >
          ← חזרה
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-[#C9A24D] text-white rounded-lg font-bold hover:bg-[#B08C3C] transition-all"
        >
          המשך →
        </button>
      </div>
    </form>
  );
};

export default WantedForRentStep3;
