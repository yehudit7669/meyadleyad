import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, categoriesService, citiesService } from '../../services/api';
import { NewsletterFilters as FiltersType } from '../../types/profile';

interface NewsletterFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: Partial<FiltersType>;
}

export default function NewsletterFilters({ isOpen, onClose, currentFilters }: NewsletterFiltersProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Partial<FiltersType>>(currentFilters);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: citiesService.getCities,
  });

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: any) => profileService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      onClose();
    },
  });

  const handleSave = () => {
    updatePreferencesMutation.mutate({ filters });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const current = filters.categories || [];
    const updated = current.includes(categoryId)
      ? current.filter(id => id !== categoryId)
      : [...current, categoryId];
    setFilters({ ...filters, categories: updated });
  };

  const handleRegionToggle = (cityId: string) => {
    const current = filters.regions || [];
    const updated = current.includes(cityId)
      ? current.filter(id => id !== cityId)
      : [...current, cityId];
    setFilters({ ...filters, regions: updated });
  };

  const handlePropertyTypeToggle = (type: string) => {
    const current = filters.propertyTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setFilters({ ...filters, propertyTypes: updated });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">בחירת מסננים לקובץ השבועי</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">קטגוריות</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories?.map((category: any) => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categories?.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{category.nameHe}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Regions/Cities */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">אזורים/ערים</h3>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
              {cities?.map((city: any) => (
                <label key={city.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.regions?.includes(city.id)}
                    onChange={() => handleRegionToggle(city.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{city.nameHe}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">טווח מחירים</h3>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">מחיר מינימלי</label>
                <input
                  type="number"
                  value={filters.priceRange?.min ?? ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: {
                      min: e.target.value ? Number(e.target.value) : null,
                      max: filters.priceRange?.max ?? null,
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="מינימום"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">מחיר מקסימלי</label>
                <input
                  type="number"
                  value={filters.priceRange?.max ?? ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: {
                      min: filters.priceRange?.min ?? null,
                      max: e.target.value ? Number(e.target.value) : null,
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="מקסימום"
                />
              </div>
            </div>
          </div>

          {/* Property Types */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">סוג נכס</h3>
            <div className="grid grid-cols-2 gap-2">
              {['דירה', 'בית', 'מגרש', 'משרד', 'חנות'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.propertyTypes?.includes(type)}
                    onChange={() => handlePropertyTypeToggle(type)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Publisher Type */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">סוג מפרסם</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publisherType"
                  checked={!filters.publisherType}
                  onChange={() => setFilters({ ...filters, publisherType: undefined })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">הכל</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publisherType"
                  checked={filters.publisherType === 'OWNER'}
                  onChange={() => setFilters({ ...filters, publisherType: 'OWNER' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">בעלים בלבד</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publisherType"
                  checked={filters.publisherType === 'BROKER'}
                  onChange={() => setFilters({ ...filters, publisherType: 'BROKER' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">מתווכים בלבד</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={updatePreferencesMutation.isPending}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {updatePreferencesMutation.isPending ? 'שומר...' : 'שמור מסננים'}
          </button>
        </div>

        {updatePreferencesMutation.isError && (
          <div className="px-6 pb-4 text-sm text-red-600">
            שגיאה בשמירת המסננים. אנא נסה שוב.
          </div>
        )}
      </div>
    </div>
  );
}
