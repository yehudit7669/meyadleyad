import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HolidayRentStep3Data, holidayRentStep3Schema, PropertyType } from '../../../types/wizard';
import { parashaService } from '../../../services/api';
import {
  PROPERTY_TYPE_OPTIONS,
  PURPOSE_OPTIONS,
  BALCONIES_COUNT_OPTIONS,
} from '../../../constants/adTypes';

interface HolidayRentStep3Props {
  data: Partial<HolidayRentStep3Data>;
  isPaid: boolean;
  onNext: (data: HolidayRentStep3Data) => void;
  onBack: () => void;
}

const HolidayRentStep3: React.FC<HolidayRentStep3Props> = ({ data, isPaid, onNext, onBack }) => {
  const [formData, setFormData] = useState<Partial<HolidayRentStep3Data>>({
    parasha: data.parasha || '',
    propertyType: data.propertyType || PropertyType.APARTMENT,
    rooms: data.rooms,
    purpose: data.purpose || 'HOSTING',
    floor: data.floor,
    balconiesCount: data.balconiesCount || 0,
    beds: data.beds,
    priceRequested: data.priceRequested,
    description: data.description,
    features: data.features || {
      plata: false,
      urn: false,
      view: false,
      linens: false,
      ac: false,
      balcony: false,
      pool: false,
      yard: false,
      kidsGames: false,
      babyBed: false,
      masterUnit: false,
      sleepingOnly: false,
      accessibleForDisabled: false,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load upcoming parashot from API
  const { data: parashot, isLoading: parashotLoading } = useQuery({
    queryKey: ['parashot'],
    queryFn: () => parashaService.getUpcoming(30),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const handleInputChange = (field: keyof HolidayRentStep3Data, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleFeatureToggle = (feature: keyof HolidayRentStep3Data['features']) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features!,
        [feature]: !prev.features![feature],
      },
    }));
  };

  const handleNext = () => {
    try {
      const validated = holidayRentStep3Schema.parse(formData);
      setErrors({});
      onNext(validated);
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setErrors(fieldErrors);
    }
  };

  const featuresList = [
    { key: 'plata', label: 'פלטה', icon: '🔥' },
    { key: 'urn', label: 'מיחם', icon: '☕' },
    { key: 'view', label: 'נוף', icon: '🌄' },
    { key: 'linens', label: 'מצעים', icon: '🛏️' },
    { key: 'ac', label: 'מיזוג', icon: '❄️' },
    { key: 'balcony', label: 'מרפסת', icon: '🏡' },
    { key: 'pool', label: 'בריכה', icon: '🏊' },
    { key: 'yard', label: 'חצר', icon: '🌳' },
    { key: 'kidsGames', label: 'משחקי ילדים', icon: '🎮' },
    { key: 'babyBed', label: 'מיטת תינוק', icon: '👶' },
    { key: 'masterUnit', label: 'יחידת הורים', icon: '🚪' },
    { key: 'sleepingOnly', label: 'לינה בלבד', icon: '😴' },    { key: 'accessibleForDisabled', label: 'נגישה לנכים', icon: '♿' },  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1F3F3A]">פרטי הדירה לשבת</h2>
      <p className="text-gray-600">מלאו את כל הפרטים על הדירה</p>

      {/* Parasha */}
      <div>
        <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
          פרשה <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.parasha}
          onChange={(e) => handleInputChange('parasha', e.target.value)}
          disabled={parashotLoading}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
            errors.parasha ? 'border-red-500' : 'border-gray-300'
          } ${parashotLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="">{parashotLoading ? 'טוען פרשות...' : 'בחר פרשה'}</option>
          {parashot?.map((parasha) => (
            <option key={parasha.name} value={parasha.name}>
              {parasha.name} ({new Date(parasha.date).toLocaleDateString('he-IL')})
            </option>
          ))}
        </select>
        {errors.parasha && <p className="text-red-500 text-sm mt-1">{errors.parasha}</p>}
      </div>

      {/* Property Type & Rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
            סוג נכס <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.propertyType}
            onChange={(e) => handleInputChange('propertyType', e.target.value as PropertyType)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
              errors.propertyType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.propertyType && (
            <p className="text-red-500 text-sm mt-1">{errors.propertyType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
            מספר חדרים <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={formData.rooms || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleInputChange('rooms', isNaN(value) ? undefined : value);
            }}
            placeholder="לדוגמה: 3.5"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
              errors.rooms ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.rooms && <p className="text-red-500 text-sm mt-1">{errors.rooms}</p>}
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
          מטרה <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PURPOSE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange('purpose', option.value)}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                formData.purpose === option.value
                  ? 'border-[#C9A24D] bg-[#E6D3A3] bg-opacity-20'
                  : 'border-gray-300 hover:border-[#C9A24D]'
              }`}
            >
              <h3 className="text-md font-semibold text-[#1F3F3A]">{option.label}</h3>
            </button>
          ))}
        </div>
        {errors.purpose && <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>}
      </div>

      {/* Floor & Balconies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1F3F3A] mb-2">קומה (אופציונלי)</label>
          <input
            type="number"
            step="0.5"
            value={typeof formData.floor === 'number' ? formData.floor : formData.floor || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleInputChange('floor', undefined);
              } else {
                const numValue = parseFloat(value);
                handleInputChange('floor', isNaN(numValue) ? undefined : numValue);
              }
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
              errors.floor ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="לדוגמה: 2.5 (מותר ערכים שליליים)"
          />
          {errors.floor && <p className="text-red-500 text-sm mt-1">{errors.floor}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1F3F3A] mb-2">מרפסות</label>
          <select
            value={formData.balconiesCount}
            onChange={(e) => handleInputChange('balconiesCount', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
          >
            {BALCONIES_COUNT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Beds (Optional) */}
      <div>
        <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
          מספר מיטות (אופציונלי)
        </label>
        <input
          type="number"
          min="1"
          value={formData.beds || ''}
          onChange={(e) => {
            const value = e.target.value;
            handleInputChange('beds', value === '' ? undefined : parseInt(value));
          }}
          placeholder="הזן מספר מיטות"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
            errors.beds ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.beds && <p className="text-red-500 text-sm mt-1">{errors.beds}</p>}
      </div>

      {/* Features */}
      <div>
        <label className="block text-sm font-medium text-[#1F3F3A] mb-3">מאפיינים נוספים</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {featuresList.map((feature) => (
            <button
              key={feature.key}
              type="button"
              onClick={() =>
                handleFeatureToggle(feature.key as keyof HolidayRentStep3Data['features'])
              }
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                formData.features![feature.key as keyof HolidayRentStep3Data['features']]
                  ? 'border-[#C9A24D] bg-[#E6D3A3] bg-opacity-20'
                  : 'border-gray-300 hover:border-[#C9A24D]'
              }`}
            >
              <div className="text-2xl mb-1">{feature.icon}</div>
              <p className="text-xs font-medium text-[#1F3F3A]">{feature.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Price Requested (Only if isPaid is true) */}
      {isPaid && (
        <div>
          <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
            מחיר מבוקש (אופציונלי)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={formData.priceRequested || ''}
              onChange={(e) =>
                handleInputChange(
                  'priceRequested',
                  e.target.value === '' ? undefined : parseInt(e.target.value)
                )
              }
              placeholder="הזן מחיר (לא חובה)"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
                errors.priceRequested ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              ₪
            </span>
          </div>
          {errors.priceRequested && (
            <p className="text-red-500 text-sm mt-1">{errors.priceRequested}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            אם לא תמלא, לא יוצג מחיר במודעה. השדה אופציונלי גם אם בחרת "בתשלום"
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
          תיאור (אופציונלי)
        </label>
        <textarea
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent resize-none"
          rows={4}
          placeholder="ספר קצת על הנכס (עד 16 מילים)"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.description?.trim().split(/\s+/).filter(w => w.length > 0).length || 0}/16 מילים
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          חזור
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-[#1F3F3A] text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          המשך לשלב הבא
        </button>
      </div>
    </div>
  );
};

export default HolidayRentStep3;
