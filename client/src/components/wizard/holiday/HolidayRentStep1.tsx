import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HolidayRentStep1Data, holidayRentStep1Schema } from '../../../types/wizard';
import { citiesService, streetsService } from '../../../services/api';

interface HolidayRentStep1Props {
  data: Partial<HolidayRentStep1Data>;
  onNext: (data: HolidayRentStep1Data) => void;
  onBack?: () => void;
}

const HolidayRentStep1: React.FC<HolidayRentStep1Props> = ({ data, onNext }) => {
  const [formData, setFormData] = useState<Partial<HolidayRentStep1Data>>({
    cityId: '',
    cityName: 'בית שמש',
    streetId: data.streetId || '',
    streetName: data.streetName || '',
    neighborhoodId: data.neighborhoodId || '',
    neighborhoodName: data.neighborhoodName || '',
    houseNumber: data.houseNumber || 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [streetSearch, setStreetSearch] = useState(data.streetName || '');
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const streetDropdownRef = useRef<HTMLDivElement>(null);

  console.log('STREET FIELD INIT - HolidayRentStep1');

  // Get Beit Shemesh city
  const { data: beitShemeshCity } = useQuery({
    queryKey: ['beit-shemesh-city'],
    queryFn: citiesService.getBeitShemesh,
  });

  // Set Beit Shemesh as default city
  useEffect(() => {
    if (beitShemeshCity && !formData.cityId) {
      setFormData((prev) => ({
        ...prev,
        cityId: beitShemeshCity.id,
        cityName: beitShemeshCity.nameHe || 'בית שמש',
      }));
    }
  }, [beitShemeshCity]);

  // Get all streets
  const { data: allStreets } = useQuery({
    queryKey: ['all-streets', formData.cityId],
    queryFn: () =>
      streetsService.getStreets({
        cityId: formData.cityId!,
        limit: 500,
      }),
    enabled: !!formData.cityId,
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
    setErrors((prev) => ({ ...prev, streetId: '' }));
    
    console.log('Street selected:', street.name);
  };

  const handleHouseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : 0;
    setFormData((prev) => ({ ...prev, houseNumber: value }));
    setErrors((prev) => ({ ...prev, houseNumber: '' }));
  };

  const handleNext = () => {
    try {
      const validated = holidayRentStep1Schema.parse(formData);
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1F3F3A]">כתובת הנכס</h2>
      <p className="text-gray-600">מלאו את כתובת הדירה לשבת (בית שמש בלבד)</p>

      {/* City (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
          עיר <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value="בית שמש"
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
        />
        <p className="mt-1 text-xs text-gray-500">כרגע המערכת תומכת בבית שמש בלבד</p>
      </div>

      {/* Street (Autocomplete) */}
      <div className="relative" ref={streetDropdownRef}>
        <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
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
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] pr-10 ${
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
        {errors.streetId && <p className="text-red-500 text-sm mt-1">{errors.streetId}</p>}

        {/* Dropdown */}
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
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-[#1F3F3A]">{street.name}</div>
                        {street.neighborhoodName && (
                          <div className="text-sm text-gray-500">שכונה: {street.neighborhoodName}</div>
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
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-[#1F3F3A]">{street.name}</div>
                        {street.neighborhoodName && (
                          <div className="text-sm text-gray-500">שכונה: {street.neighborhoodName}</div>
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

      {/* House Number */}
      <div>
        <label className="block text-sm font-medium text-[#1F3F3A] mb-2">
          מספר בית <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="1"
          value={formData.houseNumber || ''}
          onChange={handleHouseNumberChange}
          placeholder="הזן מספר בלבד"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] ${
            errors.houseNumber ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.houseNumber && <p className="text-red-500 text-sm mt-1">{errors.houseNumber}</p>}
      </div>

      {/* Neighborhood (Auto-populated, read-only) */}
      {formData.neighborhoodName && (
        <div>
          <label className="block text-sm font-medium text-[#1F3F3A] mb-2">שכונה</label>
          <input
            type="text"
            value={formData.neighborhoodName}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
          />
          <p className="mt-1 text-xs text-gray-500">השכונה מתמלאת אוטומטית לפי הרחוב</p>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-4">
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

export default HolidayRentStep1;
