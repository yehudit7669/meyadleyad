import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { citiesService, categoriesService } from '../../services/api';

interface PropertyFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
  showCategoryFilter?: boolean;
  onCategoryChange?: (categoryId?: string) => void;
  currentCategoryId?: string;
  availableCategories?: any[]; // רשימת קטגוריות זמינות (אופציונלי)
  wantedCategoriesOnly?: boolean; // הצג רק קטגוריות דרושים
}

export interface FilterValues {
  cityId?: string;
  propertyTypes: string[];
  priceRange: [number, number];
  rooms?: number;
  addressSearch?: string;
}

// סוגי נכסים
const propertyTypes = [
  { value: 'apartment', label: 'דירה' },
  { value: 'penthouse', label: 'פנטהאוז' },
  { value: 'duplex', label: 'דופלקס' },
  { value: 'garden_apartment', label: 'דירת גן' },
  { value: 'cottage', label: 'קוטג׳' },
  { value: 'villa', label: 'וילה' },
  { value: 'townhouse', label: 'בית עירוני' },
  { value: 'studio', label: 'סטודיו' },
  { value: 'loft', label: 'לופט' },
];

// אופציות חדרים (0.5 עד 7)
const roomOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7];

export default function PropertyFilters({ 
  onFilterChange, 
  initialFilters,
  showCategoryFilter = false,
  onCategoryChange,
  currentCategoryId,
  availableCategories,
  wantedCategoriesOnly = false
}: PropertyFiltersProps) {
  const [cityId, setCityId] = useState<string>(initialFilters?.cityId || '');
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(
    initialFilters?.propertyTypes || []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>(
    initialFilters?.priceRange || [0, 20000000]
  );
  const [rooms, setRooms] = useState<number | undefined>(initialFilters?.rooms);
  const [addressSearch, setAddressSearch] = useState<string>(initialFilters?.addressSearch || '');

  // Dropdowns open state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fetch cities
  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: citiesService.getCities,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch categories (only if showCategoryFilter is true AND availableCategories not provided)
  const { data: fetchedCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
    staleTime: 1000 * 60 * 10,
    enabled: showCategoryFilter && !availableCategories,
  });

  // Use provided categories or fetched ones
  let categories = availableCategories || fetchedCategories;

  // אם wantedCategoriesOnly, סנן רק קטגוריות דרושים
  if (wantedCategoriesOnly && categories) {
    const wantedCategorySlugs = [
      'apartments-for-sale',      // דירה למכירה
      'apartments-for-rent',      // דירה להשכרה
      'shabbat-apartments',       // דירות לשבת
      'wanted-commercial',        // דרושים - נדל"ן מסחרי
      'wanted-shared-ownership'   // דרושים - טאבו משותף
    ];
    categories = categories.filter((cat: any) => wantedCategorySlugs.includes(cat.slug));
    
    // הסר "דרושים - " מהתצוגה בסינון
    categories = categories.map((cat: any) => ({
      ...cat,
      nameHe: cat.nameHe.replace('דרושים - ', '')
    }));
  }

  // טווח מחירים
  const maxPrice = 20000000;
  const minPrice = 0;

  // פורמט מחיר
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M ₪`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K ₪`;
    }
    return `${price} ₪`;
  };

  // Toggle property type selection
  const togglePropertyType = (type: string) => {
    setSelectedPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const ref = dropdownRefs.current[openDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // עדכון הפילטרים כשמשהו משתנה
  useEffect(() => {
    onFilterChange({
      cityId: cityId || undefined,
      propertyTypes: selectedPropertyTypes,
      priceRange,
      rooms,
      addressSearch: addressSearch || undefined,
    });
  }, [cityId, selectedPropertyTypes, priceRange, rooms, addressSearch]);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  // Get selected city name
  const selectedCity = cities?.find((c: any) => c.id === cityId);
  const selectedCategory = categories?.find((c: any) => c.id === currentCategoryId);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6" dir="rtl">
      <div className="flex items-center gap-3 flex-wrap">
        {/* שדה חיפוש כתובת */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="#c89b4c" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={addressSearch}
            onChange={(e) => setAddressSearch(e.target.value)}
            placeholder="עיר, שכונה או רחוב"
            className="w-full pr-10 pl-4 py-2 bg-white border-2 border-gray-300 rounded-full hover:border-[#c89b4c] focus:border-[#c89b4c] focus:outline-none transition"
            style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}
          />
        </div>

        {/* סינון קטגוריה - רק אם showCategoryFilter הוא true */}
        {showCategoryFilter && (
          <div className="relative" ref={(el) => (dropdownRefs.current['category'] = el)}>
            <button
              onClick={() => toggleDropdown('category')}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full hover:border-[#c89b4c] transition flex items-center gap-2 w-28"
              style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}
            >
              <span className="font-bold truncate">{selectedCategory ? selectedCategory.nameHe : 'קטגוריה'}</span>
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${openDropdown === 'category' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {openDropdown === 'category' && (
              <div className="absolute top-full mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <button
                    onClick={() => {
                      onCategoryChange?.('');
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-right px-4 py-2 rounded hover:bg-gray-100 ${!currentCategoryId ? 'bg-[#c89b4c] bg-opacity-10 text-[#c89b4c] font-bold' : ''}`}
                    style={{ fontFamily: 'Assistant, sans-serif' }}
                  >
                    כל הקטגוריות
                  </button>
                  {categories?.map((category: any) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        onCategoryChange?.(category.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-right px-4 py-2 rounded hover:bg-gray-100 ${currentCategoryId === category.id ? 'bg-[#c89b4c] bg-opacity-10 text-[#c89b4c] font-bold' : ''}`}
                      style={{ fontFamily: 'Assistant, sans-serif', color: currentCategoryId === category.id ? '#c89b4c' : '#3f504f' }}
                    >
                      {category.nameHe}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* סינון עיר */}
        <div className="relative" ref={(el) => (dropdownRefs.current['city'] = el)}>
          <button
            onClick={() => toggleDropdown('city')}
            className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full hover:border-[#c89b4c] transition flex items-center gap-2 w-28"
            style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}
          >
            <span className="font-bold truncate">{selectedCity ? selectedCity.nameHe : 'עיר'}</span>
            <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${openDropdown === 'city' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === 'city' && (
            <div className="absolute top-full mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              <div className="p-2">
                <button
                  onClick={() => {
                    setCityId('');
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-right px-4 py-2 rounded hover:bg-gray-100 ${!cityId ? 'bg-[#c89b4c] bg-opacity-10 text-[#c89b4c] font-bold' : ''}`}
                  style={{ fontFamily: 'Assistant, sans-serif' }}
                >
                  כל הערים
                </button>
                {cities?.map((city: any) => (
                  <button
                    key={city.id}
                    onClick={() => {
                      setCityId(city.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-right px-4 py-2 rounded hover:bg-gray-100 ${cityId === city.id ? 'bg-[#c89b4c] bg-opacity-10 text-[#c89b4c] font-bold' : ''}`}
                    style={{ fontFamily: 'Assistant, sans-serif', color: cityId === city.id ? '#c89b4c' : '#3f504f' }}
                  >
                    {city.nameHe}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* סוג נכס */}
        <div className="relative" ref={(el) => (dropdownRefs.current['type'] = el)}>
          <button
            onClick={() => toggleDropdown('type')}
            className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full hover:border-[#c89b4c] transition flex items-center gap-2 w-28"
            style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}
          >
            <span className="font-bold truncate">
              {selectedPropertyTypes.length > 0 ? `סוג נכס (${selectedPropertyTypes.length})` : 'סוג נכס'}
            </span>
            <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${openDropdown === 'type' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === 'type' && (
            <div className="absolute top-full mt-2 w-72 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4">
              <div className="grid grid-cols-2 gap-2">
                {propertyTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPropertyTypes.includes(type.value)
                        ? 'border-[#c89b4c] bg-[#c89b4c] bg-opacity-10'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPropertyTypes.includes(type.value)}
                      onChange={() => togglePropertyType(type.value)}
                      className="w-4 h-4 text-[#c89b4c] border-gray-300 rounded focus:ring-[#c89b4c] accent-[#c89b4c]"
                    />
                    <span className="text-sm font-bold">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* מחיר */}
        <div className="relative" ref={(el) => (dropdownRefs.current['price'] = el)}>
          <button
            onClick={() => toggleDropdown('price')}
            className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full hover:border-[#c89b4c] transition flex items-center gap-2 w-28"
            style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}
          >
            <span className="font-bold truncate">
              {priceRange[0] > minPrice || priceRange[1] < maxPrice
                ? `${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`
                : 'מחיר'}
            </span>
            <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${openDropdown === 'price' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === 'price' && (
            <div className="absolute top-full mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-xs mb-1 font-bold" style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}>מינימום</label>
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                    style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}
                  />
                  <div className="text-xs text-center mt-1 font-bold" style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}>{formatPrice(priceRange[0])}</div>
                </div>
                <span className="mt-6" style={{ color: '#3f504f' }}>—</span>
                <div className="flex-1">
                  <label className="block text-xs mb-1 font-bold" style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}>מקסימום</label>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || maxPrice])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                    style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}
                  />
                  <div className="text-xs text-center mt-1 font-bold" style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}>{formatPrice(priceRange[1])}</div>
                </div>
              </div>
              
              {/* Slider */}
              <div className="px-2">
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  step={50000}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#c89b4c]"
                />
              </div>
            </div>
          )}
        </div>

        {/* חדרים */}
        <div className="relative" ref={(el) => (dropdownRefs.current['rooms'] = el)}>
          <button
            onClick={() => toggleDropdown('rooms')}
            className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full hover:border-[#c89b4c] transition flex items-center gap-2 w-28"
            style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}
          >
            <span className="font-bold truncate">{rooms ? `${rooms} חדרים` : 'חדרים'}</span>
            <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${openDropdown === 'rooms' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === 'rooms' && (
            <div className="absolute top-full mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              <div className="p-2">
                <button
                  onClick={() => {
                    setRooms(undefined);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-right px-4 py-2 rounded hover:bg-gray-100 ${!rooms ? 'bg-[#c89b4c] bg-opacity-10 text-[#c89b4c] font-bold' : ''}`}
                  style={{ fontFamily: 'Assistant, sans-serif' }}
                >
                  כל המספרים
                </button>
                {roomOptions.map((room) => (
                  <button
                    key={room}
                    onClick={() => {
                      setRooms(room);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-right px-4 py-2 rounded hover:bg-gray-100 ${rooms === room ? 'bg-[#c89b4c] bg-opacity-10 text-[#c89b4c] font-bold' : ''}`}
                    style={{ fontFamily: 'Assistant, sans-serif', color: rooms === room ? '#c89b4c' : '#3f504f' }}
                  >
                    {room}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {(cityId || selectedPropertyTypes.length > 0 || rooms || priceRange[0] > minPrice || priceRange[1] < maxPrice || addressSearch || currentCategoryId) && (
          <button
            onClick={() => {
              setCityId('');
              setSelectedPropertyTypes([]);
              setPriceRange([minPrice, maxPrice]);
              setRooms(undefined);
              setAddressSearch('');
              if (showCategoryFilter && onCategoryChange) {
                onCategoryChange('');
              }
            }}
            className="px-4 py-2 text-sm font-bold hover:text-red-600 transition"
            style={{ fontFamily: 'Assistant, sans-serif', color: '#3f504f' }}
          >
            ✕ נקה הכל
          </button>
        )}
      </div>
    </div>
  );
}

