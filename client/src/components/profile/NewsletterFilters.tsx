import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, categoriesService, citiesService } from '../../services/api';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface NotificationFilters {
  categoryIds?: string[];
  cityIds?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  propertyTypes?: string[];
  publisherTypes?: ('OWNER' | 'BROKER')[];
}

interface NewsletterFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: Partial<NotificationFilters>;
}

export default function NewsletterFilters({ isOpen, onClose, currentFilters }: NewsletterFiltersProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Partial<NotificationFilters>>(currentFilters);
  const { dialogRef } = useDialogA11y({ isOpen, onClose });

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
    const current = filters.categoryIds || [];
    const updated = current.includes(categoryId)
      ? current.filter(id => id !== categoryId)
      : [...current, categoryId];
    setFilters({ ...filters, categoryIds: updated });
  };

  const handleCityToggle = (cityId: string) => {
    const current = filters.cityIds || [];
    const updated = current.includes(cityId)
      ? current.filter(id => id !== cityId)
      : [...current, cityId];
    setFilters({ ...filters, cityIds: updated });
  };

  const handlePropertyTypeToggle = (type: string) => {
    const current = filters.propertyTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setFilters({ ...filters, propertyTypes: updated });
  };

  const handlePublisherTypeToggle = (type: 'OWNER' | 'BROKER') => {
    const current = filters.publisherTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setFilters({ ...filters, publisherTypes: updated });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-filters-title"
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 id="newsletter-filters-title" className="text-xl font-bold text-black">הגדרת מסננים להתראות</h2>
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
            <h3 className="font-semibold text-black mb-3">קטגוריות</h3>
            <div className="text-sm text-gray-800 mb-2">בחר את הקטגוריות שמעניינות אותך</div>
            <div className="grid grid-cols-2 gap-2">
              {categories?.map((category: any) => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={filters.categoryIds?.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-900">{category.nameHe}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cities */}
          <div>
            <h3 className="font-semibold text-black mb-3">ערים</h3>
            <div className="text-sm text-gray-800 mb-2">בחר את הערים שמעניינות אותך</div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
              {cities?.map((city: any) => (
                <label key={city.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={filters.cityIds?.includes(city.id)}
                    onChange={() => handleCityToggle(city.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-900">{city.nameHe || city.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-semibold text-black mb-3">טווח מחירים</h3>
            <div className="text-sm text-gray-800 mb-2">הגדר את טווח המחירים המתאים לך</div>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm text-gray-900 mb-1 font-medium">מחיר מינימלי</label>
                <input
                  type="number"
                  value={filters.minPrice ?? ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    minPrice: e.target.value ? Number(e.target.value) : null,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="מינימום ₪"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-900 mb-1 font-medium">מחיר מקסימלי</label>
                <input
                  type="number"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    maxPrice: e.target.value ? Number(e.target.value) : null,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="מקסימום ₪"
                />
              </div>
            </div>
          </div>

          {/* Property Types */}
          <div>
            <h3 className="font-semibold text-black mb-3">סוג נכס</h3>
            <div className="text-sm text-gray-800 mb-2">בחר את סוגי הנכסים שמעניינים אותך</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'APARTMENT', label: 'דירה' },
                { value: 'HOUSE', label: 'בית פרטי' },
                { value: 'GARDEN_APARTMENT', label: 'דירת גן' },
                { value: 'PENTHOUSE', label: 'פנטהאוז' },
                { value: 'DUPLEX', label: 'דופלקס' },
                { value: 'STUDIO', label: 'סטודיו' },
                { value: 'LAND', label: 'מגרש' },
              ].map((type) => (
                <label key={type.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={filters.propertyTypes?.includes(type.value)}
                    onChange={() => handlePropertyTypeToggle(type.value)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-900">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Publisher Type */}
          <div>
            <h3 className="font-semibold text-black mb-3">סוג מפרסם</h3>
            <div className="text-sm text-gray-800 mb-2">בחר מי רשאי לפרסם מודעות שתקבל</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded flex-1">
                <input
                  type="checkbox"
                  checked={filters.publisherTypes?.includes('OWNER')}
                  onChange={() => handlePublisherTypeToggle('OWNER')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-900">בעלים בלבד</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded flex-1">
                <input
                  type="checkbox"
                  checked={filters.publisherTypes?.includes('BROKER')}
                  onChange={() => handlePublisherTypeToggle('BROKER')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-900">מתווכים</span>
              </label>
            </div>
            <div className="text-xs text-gray-700 mt-1">
              {!filters.publisherTypes || filters.publisherTypes.length === 0 
                ? 'לא נבחר סוג מפרסם - תקבל מודעות מכולם'
                : 'תקבל מודעות רק מהסוגים שנבחרו'}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📋 סיכום הבחירות שלך:</h4>
            <div className="text-sm text-gray-900 space-y-1">
              <div>• קטגוריות: {filters.categoryIds?.length || 0} נבחרו</div>
              <div>• ערים: {filters.cityIds?.length || 0} נבחרו</div>
              <div>• מחיר: {filters.minPrice ? `מ-₪${filters.minPrice.toLocaleString()}` : 'ללא מינימום'} {filters.maxPrice ? `עד ₪${filters.maxPrice.toLocaleString()}` : 'ללא מקסימום'}</div>
              <div>• סוגי נכס: {filters.propertyTypes?.length || 0} נבחרו</div>
              <div>• מפרסמים: {
                !filters.publisherTypes || filters.publisherTypes.length === 0 
                  ? 'הכל'
                  : filters.publisherTypes.map(t => t === 'OWNER' ? 'בעלים' : 'מתווכים').join(', ')
              }</div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={updatePreferencesMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {updatePreferencesMutation.isPending ? 'שומר...' : 'שמירה'}
          </button>
        </div>

        {updatePreferencesMutation.isSuccess && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
            ✓ המסננים נשמרו בהצלחה!
          </div>
        )}

        {updatePreferencesMutation.isError && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg">
            ✗ שגיאה בשמירת המסננים
          </div>
        )}
      </div>
    </div>
  );
}
