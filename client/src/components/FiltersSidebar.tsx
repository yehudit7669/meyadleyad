import { useQuery } from '@tanstack/react-query';
import { categoriesService, citiesService } from '../services/api';

interface FiltersSidebarProps {
  filters: {
    search: string;
    categoryId: string;
    cityId: string;
    minPrice: string;
    maxPrice: string;
  };
  onChange: (name: string, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function FiltersSidebar({
  filters,
  onChange,
  onSearch,
  onReset,
}: FiltersSidebarProps) {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: citiesService.getCities,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e.target.name, e.target.value);
  };

  const hasActiveFilters =
    filters.categoryId || filters.cityId || filters.minPrice || filters.maxPrice;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4" dir="rtl" style={{ fontFamily: 'Assistant, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: '#3f504f' }}>סינון תוצאות</h2>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            aria-label="נקה כל המסננים"
            className="text-sm text-blue-600 hover:underline"
          >
            נקה הכל
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* חיפוש טקסט */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔍 חיפוש חופשי
          </label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="חפש מילות מפתח..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            style={{ color: '#3f504f' }}
          />
        </div>

        {/* קטגוריה */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📁 קטגוריה
          </label>
          <select
            name="categoryId"
            value={filters.categoryId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            style={{ color: '#3f504f' }}
          >
            <option value="">כל הקטגוריות</option>
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameHe}
              </option>
            ))}
          </select>
        </div>

        {/* עיר */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📍 עיר
          </label>
          <select
            name="cityId"
            value={filters.cityId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            style={{ color: '#3f504f' }}
          >
            <option value="">כל הערים</option>
            {cities?.map((city: any) => (
              <option key={city.id} value={city.id}>
                {city.nameHe}
              </option>
            ))}
          </select>
        </div>

        {/* טווח מחירים */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💰 טווח מחירים
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleChange}
                placeholder="מינימום"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                style={{ color: '#3f504f' }}
                min="0"
              />
            </div>
            <div>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleChange}
                placeholder="מקסימום"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                style={{ color: '#3f504f' }}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* כפתור חיפוש */}
        <button
          onClick={onSearch}
          aria-label="חפש לפי המסננים"
          className="w-full text-white py-3 rounded-lg font-bold transition"
          style={{ backgroundColor: '#c89b4c' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b88a3d'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c89b4c'}
        >
          🔍 חפש
        </button>

        {/* סטטיסטיקה */}
        {hasActiveFilters && (
          <div className="mt-6 pt-6 border-t">
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-2">פילטרים פעילים:</div>
              <div className="space-y-1">
                {filters.categoryId && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    <span>קטגוריה נבחרה</span>
                  </div>
                )}
                {filters.cityId && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    <span>עיר נבחרה</span>
                  </div>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    <span>טווח מחיר</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
