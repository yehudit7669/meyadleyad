import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesService, citiesService, streetsService } from '../services/api';
import ImageUpload from './ImageUpload';

interface AdFormProps {
  initialData?: {
    title: string;
    description: string;
    price?: number;
    categoryId: string;
    cityId?: string;
    streetId?: string;
    images?: { url: string; file?: File }[];
  };
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  submitButtonText?: string;
}

export default function AdForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitButtonText = 'פרסם מודעה',
}: AdFormProps) {
  const [step, setStep] = useState(1);
  const [streetSearch, setStreetSearch] = useState('');
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const streetDropdownRef = useRef<HTMLDivElement>(null);
  const [sendCopyToEmail, setSendCopyToEmail] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price ? String(initialData.price) : '',
    categoryId: initialData?.categoryId || '',
    cityId: initialData?.cityId || '',
    streetId: initialData?.streetId || '',
    neighborhood: '',
    images: initialData?.images || [],
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });

  // Get Beit Shemesh city as the default (and only) city
  const { data: beitShemeshCity } = useQuery({
    queryKey: ['beit-shemesh-city'],
    queryFn: citiesService.getBeitShemesh,
  });

  // Get all streets for the dropdown (without search filter)
  const { data: allStreets } = useQuery({
    queryKey: ['all-streets', formData.cityId],
    queryFn: () => streetsService.getStreets({
      cityId: formData.cityId,
      limit: 500,
    }),
    enabled: !!formData.cityId,
  });

  // Set Beit Shemesh as default city when loaded
  useEffect(() => {
    if (beitShemeshCity && !formData.cityId) {
      setFormData(prev => ({
        ...prev,
        cityId: beitShemeshCity.id,
      }));
    }
  }, [beitShemeshCity]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (streetDropdownRef.current && !streetDropdownRef.current.contains(event.target as Node)) {
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

  // Get streets based on search query
  const { data: searchedStreets, isLoading: streetsLoading } = useQuery({
    queryKey: ['streets-search', streetSearch, formData.cityId],
    queryFn: () => streetsService.getStreets({
      query: streetSearch,
      cityId: formData.cityId,
      limit: 50,
    }),
    enabled: !!formData.cityId && streetSearch.length >= 2,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleStreetSelect = (streetId: string) => {
    const selectedStreet = allStreets?.find((s: any) => s.id === streetId) || 
                          searchedStreets?.find((s: any) => s.id === streetId);
    setFormData({
      ...formData,
      streetId,
      neighborhood: selectedStreet?.neighborhoodName || '',
    });
    setStreetSearch(selectedStreet?.name || '');
    setShowStreetDropdown(false);
  };

  const handleStreetSelectFromDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const streetId = e.target.value;
    if (streetId) {
      handleStreetSelect(streetId);
    }
  };

  const handleImagesChange = (images: any[]) => {
    setFormData({
      ...formData,
      images,
    });
  };

  const handleNext = () => {
    if (step === 1 && (!formData.title || !formData.categoryId || !formData.streetId)) {
      alert('נא למלא את כל השדות החובה');
      return;
    }
    // התיאור אופציונלי - אין צורך בוולידציה
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      description: formData.description,
      price: formData.price ? parseFloat(formData.price) : undefined,
      categoryId: formData.categoryId,
      cityId: formData.cityId,
      streetId: formData.streetId,
      images: formData.images,
      sendCopyToEmail,
    });
  };

  const totalSteps = 3;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full mx-1 transition ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="text-center text-sm text-gray-600">
          שלב {step} מתוך {totalSteps}
        </div>
      </div>

      {/* Step 1: פרטים בסיסיים */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-6">פרטים בסיסיים</h2>

          <div>
            <label htmlFor="ad-title" className="block text-sm font-medium text-gray-700 mb-2">
              כותרת המודעה *
            </label>
            <input
              id="ad-title"
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="לדוגמה: דירת 3 חדרים למכירה"
            />
          </div>

          <div>
            <label htmlFor="ad-category" className="block text-sm font-medium text-gray-700 mb-2">קטגוריה *</label>
            <select
              id="ad-category"
              name="categoryId"
              required
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">בחר קטגוריה</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameHe}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">עיר *</label>
            <input
              type="text"
              value="בית שמש"
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">כרגע המערכת פועלת רק בבית שמש</p>
          </div>

          <div ref={streetDropdownRef}>
            <label htmlFor="street-search" className="block text-sm font-medium text-gray-700 mb-2">
              רחוב *
            </label>
            
            {/* Combo box: Dropdown + Search */}
            <div className="relative">
              {/* Search input */}
              <div className="relative">
                <input
                  id="street-search"
                  type="text"
                  value={streetSearch}
                  onChange={(e) => {
                    setStreetSearch(e.target.value);
                    setShowStreetDropdown(e.target.value.length >= 2);
                  }}
                  onFocus={() => setShowStreetDropdown(streetSearch.length >= 2)}
                  placeholder="התחל להקליד שם רחוב או בחר מהרשימה..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pl-10"
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

              {/* Dropdown select (hidden visually but used for browsing) */}
              <select
                value={formData.streetId}
                onChange={handleStreetSelectFromDropdown}
                onFocus={() => setShowStreetDropdown(true)}
                className="sr-only"
                aria-label="בחר רחוב מהרשימה"
              >
                <option value="">בחר רחוב</option>
                {allStreets?.map((street: any) => (
                  <option key={street.id} value={street.id}>
                    {street.name} {street.neighborhoodName ? `(${street.neighborhoodName})` : ''}
                  </option>
                ))}
              </select>

              {/* Combined dropdown: shows either search results or all streets */}
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
                              onClick={() => handleStreetSelect(street.id)}
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
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
                              onClick={() => handleStreetSelect(street.id)}
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
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

            {formData.streetId && (
              <div className="mt-2 text-sm text-green-600">
                ✓ נבחר רחוב: {streetSearch}
              </div>
            )}
          </div>

          {formData.neighborhood && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שכונה</label>
              <input
                type="text"
                value={formData.neighborhood}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">השכונה מתמלאת אוטומטית לפי הרחוב שנבחר</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מחיר (₪)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
            />
          </div>

          <button
            type="button"
            onClick={handleNext}
            aria-label="המשך לשלב הבא"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            המשך ←
          </button>
        </div>
      )}

      {/* Step 2: תיאור */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-6">תיאור המודעה</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תיאור (אופציונלי)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="תאר את המוצר/שירות בפירוט...&#10;&#10;כלול מידע חשוב כמו:&#10;• מצב המוצר&#10;• מאפיינים&#10;• מחיר&#10;• זמינות"
            />
            <div className="text-sm text-gray-500 mt-1">
              {formData.description.length} תווים
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="חזור לשלב הקודם"
              className="flex-1 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              → חזור
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="המשך לשלב הבא"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              המשך ←
            </button>
          </div>
        </div>
      )}

      {/* Step 3: תמונות */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-6">העלאת תמונות</h2>

          <ImageUpload images={formData.images} onChange={handleImagesChange} />

          {/* Checkbox לשליחת עותק במייל */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={sendCopyToEmail}
                onChange={(e) => setSendCopyToEmail(e.target.checked)}
                className="mt-1 ml-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900">
                  שלח לי את המודעה שלי במייל כקובץ PDF
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  קבל עותק דיגיטלי של המודעה שפרסמת - נוח לשמירה ושיתוף
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="חזור לשלב הקודם"
              className="flex-1 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              → חזור
            </button>
            <button
              type="submit"
              disabled={isLoading}
              aria-label="פרסם מודעה"
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {isLoading ? 'מפרסם...' : submitButtonText}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
