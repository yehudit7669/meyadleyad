import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adsService, categoriesService, citiesService, streetsService } from '../services/api';
import ImageUpload from '../components/ImageUpload';
import AvailabilityEditor from '../components/appointments/AvailabilityEditor';

export default function EditAd() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const streetDropdownRef = useRef<HTMLDivElement>(null);
  
  const [streetSearch, setStreetSearch] = useState('');
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    adType: '',
    cityId: '',
    streetId: '',
    neighborhood: '',
    images: [] as any[],
    customFields: {} as any,
  });

  // Fetch full ad data
  const { data: ad, isLoading: adLoading } = useQuery({
    queryKey: ['ad', id],
    queryFn: () => adsService.getAd(id!),
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });

  // Get selected category details
  const selectedCategory = categories?.find((cat: any) => cat.id === formData.categoryId);
  const categorySlug = selectedCategory?.slug || '';

  // Define features based on category
  const getCategoryFeatures = () => {
    // דירות נופש / שבת
    if (categorySlug.includes('holiday') || categorySlug.includes('shabbat') || categorySlug.includes('vacation')) {
      return [
        { key: 'plata', label: 'פלטה' },
        { key: 'urn', label: 'מיחם' },
        { key: 'linens', label: 'מצעים' },
        { key: 'pool', label: 'בריכה' },
        { key: 'kidsGames', label: 'משחקי ילדים' },
        { key: 'babyBed', label: 'מיטת תינוק' },
        { key: 'masterUnit', label: 'יחידת הורים' },
        { key: 'sleepingOnly', label: 'לינה בלבד' },
        { key: 'parking', label: 'חניה' },
        { key: 'balcony', label: 'מרפסת' },
        { key: 'airConditioning', label: 'מיזוג אוויר' },
      ];
    }
    
    // דירה למכירה
    if (categorySlug.includes('sale') || categorySlug.includes('for-sale')) {
      return [
        { key: 'parking', label: 'חניה' },
        { key: 'elevator', label: 'מעלית' },
        { key: 'balcony', label: 'מרפסת' },
        { key: 'storage', label: 'מחסן' },
        { key: 'airConditioning', label: 'מיזוג אוויר' },
        { key: 'heating', label: 'חימום' },
        { key: 'mamad', label: 'ממ"ד' },
        { key: 'view', label: 'נוף' },
        { key: 'masterUnit', label: 'יחידת הורים' },
        { key: 'housingUnit', label: 'יחידת דיור' },
        { key: 'yard', label: 'חצר' },
        { key: 'option', label: 'אופציה' },
      ];
    }
    
    // דירה להשכרה (דיפולט לנדל"ן)
    return [
      { key: 'parking', label: 'חניה' },
      { key: 'elevator', label: 'מעלית' },
      { key: 'balcony', label: 'מרפסת' },
      { key: 'storage', label: 'מחסן' },
      { key: 'airConditioning', label: 'מיזוג אוויר' },
      { key: 'heating', label: 'חימום' },
      { key: 'mamad', label: 'ממ"ד' },
      { key: 'view', label: 'נוף' },
      { key: 'masterUnit', label: 'יחידת הורים' },
      { key: 'housingUnit', label: 'יחידת דיור' },
      { key: 'yard', label: 'חצר' },
    ];
  };

  const categoryFeatures = getCategoryFeatures();

  const { data: beitShemeshCity } = useQuery({
    queryKey: ['beit-shemesh-city'],
    queryFn: citiesService.getBeitShemesh,
  });

  const { data: allStreets } = useQuery({
    queryKey: ['all-streets', formData.cityId],
    queryFn: () => streetsService.getStreets({
      cityId: formData.cityId,
      limit: 500,
    }),
    enabled: !!formData.cityId,
  });

  const { data: searchedStreets } = useQuery({
    queryKey: ['streets-search', streetSearch, formData.cityId],
    queryFn: () => streetsService.getStreets({
      query: streetSearch,
      cityId: formData.cityId,
      limit: 50,
    }),
    enabled: !!formData.cityId && streetSearch.length >= 2,
  });

  // Load ad data into form
  useEffect(() => {
    if (ad) {
      // Extract features from customFields (they might be nested)
      const loadedCustomFields = ad.customFields || {};
      const features = loadedCustomFields.features || {};
      
      // Merge features into the main customFields object for easier access
      const mergedCustomFields = {
        ...loadedCustomFields,
        ...features, // Spread features so they're at the root level
      };
      
      setFormData({
        title: ad.title || '',
        description: ad.description || '',
        price: ad.price ? String(ad.price) : '',
        categoryId: ad.category?.id || ad.categoryId || '',
        adType: ad.adType || '',
        cityId: ad.city?.id || ad.cityId || '',
        streetId: ad.street?.id || ad.streetId || '',
        neighborhood: ad.neighborhood || '',
        images: ad.images?.map((img: any) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
        })) || [],
        customFields: mergedCustomFields,
      });
      
      if (ad.street?.name) {
        setStreetSearch(ad.street.name);
      }
    }
  }, [ad]);

  // Set Beit Shemesh as default city
  useEffect(() => {
    if (beitShemeshCity && !formData.cityId && ad) {
      setFormData(prev => ({
        ...prev,
        cityId: beitShemeshCity.id,
      }));
    }
  }, [beitShemeshCity, ad]);

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

  const updateMutation = useMutation({
    mutationFn: (data: any) => adsService.updateAd(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', id] });
      queryClient.invalidateQueries({ queryKey: ['my-ads'] });
      navigate(`/ads/${id}`, {
        state: { message: 'המודעה עודכנה בהצלחה!' },
      });
    },
  });

  // Extract error message from backend
  const getErrorMessage = () => {
    if (!updateMutation.error) return '';
    
    const error = updateMutation.error as any;
    
    // Try to get message from response
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      return 'נדרש להתחבר למערכת כדי לעדכן מודעה';
    }
    
    if (error.response?.status === 403) {
      return 'אין לך הרשאה לעדכן מודעה זו';
    }
    
    if (error.response?.status === 413) {
      return 'התמונות גדולות מדי. אנא צמצם אותן או העלה פחות תמונות';
    }
    
    if (error.response?.status === 400) {
      return error.response?.data?.message || 'נתונים לא תקינים. אנא בדוק את כל השדות';
    }
    
    if (error.response?.status === 404) {
      return 'המודעה, הקטגוריה או העיר שנבחרו לא נמצאו במערכת';
    }
    
    if (error.response?.status === 500) {
      return 'שגיאת שרת. אנא נסה שוב מאוחר יותר';
    }
    
    // Try to get error message from error object
    if (error.message) {
      return error.message;
    }
    
    // Fallback
    return 'שגיאה בעדכון המודעה. אנא נסה שוב.';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCustomFieldChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      customFields: {
        ...formData.customFields,
        [field]: value,
      },
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

  const handleImagesChange = (images: any[]) => {
    setFormData({
      ...formData,
      images,
    });
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await adsService.deleteImage(imageId);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ולידציה - שדות חובה
    if (!formData.title || !formData.categoryId || !formData.streetId) {
      alert('נא למלא את כל השדות החובה: כותרת, קטגוריה ורחוב');
      return;
    }
    
    // ולידציה - תיאור אופציונלי, אם יש - מקסימום 16 מילים
    if (formData.description && formData.description.trim()) {
      const wordCount = formData.description.trim().split(/\s+/).length;
      if (wordCount > 16) {
        alert('התיאור חייב להיות עד 16 מילים');
        return;
      }
    }
    
    // תמונות אופציונליות - אין מינימום
    
    try {
      updateMutation.mutate({
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : undefined,
        categoryId: formData.categoryId,
        adType: formData.adType,
        cityId: formData.cityId,
        streetId: formData.streetId,
        customFields: formData.customFields,
        images: formData.images,
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  if (adLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">המודעה לא נמצאה</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            חזרה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">עריכת מודעה</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* כותרת */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כותרת המודעה *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="לדוגמה: דירת 3 חדרים למכירה"
              />
            </div>

            {/* קטגוריה */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריה *</label>
              <select
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

            {/* עיר */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">עיר *</label>
              <input
                type="text"
                value="בית שמש"
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            {/* רחוב */}
            <div ref={streetDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">רחוב *</label>
              <div className="relative">
                <input
                  type="text"
                  value={streetSearch}
                  onChange={(e) => {
                    setStreetSearch(e.target.value);
                    setShowStreetDropdown(true);
                  }}
                  onFocus={() => setShowStreetDropdown(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="חפש רחוב..."
                />
                
                {showStreetDropdown && (streetSearch.length >= 2 ? searchedStreets : allStreets) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {(streetSearch.length >= 2 ? searchedStreets : allStreets)?.map((street: any) => (
                      <button
                        key={street.id}
                        type="button"
                        onClick={() => handleStreetSelect(street.id)}
                        className="w-full text-right px-4 py-2 hover:bg-blue-50 transition"
                      >
                        {street.name}
                        {street.neighborhoodName && (
                          <span className="text-sm text-gray-500 mr-2">({street.neighborhoodName})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* מחיר */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מחיר (₪)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            {/* פרטי נכס דינמיים */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">פרטי הנכס</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* חדרים */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">חדרים</label>
                  <input
                    type="number"
                    value={formData.customFields?.rooms || ''}
                    onChange={(e) => handleCustomFieldChange('rooms', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.5"
                    min="0"
                  />
                </div>

                {/* קומה */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">קומה</label>
                  <input
                    type="number"
                    value={formData.customFields?.floor || ''}
                    onChange={(e) => handleCustomFieldChange('floor', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* שטח */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שטח (מ״ר)</label>
                  <input
                    type="number"
                    value={formData.customFields?.squareMeters || formData.customFields?.size || ''}
                    onChange={(e) => handleCustomFieldChange('squareMeters', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* מספר בית */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מספר בית</label>
                  <input
                    type="text"
                    value={formData.customFields?.houseNumber || ''}
                    onChange={(e) => handleCustomFieldChange('houseNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* מצב הנכס */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מצב הנכס</label>
                  <select
                    value={formData.customFields?.condition || ''}
                    onChange={(e) => handleCustomFieldChange('condition', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">בחר מצב</option>
                    <option value="NEW">חדש</option>
                    <option value="EXCELLENT">מצוין</option>
                    <option value="GOOD">טוב</option>
                    <option value="MAINTAINED">מתוחזק</option>
                    <option value="RENOVATED">משופץ</option>
                    <option value="NEEDS_RENOVATION">דרוש שיפוץ</option>
                    <option value="OLD">ישן</option>
                  </select>
                </div>

                {/* סוג נכס */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סוג נכס</label>
                  <select
                    value={formData.customFields?.propertyType || ''}
                    onChange={(e) => handleCustomFieldChange('propertyType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">בחר סוג</option>
                    <option value="APARTMENT">דירה</option>
                    <option value="HOUSE">בית פרטי</option>
                    <option value="GARDEN_APARTMENT">דירת גן</option>
                    <option value="PENTHOUSE">פנטהאוז</option>
                    <option value="DUPLEX">דופלקס</option>
                    <option value="STUDIO">סטודיו</option>
                    <option value="COTTAGE">קוטג'</option>
                    <option value="VILLA">וילה</option>
                    <option value="TOWNHOUSE">בית טורי</option>
                  </select>
                </div>

                {/* ריהוט */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ריהוט</label>
                  <select
                    value={formData.customFields?.furniture || ''}
                    onChange={(e) => handleCustomFieldChange('furniture', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">בחר</option>
                    <option value="NONE">ללא</option>
                    <option value="PARTIAL">חלקי</option>
                    <option value="FULL">מלא</option>
                    <option value="FURNISHED">מרוהט</option>
                    <option value="UNFURNISHED">לא מרוהט</option>
                  </select>
                </div>

                {/* ארנונה */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ארנונה (₪)</label>
                  <input
                    type="number"
                    value={formData.customFields?.arnona || ''}
                    onChange={(e) => handleCustomFieldChange('arnona', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* ועד בית */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ועד בית (₪)</label>
                  <input
                    type="number"
                    value={formData.customFields?.vaad || ''}
                    onChange={(e) => handleCustomFieldChange('vaad', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* תאריך כניסה */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תאריך כניסה</label>
                  <input
                    type="date"
                    value={formData.customFields?.entryDate || ''}
                    onChange={(e) => handleCustomFieldChange('entryDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* פרטי קשר */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">פרטי קשר נוספים</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">שם איש קשר</label>
                    <input
                      type="text"
                      value={formData.customFields?.contactName || ''}
                      onChange={(e) => handleCustomFieldChange('contactName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="שם מלא"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">טלפון ליצירת קשר</label>
                    <input
                      type="tel"
                      value={formData.customFields?.contactPhone || ''}
                      onChange={(e) => handleCustomFieldChange('contactPhone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="05X-XXXXXXX"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">השלמת כתובת</label>
                    <input
                      type="text"
                      value={formData.customFields?.addressSupplement || ''}
                      onChange={(e) => handleCustomFieldChange('addressSupplement', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="למשל: קומה 3, דירה 8 או כניסה ב'"
                    />
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">מאפיינים נוספים</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryFeatures.map((feature) => (
                    <label key={feature.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.customFields?.[feature.key] || false}
                        onChange={(e) => handleCustomFieldChange(feature.key, e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-900">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* תיאור */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תיאור (אופציונלי, עד 16 מילים)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="תאר את הנכס בפירוט..."
              />
              <div className="text-sm text-gray-500 mt-1">
                {formData.description.trim().length > 0 
                  ? `${formData.description.trim().split(/\s+/).length} מילים (מתוך 16)` 
                  : '0 מילים (מתוך 16)'}
              </div>
            </div>

            {/* תמונות */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">תמונות</h2>
              <ImageUpload 
                images={formData.images} 
                onChange={handleImagesChange} 
                onDeleteExisting={handleDeleteImage}
              />
            </div>

            {/* זמינות לפגישות */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">זמינות לפגישות</h2>
              <AvailabilityEditor adId={id!} />
            </div>

            {/* כפתורים */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {updateMutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                ביטול
              </button>
            </div>

            {updateMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold mb-1">שגיאה בעדכון המודעה</p>
                <p className="text-red-600 text-sm">{getErrorMessage()}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
