import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  WantedHolidayStep3Data,
  PropertyType,
  wantedHolidayStep3Schema,
} from '../../../types/wizard';
import { parashaService } from '../../../services/api';
import {
  PROPERTY_TYPE_OPTIONS,
  PURPOSE_OPTIONS,
  BALCONIES_COUNT_OPTIONS,
} from '../../../constants/adTypes';

interface Props {
  data?: WantedHolidayStep3Data;
  onNext: (data: WantedHolidayStep3Data) => void;
  onPrev: () => void;
  isPaid: boolean;
}

const WantedHolidayStep3: React.FC<Props> = ({ data, onNext, onPrev, isPaid }) => {
  const [formData, setFormData] = useState<WantedHolidayStep3Data>(
    data || {
      parasha: '',
      propertyType: undefined,
      rooms: undefined,
      purpose: 'HOSTING',
      floor: 0,
      balconiesCount: 0,
      beds: undefined,
      priceRequested: undefined,
      description: undefined,
      features: {
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
      },
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load upcoming parashot from API
  const { data: parashot, isLoading: parashotLoading } = useQuery({
    queryKey: ['parashot'],
    queryFn: () => parashaService.getUpcoming(30),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const handleChange = (field: keyof WantedHolidayStep3Data, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFeatureToggle = (feature: keyof WantedHolidayStep3Data['features']) => {
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
    
    // If not paid, remove price
    const finalData = {
      ...formData,
      priceRequested: isPaid ? formData.priceRequested : undefined,
    };

    try {
      wantedHolidayStep3Schema.parse(finalData);
      onNext(finalData);
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
        <p className="text-gray-600">תאר את הדירה שאתה מחפש לשבת</p>
      </div>

      {/* Parasha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          פרשה <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.parasha}
          onChange={(e) => handleChange('parasha', e.target.value)}
          disabled={parashotLoading}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
            errors.parasha ? 'border-red-500' : 'border-gray-300'
          } ${parashotLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="">{parashotLoading ? 'טוען פרשות...' : 'בחר פרשה...'}</option>
          {parashot?.map((parasha) => (
            <option key={parasha.name} value={parasha.name}>
              {parasha.name} ({new Date(parasha.date).toLocaleDateString('he-IL')})
            </option>
          ))}
        </select>
        {errors.parasha && <p className="text-sm text-red-500">{errors.parasha}</p>}
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

      {/* Rooms and Beds */}
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
            מספר מיטות (אופציונלי)
          </label>
          <input
            type="number"
            min="1"
            value={formData.beds ?? ''}
            onChange={(e) => handleChange('beds', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
            placeholder="מספר מיטות"
          />
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          מטרה <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PURPOSE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('purpose', option.value as 'HOSTING' | 'SLEEPING_ONLY')}
              className={`p-4 rounded-lg border-2 transition-all text-black ${
                formData.purpose === option.value
                  ? 'border-[#C9A24D] bg-[#C9A24D]/10'
                  : 'border-gray-300 hover:border-[#C9A24D]'
              }`}
            >
              {option.label}
            </button>
          ))}
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
            value={formData.balconiesCount}
            onChange={(e) => handleChange('balconiesCount', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
          >
            {BALCONIES_COUNT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">פרטים / מאפיינים</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: 'plata', label: 'פלטה' },
            { key: 'urn', label: 'מיחם' },
            { key: 'view', label: 'נוף' },
            { key: 'linens', label: 'מצעים' },
            { key: 'ac', label: 'מיזוג' },
            { key: 'balcony', label: 'מרפסת' },
            { key: 'pool', label: 'בריכה' },
            { key: 'yard', label: 'חצר' },
            { key: 'kidsGames', label: 'משחקי ילדים' },
            { key: 'babyBed', label: 'מיטת תינוק' },
            { key: 'masterUnit', label: 'יחידת הורים' },
            { key: 'sleepingOnly', label: 'לינה בלבד' },
          ].map((feature) => (
            <button
              key={feature.key}
              type="button"
              onClick={() => handleFeatureToggle(feature.key as keyof WantedHolidayStep3Data['features'])}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.features[feature.key as keyof WantedHolidayStep3Data['features']]
                  ? 'border-[#C9A24D] bg-[#C9A24D] text-white'
                  : 'border-gray-300 hover:border-[#C9A24D] text-black'
              }`}
            >
              {feature.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price (only if isPaid) */}
      {isPaid && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מחיר מבוקש (אופציונלי)
          </label>
          <input
            type="number"
            value={formData.priceRequested || ''}
            onChange={(e) => {
              const value = e.target.value;
              handleChange('priceRequested', value === '' ? undefined : parseInt(value));
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D]"
            placeholder="₪"
          />
          <p className="text-sm text-gray-500 mt-1">
            ניתן להשאיר ריק אם אין מחיר קבוע
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          תיאור חופשי (אופציונלי)
        </label>
        <textarea
          value={formData.description ?? ''}
          onChange={(e) => handleChange('description', e.target.value || undefined)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] resize-none"
          placeholder="תאר את הדירה המבוקשת בצורה חופשית (עד 16 מילים)"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.description?.trim().split(/\s+/).filter(w => w.length > 0).length || 0}/16 מילים
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

export default WantedHolidayStep3;
