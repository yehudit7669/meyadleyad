import React, { useState } from 'react';
import {
  WantedForSaleStep3Data,
  PropertyType,
  PropertyCondition,
  FurnitureStatus,
  wantedForSaleStep3Schema,
} from '../../../types/wizard';
import {
  PROPERTY_TYPE_OPTIONS,
  ROOMS_OPTIONS,
  CONDITION_OPTIONS,
  FURNITURE_OPTIONS,
} from '../../../constants/adTypes';

interface Props {
  data?: WantedForSaleStep3Data;
  onNext: (data: WantedForSaleStep3Data) => void;
  onPrev: () => void;
}

const WantedForSaleStep3: React.FC<Props> = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState<WantedForSaleStep3Data>(
    data || {
      propertyType: PropertyType.APARTMENT,
      rooms: 3,
      squareMeters: 0,
      floor: 0,
      balconies: 0,
      condition: PropertyCondition.MAINTAINED,
      furniture: FurnitureStatus.NONE,
      features: {
        parking: false,
        storage: false,
        view: false,
        airConditioning: false,
        sukkaBalcony: false,
        parentalUnit: false,
        safeRoom: false,
        yard: false,
        housingUnit: false,
        elevator: false,
        hasOption: false,
      },
      priceRequested: 0,
      arnona: 0,
      vaad: 0,
      entryDate: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof WantedForSaleStep3Data, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFeatureToggle = (feature: keyof WantedForSaleStep3Data['features']) => {
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
      wantedForSaleStep3Schema.parse(formData);
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
        <p className="text-gray-600">תאר את הנכס שאתה מחפש</p>
      </div>

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
            מספר חדרים <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.rooms}
            onChange={(e) => handleChange('rooms', parseFloat(e.target.value))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
              errors.rooms ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {ROOMS_OPTIONS.filter(opt => opt.value <= 8).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.rooms && <p className="text-sm text-red-500">{errors.rooms}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שטח במ״ר <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.squareMeters || ''}
            onChange={(e) => handleChange('squareMeters', parseInt(e.target.value) || 0)}
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
            value={formData.floor}
            onChange={(e) => handleChange('floor', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">מרפסות</label>
          <select
            value={formData.balconies}
            onChange={(e) => handleChange('balconies', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
          >
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
          מצב הנכס <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CONDITION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('condition', option.value as PropertyCondition)}
              className={`p-3 rounded-lg border-2 transition-all ${
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
              onClick={() => handleChange('furniture', option.value as FurnitureStatus)}
              className={`p-3 rounded-lg border-2 transition-all ${
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

      {/* Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">מה בנכס?</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: 'parking', label: 'חניה' },
            { key: 'storage', label: 'מחסן' },
            { key: 'view', label: 'נוף' },
            { key: 'airConditioning', label: 'מיזוג' },
            { key: 'sukkaBalcony', label: 'מרפסת סוכה' },
            { key: 'parentalUnit', label: 'יחידת הורים' },
            { key: 'safeRoom', label: 'ממ״ד' },
            { key: 'yard', label: 'חצר' },
            { key: 'housingUnit', label: 'יחידת דיור' },
            { key: 'elevator', label: 'מעלית' },
            { key: 'hasOption', label: 'אופציה' },
          ].map((feature) => (
            <button
              key={feature.key}
              type="button"
              onClick={() => handleFeatureToggle(feature.key as keyof WantedForSaleStep3Data['features'])}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.features[feature.key as keyof WantedForSaleStep3Data['features']]
                  ? 'border-[#C9A24D] bg-[#C9A24D] text-white'
                  : 'border-gray-300 hover:border-[#C9A24D]'
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
            מחיר מבוקש (תקציב) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.priceRequested || ''}
            onChange={(e) => handleChange('priceRequested', parseInt(e.target.value) || 0)}
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
            value={formData.arnona || ''}
            onChange={(e) => handleChange('arnona', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
            placeholder="₪"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ועד בית</label>
          <input
            type="number"
            value={formData.vaad || ''}
            onChange={(e) => handleChange('vaad', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
            placeholder="₪"
          />
        </div>
      </div>

      {/* Entry Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          תאריך כניסה רצוי <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.entryDate}
          onChange={(e) => handleChange('entryDate', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
            errors.entryDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.entryDate && <p className="text-sm text-red-500">{errors.entryDate}</p>}
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

export default WantedForSaleStep3;
