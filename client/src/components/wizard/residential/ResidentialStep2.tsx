import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { citiesService, streetsService } from '../../../services/api';
import { ResidentialStep2Data } from '../../../types/wizard';
import { residentialStep2Schema } from '../../../types/wizard';
import { WizardStepProps } from '../../../types/wizard';

const ResidentialStep2: React.FC<WizardStepProps> = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState<ResidentialStep2Data>(
    data || {
      cityId: '', // Will be set from beitShemeshCity
      cityName: 'בית שמש',
      streetId: '',
      streetName: '',
      neighborhoodId: '',
      neighborhoodName: '',
      houseNumber: 0,
      addressSupplement: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [streetSearch, setStreetSearch] = useState(data?.streetName || '');
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const streetDropdownRef = useRef<HTMLDivElement>(null);

  console.log('STREET FIELD INIT - ResidentialStep2');

  // Get Beit Shemesh city
  const { data: beitShemeshCity } = useQuery({
    queryKey: ['beit-shemesh-city'],
    queryFn: citiesService.getBeitShemesh,
  });

  // Set Beit Shemesh as default city
  useEffect(() => {
    if (beitShemeshCity) {
      // Always update cityId to the current Beit Shemesh ID (in case it changed from import)
      if (!formData.cityId || formData.cityId !== beitShemeshCity.id) {
        console.log('[UPDATING CITY ID] from', formData.cityId, 'to', beitShemeshCity.id);
        setFormData((prev) => ({
          ...prev,
          cityId: beitShemeshCity.id,
          cityName: beitShemeshCity.nameHe || 'בית שמש',
          // Reset street selection when city changes
          streetId: '',
          streetName: '',
          neighborhoodId: '',
          neighborhoodName: '',
        }));
        setStreetSearch('');
      }
    }
  }, [beitShemeshCity]);

  // Get all streets
  const { data: allStreets } = useQuery({
    queryKey: ['all-streets', formData.cityId],
    queryFn: () => {
      console.log('[FETCHING STREETS] cityId:', formData.cityId);
      return streetsService.getStreets({
        cityId: formData.cityId!,
        limit: 500,
      });
    },
    enabled: !!formData.cityId && formData.cityId.length > 10, // Ensure it's a UUID, not a name
  });

  // Get searched streets
  const { data: searchedStreets, isLoading: streetsLoading } = useQuery({
    queryKey: ['streets-search', streetSearch, formData.cityId],
    queryFn: () =>
      streetsService.getStreets({
        query: streetSearch,
        cityId: formData.cityId!,
        limit: 50,
      }),
    enabled: !!formData.cityId && streetSearch.length >= 2,
  });

  // Log when streets are loaded
  useEffect(() => {
    if (allStreets) {
      console.log('STREETS OPTIONS (all):', allStreets.length);
    }
    if (searchedStreets) {
      console.log('STREETS OPTIONS (search):', searchedStreets);
    }
  }, [allStreets, searchedStreets]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        streetDropdownRef.current &&
        !streetDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStreetDropdown(false);
      }
    };

    if (showStreetDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStreetDropdown]);

  const handleStreetSelect = (street: any) => {
    setFormData({
      ...formData,
      streetId: street.id,
      streetName: street.name,
      neighborhoodId: street.neighborhoodId || '',
      neighborhoodName: street.neighborhoodName || '',
    });
    setStreetSearch(street.name);
    setShowStreetDropdown(false);

    // Clear error
    if (errors.streetId) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.streetId;
        return newErrors;
      });
    }
    
    console.log('Street selected:', street.name);
  };

  const handleChange = (field: keyof ResidentialStep2Data, value: any) => {
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

  const handleNext = () => {
    try {
      residentialStep2Schema.parse(formData);
      onNext(formData);
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message;
        });
      }
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">כתובת הנכס</h2>
        <p className="text-gray-600">הזן את כתובת הנכס המלאה</p>
      </div>

      <div className="space-y-4">
        {/* City (Read Only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            עיר <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.cityName}
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            כרגע המערכת תומכת בבית שמש בלבד
          </p>
        </div>

        {/* Street */}
        <div className="relative" ref={streetDropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            רחוב <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={streetSearch}
              onChange={(e) => {
                setStreetSearch(e.target.value);
                setShowStreetDropdown(e.target.value.length >= 2 || e.target.value.length === 0);
              }}
              onFocus={() => setShowStreetDropdown(true)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent pr-10 ${
                errors.streetId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="התחל להקליד שם רחוב או לחץ לבחירה..."
              autoComplete="off"
            />
            {/* Dropdown toggle button */}
            <button
              type="button"
              onClick={() => setShowStreetDropdown(!showStreetDropdown)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="הצג את כל הרחובות"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          {errors.streetId && (
            <p className="mt-1 text-sm text-red-500">{errors.streetId}</p>
          )}

          {/* Street Dropdown */}
          {showStreetDropdown && (
            <div className="absolute z-10 w-full mt-2 border border-gray-300 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg">
              {streetSearch.length >= 2 ? (
                // Show search results when typing
                <>
                  {streetsLoading && (
                    <div className="p-4 text-center text-gray-500">טוען רחובות...</div>
                  )}
                  {!streetsLoading && searchedStreets && searchedStreets.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      לא נמצאו רחובות התואמים לחיפוש
                    </div>
                  )}
                  {!streetsLoading && searchedStreets && searchedStreets.length > 0 && (
                    <ul>
                      {searchedStreets.map((street: any) => (
                        <li
                          key={street.id}
                          onClick={() => handleStreetSelect(street)}
                          className="px-4 py-3 hover:bg-[#C9A24D] hover:bg-opacity-10 cursor-pointer border-b last:border-b-0 transition-colors"
                        >
                          <div className="font-medium">{street.name}</div>
                          {street.neighborhoodName && (
                            <div className="text-sm text-gray-600">שכונה: {street.neighborhoodName}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                // Show all streets when dropdown is opened without search
                <>
                  {!allStreets && (
                    <div className="p-4 text-center text-gray-500">טוען רחובות...</div>
                  )}
                  {allStreets && allStreets.length === 0 && (
                    <div className="p-4 text-center text-gray-500">אין רחובות זמינים</div>
                  )}
                  {allStreets && allStreets.length > 0 && (
                    <ul>
                      {allStreets.map((street: any) => (
                        <li
                          key={street.id}
                          onClick={() => handleStreetSelect(street)}
                          className="px-4 py-3 hover:bg-[#C9A24D] hover:bg-opacity-10 cursor-pointer border-b last:border-b-0 transition-colors"
                        >
                          <div className="font-medium">{street.name}</div>
                          {street.neighborhoodName && (
                            <div className="text-sm text-gray-600">שכונה: {street.neighborhoodName}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Neighborhood (Auto-filled, Read Only) */}
        {formData.neighborhoodName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שכונה</label>
            <input
              type="text"
              value={formData.neighborhoodName}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>
        )}

        {/* House Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מספר בית <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.houseNumber === 0 ? '' : formData.houseNumber}
            onChange={(e) => handleChange('houseNumber', e.target.value ? parseInt(e.target.value, 10) : 0)}
            onFocus={() => {
              if (formData.houseNumber === 0) {
                handleChange('houseNumber', '');
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
              errors.houseNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="לדוגמה: 12"
            min="1"
          />
          {errors.houseNumber && (
            <p className="mt-1 text-sm text-red-500">{errors.houseNumber}</p>
          )}
        </div>

        {/* Address Supplement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תוספת כתובת (אופציונלי)
          </label>
          <input
            type="text"
            value={formData.addressSupplement || ''}
            onChange={(e) => handleChange('addressSupplement', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
            placeholder="לדוגמה: דירה 4, כניסה ב'"
          />
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

export default ResidentialStep2;
